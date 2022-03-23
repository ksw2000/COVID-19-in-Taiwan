# COVID-19-in-Taiwan

![](https://img.shields.io/github/license/liao2000/COVID-19-in-Taiwan?style=flat-square) ![](https://img.shields.io/github/stars/liao2000/COVID-19-in-Taiwan?style=flat-square) ![](https://img.shields.io/github/workflow/status/liao2000/COVID-19-in-Taiwan/Node.js%20Package?style=flat-square)

![](https://i.imgur.com/yGYcsAw.png)

臺灣境內近期COVID-19本土確診、境外移入、死亡數據(含校正回歸)、及疫苗施打狀況

數據若有錯可以發 issue 或 pull request

[https://liao2000.github.io/COVID-19-in-Taiwan/](https://liao2000.github.io/COVID-19-in-Taiwan/)

## get_data.js

1. 從指揮中心新聞稿透過**神祕的演算法**取得「每日確診數」(境外、本土、死亡) [data/dataset-robot.json](./data/dataset-robot.json)
2. 從指揮中心開放資料庫取得最新疫情狀況 [data/latest_statistic.json](./data/latest_statistic.json)
3. 從指揮中心開放資料庫取得確診者所在縣市資料 `[data/city_statistic.json](./data/city_statistic.json)

## 檔案架構
+ /
    + [data/](#)
        + [city_statistic.json](./data/city_statistic.json) *各縣市累積及14天內確診者數量*
        + [dataset-2021.json](./data/dataset-2021.json) *2021/5/11 至年底確診數據(人工維護)*
        + [dataset-2022.json](./data/dataset-2022.json) *2022 年確診數據(人工維護)*
        + [dataset-robot.json](./data/dataset-robot.json) *機器人透過新聞稿分析詞句抓取確診數據*
        + [latest_static.json](./data/latest_statistic.json) *Covid-19在台累積數據*
        + [vaccine.json](./data/vaccine.json) *疫苗現況(人工維護)*
    + [get_data.js](./get_data.js) *每日 16:00 定時抓取資料*
    + [index.html](./index.html) *網頁主畫面*
    + [main.css](./main.css) *網頁樣式表*
    + [main.js](./main.js) *網頁前端*

![](./data/%E6%AD%A3%E7%A2%BA%E6%B4%97%E6%89%8B.jpg)