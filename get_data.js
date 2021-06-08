const fs = require('fs');
const https = require('https');

// get data from CDC
https.get('https://od.cdc.gov.tw/eic/Day_Confirmation_Age_County_Gender_19CoV.json', (res) => {
    let buffers = [];
    res.on('data', chunk => {
        buffers += chunk;
    });
    res.on('end', () => {
        let jsonData = JSON.parse(buffers);
        
        let before14Day = new Date((new Date()).valueOf() - 1000 * 60 * 60 * 24 * 14);
            before14Day = before14Day.getFullYear() * 10000 + (before14Day.getMonth() + 1) * 100 + before14Day.getDate();

        let tasks = [{
            df: 20210511,
            dataList:[]
        },{ 
            df: Number(before14Day),
            dataList: []
        }];


        for (let i = 0; i < tasks.length; i++){
            // select data where date > df
            let cityMap = {};
            jsonData.forEach(element => {
                if (element['是否為境外移入'] === '否' && Number(element['個案研判日']) >= tasks[i].df && typeof element['縣市'] != 'undefined') {
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

            tasks[i].dataList.forEach((e)=>{
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
        fs.writeFileSync('city_statistic.json', JSON.stringify(output, null, '\t'), { flag: 'w+' })
    });
});