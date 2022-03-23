const fs = require('fs');
const https = require('https');
const outputFile = './data/dataset-robot.json';
const rootURL = 'https://www.cdc.gov.tw/Category/NewsPage/EmXemht4IT-IRAPrAnyG9A';
const threshold = 30;

// 盡可能抓取資料，若有缺就不抓
function textRecognize(title, text) {
    text = text.replace(/[\r\n]/mg, '').replace(/\s+/g, ' ');
    ret = {}
    // 抓日期，抓不到回傳 null
    let date = /<div class="date text-right">(.*?)<\/div>/.exec(text);
    if (date === null) return null;
    date = /(\d+)\/(\d+)\/(\d+)/.exec(date[1]);
    if (date === null) return null;
    if (date != null) {
        ret['date'] = {
            y: Number(date[1]),
            m: Number(date[2]),
            d: Number(date[3])
        }
    }

    // 抓死亡數，抓不到回傳 null
    let content = /<p class="con-word">(.*?)<\/p>/.exec(text);
    if (content === null) return null;
    let input = content[1];

    // 尋找死亡數
    if (input.search("無新增死亡") != -1) {
        ret['死亡'] = 0;
    } else {
        let res = /(\d+)例死亡/.exec(input);
        if (res === null) return null;
        ret['死亡'] = Number(res[1]);
    }

    
    // 確診資訊直接從標題抓
    index = title.search('分別為');
    if (index != -1) {
        // 同時有本土與境外
        let res = /(\d+)例本土.*?(\d+)例境外移入/.exec(title.substring(index));
        if (res === null) return null;
        ret['本土'] = Number(res[1]);
        ret['境外'] = Number(res[2]);
    } else {
        // 僅有境外
        let res = /新增(\d+)例.*?境外移入/.exec(title);
        if (res === null) return null;
        ret['本土'] = 0;
        ret['境外'] = Number(res[1]);
    }

    return ret;
}

// get data from CDC
https.get(rootURL, (res) => {
    let buffers = [];
    let size = 0;
    res.on('data', chunk => {
        buffers.push(chunk);
        size += chunk.length;
    });
    res.on('end', () => {
        buffers = Buffer.concat(buffers, size);
        let content = buffers.toString();
        content = content.replace(/[\r\n]/mg, '').replace(/\s+/g, ' ');
        let table = content.match(/<tbody>([\s\S]*?)<\/tbody>/)[0];
        let linksReg = /href="(.*?)" title="(.*?)"/g;
        let links = [];
        for (let match = linksReg.exec(table); match !== null; match = linksReg.exec(table)) {
            links.push({
                link: match[1],
                title: match[2]
            });
        }

        let jobs = [];
        for (let i = 0; i < links.length && i < threshold; i++) {
            if (links[i].title.match(/^新增/) === null) {
                continue;
            }
            jobs.push(new Promise((resolve) => {
                https.get('https://www.cdc.gov.tw' + links[i].link, (res) => {
                    let buffers = [];
                    let size = 0;
                    res.on('data', chunk => {
                        buffers.push(chunk);
                        size += chunk.length;
                    });
                    res.on('end', () => {
                        let result = textRecognize(links[i].title, Buffer.concat(buffers, size).toString());
                        resolve({
                            link: links[i].link,
                            res: result
                        });
                    });
                }).on('error', () => {
                    resolve(null);
                });
            }));
        }
        Promise.all(jobs).then((resList) => {
            const originalData = fs.readFileSync(outputFile);
            output = JSON.parse(originalData);

            resList.sort((a, b) => {
                if (a.res == null) return 0;
                if (b.res == null) return 0;
                return (a.res.date.m - b.res.date.m != 0) ?
                    a.res.date.m - b.res.date.m:
                    a.res.date.d - b.res.date.d;
            })
            resList.forEach(job => {
                if (job.res != null && job.res.date.y === 2022) {
                    let key = `${job.res.date.m}-${job.res.date.d}`;
                    output[key] = {
                        "境外": job.res["境外"],
                        "本土": job.res["本土"],
                        "死亡": job.res["死亡"],
                        "校正回歸": {},
                        "url": [
                            `https://www.cdc.gov.tw${job.link}`
                        ]
                    }
                }
            });
            fs.writeFileSync(outputFile, JSON.stringify(output, null, '\t'), { flag: 'w+' })
        });
    });
});