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
        let dateFrom = 20210511;
        let cityMap = {};
        jsonData.forEach(element => {
            if (element['是否為境外移入'] === '否' && Number(element['個案研判日']) >= dateFrom && typeof element['縣市'] != 'undefined') {
                if (typeof cityMap[element['縣市']] === 'undefined') {
                    console.log(element['縣市']);
                    cityMap[element['縣市']] = 1;
                } else {
                    cityMap[element['縣市']]++;
                }
            }
        });
        console.log(cityMap);
        let date = new Date();
        let yyyy = date.getFullYear();
        let m = date.getMonth() + 1;
        let mm = (m < 10) ? `0${m}` : `${m}`;
        let d = date.getDate();
        let dd = (d < 10) ? `0${d}` : `${d}`;

        let output = {
            dateFrom: dateFrom,
            lastModified: `${yyyy}${mm}${dd}`,
            data: cityMap
        }
        fs.writeFileSync('city_statistic.json', JSON.stringify(output), { flag: 'w+' })
    });
});