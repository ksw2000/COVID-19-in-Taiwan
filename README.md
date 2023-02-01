# COVID-19-in-Taiwan

![](https://img.shields.io/github/license/ksw2000/COVID-19-in-Taiwan?style=flat-square) [![](https://img.shields.io/github/issues/ksw2000/COVID-19-in-Taiwan?style=flat-square&color=orange)](https://github.com/ksw2000/COVID-19-in-Taiwan/issues) ![](https://img.shields.io/github/stars/ksw2000/COVID-19-in-Taiwan?style=flat-square) ![](https://img.shields.io/github/actions/workflow/status/ksw2000/COVID-19-in-Taiwan/data.yaml?branch=main&style=flat-square) ![](https://i.imgur.com/yGYcsAw.png)

臺灣境內近期COVID-19本土確診、境外移入、死亡數據(含校正回歸)、及疫苗施打狀況

數據若有錯可以發 issue 或 pull request

[https://ksw2000.github.io/COVID-19-in-Taiwan/](https://ksw2000.github.io/COVID-19-in-Taiwan/)

## bot/get_data.js

1. 從指揮中心新聞稿透過**神祕的演算法**取得「每日確診數」(境外、本土、死亡) [data/dataset-robot.json](./data/dataset-robot.json)
2. 從指揮中心開放資料庫取得最新疫情狀況 [data/latest_statistic.json](./data/latest_statistic.json)
3. 從指揮中心開放資料庫取得確診者所在縣市資料 `[data/city_statistic.json](./data/city_statistic.json)

## bot/vaccine.js

從[指揮中心疫苗網頁](https://www.cdc.gov.tw/Category/Page/9jFXNbCe-sFK9EImRRi2Og)抓取 pdf 檔，經 `pdf2html` 轉檔後，再萃取出相關數據

## 檔案架構
+ /
    + [bot/](#) *後端爬蟲*
        + [get_data.js](./bot/get_data.js) *定時抓取確診數據*
        + [get_vaccine.js](./bot/get_vaccine.js) *定時抓取疫苗數據*
    + [data/](#)
        + [city_statistic.json](./data/city_statistic.json) *各縣市累積及14天內確診者數量*
        + [dataset-2021.json](./data/dataset-2021.json) *2021/5/11 至年底確診數據(人工維護)*
        + [dataset-2022.json](./data/dataset-2022.json) *2022 年確診數據(人工維護)*
        + [dataset-robot.json](./data/dataset-robot.json) *機器人透過新聞稿分析詞句抓取確診數據*
        + [latest_static.json](./data/latest_statistic.json) *Covid-19在台累積數據*
        + [vaccine.json](./data/vaccine.json) *疫苗現況(人工維護 2022/4 改由機器抓取)*
    + [index.html](./index.html) *網頁主畫面*
    + [main.css](./main.css) *網頁樣式表*
    + [main.js](./main.js) *網頁前端*

## 新聞稿確診數分析演算法

```js
/**
 * @param string title 新聞稿連結標題
 * @param string text 新聞稿本文
 * @return Object | null
 */
static textRecognize(title, text) {
    text = text.replace(/[\r\n]/mg, '').replace(/\s+/g, ' ');
    let ret = {};
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
    let index = title.search('分別為');
    if (index != -1) {
        // 同時有本土與境外
        let res = /([,\d]+)例本土.*?([,\d]+)例境外移入/.exec(title.substring(index));
        if (res === null) return null;
        ret['本土'] = Number(res[1].replace(',', ''));
        ret['境外'] = Number(res[2].replace(',', ''));
    } else {
        // 僅有境外
        let res = /新增([,\d]+)例.*?境外移入/.exec(title);
        if (res === null) return null;
        ret['本土'] = 0;
        ret['境外'] = Number(res[1].replace(',', ''));
    }

    return ret;
}
```

![](./data/%E6%AD%A3%E7%A2%BA%E6%B4%97%E6%89%8B.jpg)
