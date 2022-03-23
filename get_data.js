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

// get data from CDC (新聞稿) 機器人神祕斷詞來找每日確診數
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
                    a.res.date.m - b.res.date.m :
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

// 2021/06/16 -> 20210616
function dateConvert(str) {
    return Number(str.split("/").join(""))
}

// get data from CDC (抓累積人數，資料是別人整理好的)
https.get({
    hostname: 'od.cdc.gov.tw',
    path: '/eic/Day_Confirmation_Age_County_Gender_19CoV.json',
    rejectUnauthorized: false
}, (res) => {
    let buffers = [];
    let size = 0;
    res.on('data', chunk => {
        buffers.push(chunk);
        size += chunk.length;
    });
    res.on('end', () => {
        buffers = Buffer.concat(buffers, size);
        let jsonData = JSON.parse(buffers.toString());

        let before14Day = new Date((new Date()).valueOf() - 1000 * 60 * 60 * 24 * 14);
        before14Day = before14Day.getFullYear() * 10000 + (before14Day.getMonth() + 1) * 100 + before14Day.getDate();

        let tasks = [{
            df: 20210511,
            dataList: []
        }, {
            df: Number(before14Day),
            dataList: []
        }];


        for (let i = 0; i < tasks.length; i++) {
            // select data where date > df
            let cityMap = {};
            jsonData.forEach(element => {
                if (element['是否為境外移入'] === '否' && dateConvert(element['個案研判日']) >= tasks[i].df && typeof element['縣市'] != 'undefined') {
                    if (typeof cityMap[element['縣市']] === 'undefined') {
                        cityMap[element['縣市']] = 1;
                    } else {
                        cityMap[element['縣市']]++;
                    }
                }
            });

            // sorting data and get proportion
            let sum = 0;
            Object.keys(cityMap).forEach(city => {
                sum += cityMap[city];
                tasks[i].dataList.push({
                    city: city,
                    num: cityMap[city],
                    proportion: 0
                });
            });

            tasks[i].dataList.sort((a, b) => {
                return (a.num < b.num) ? 1 : -1;
            });

            tasks[i].dataList.forEach((e) => {
                e.proportion = e.num / sum;
            });
        }

        let date = new Date();
        let h = date.getHours().toString();
        let m = date.getMinutes().toString();
        let output = {
            lastModified: `${date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()}-${h.padStart(2, 0)}:${m.padStart(2, 0)}`,
            dataList: {
                from511: tasks[0].dataList,
                before14: tasks[1].dataList
            }
        }
        fs.writeFileSync('./data/city_statistic.json', JSON.stringify(output, null, '\t'), { flag: 'w+' })
    });
});

function oneLineCSVParser(str) {
    let list = Array.from(str);
    let res = [];
    let quoteMode = false;
    let stringBuffer = "";
    list.forEach((e) => {
        if (e != "\n" && e != "\r") {
            if (!quoteMode) {
                switch (e) {
                    case '"':
                        quoteMode = true;
                        break;
                    case ",":
                        res.push(stringBuffer);
                        stringBuffer = "";
                        break;
                    default:
                        stringBuffer += e;
                }
            } else {
                switch (e) {
                    case '"':
                        quoteMode = false;
                        break;
                    default:
                        stringBuffer += e;
                }
            }
        }
    });
    res.push(stringBuffer);
    return res;
}

https.get({
    hostname: 'od.cdc.gov.tw',
    path: '/eic/covid19/covid19_tw_stats.csv',
    rejectUnauthorized: false
}, res => {
    let buffers = [];
    res.on('data', chunk => {
        buffers += chunk;
    });
    res.on('end', () => {
        lines = buffers.toString().split('\n');
        key = oneLineCSVParser(lines[0]);
        val = oneLineCSVParser(lines[1]);

        let output = {};
        for (let i = 0; i < key.length; i++) {
            output[key[i]] = parseInt(val[i].replace(',', ''));
        }
        fs.writeFileSync('./data/latest_statistic.json', JSON.stringify(output, null, '\t'), { flag: 'w+' })
    });
});