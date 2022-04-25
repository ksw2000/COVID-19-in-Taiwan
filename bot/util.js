export class Util {
    // 2021/06/16 -> 20210616
    static dateConvert(str) {
        return Number(str.split("/").join(""))
    }

    // 盡可能抓取資料，若有缺就不抓
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

    static oneLineCSVParser(str) {
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
}