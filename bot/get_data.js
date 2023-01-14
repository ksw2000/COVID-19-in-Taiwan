import { readFileSync, writeFileSync } from 'fs';
import { Util } from './util.js';
import fetch from "node-fetch";

const rootURL = 'https://www.cdc.gov.tw/Category/NewsPage/EmXemht4IT-IRAPrAnyG9A';
const threshold = 30;
const output_dataset_robot = '../data/dataset-robot.json';
const output_city_statistic = '../data/city_statistic.json';
const output_latest_statistic = '../data/latest_statistic.json';

// get data from CDC (新聞稿) 機器人神祕斷詞來找每日確診數
fetch(rootURL).then(res => {
    return res.text();
}).then(content => {
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
            fetch('https://www.cdc.gov.tw' + links[i].link).then(res=>{
                return res.text();
            }).then(data=>{
                let result = Util.textRecognize(links[i].title, data);
                resolve({
                    link: links[i].link,
                    res: result
                });
            }).catch(e=>{
                resolve(null);
            });
        }));
    }
    Promise.all(jobs).then((resList) => {
        const originalData = readFileSync(output_dataset_robot);
        let output = JSON.parse(originalData);

        resList.sort((a, b) => {
            if (a.res == null) return 0;
            if (b.res == null) return 0;
            return (a.res.date.m - b.res.date.m != 0) ?
                a.res.date.m - b.res.date.m :
                a.res.date.d - b.res.date.d;
        })
        resList.forEach(job => {
            if (job.res != null && job.res.date.y === 2023) {
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
        writeFileSync(output_dataset_robot, JSON.stringify(output, null, '\t'), { flag: 'w+' })
    });
});

// get data from CDC (抓累積人數，資料是別人整理好的)
fetch('https://od.cdc.gov.tw/eic/Day_Confirmation_Age_County_Gender_19CoV.json').then(res => {
    return res.json();
}).then(jsonData => {
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
            if (element['是否為境外移入'] === '否' && Util.dateConvert(element['個案研判日']) >= tasks[i].df && typeof element['縣市'] != 'undefined') {
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
    writeFileSync(output_city_statistic, JSON.stringify(output, null, '\t'), { flag: 'w+' });
});


fetch('https://od.cdc.gov.tw/eic/covid19/covid19_tw_stats.csv').then(res => {
    return res.text();
}).then(data => {
    let lines = data.split('\n');
    let key = Util.oneLineCSVParser(lines[0]);
    let val = Util.oneLineCSVParser(lines[1]);

    let output = {};
    for (let i = 0; i < key.length; i++) {
        output[key[i]] = parseInt(val[i].replace(',', ''));
    }
    writeFileSync(output_latest_statistic, JSON.stringify(output, null, '\t'), { flag: 'w+' })
});