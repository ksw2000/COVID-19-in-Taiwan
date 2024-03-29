import fetch from "node-fetch";
import * as fs from 'fs';
import * as pdf2html from "pdf2html";

const outputFile = '../data/vaccine.json';
const source = 'https://www.cdc.gov.tw/Category/Page/9jFXNbCe-sFK9EImRRi2Og';
const pdfTempUrl = './data.pdf';

function extractNumber(input) {
    return Number(/劑\s+([0-9,]*?)\s+([0-9,]*)/.exec(input)[2].replace(/,/g, ''));
}

async function get_vaccine(pdf_url) {
    return new Promise((resolve, rejects)=>{
        pdf2html.html(pdf_url, (err, html) => {
            if (err) {
                rejects('Conversion error: ' + err);
            }
            html = html.replace(/\r?\n/g, '');
            const re = /<p>(.*?)<\/p>/g;

            let output = {};
            output.data = {};
            output.source = source;
            let date = new Date();
            output.lastFetched = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

            let list = [];
            for (let res = re.exec(html); res != null; res = re.exec(html)) {
                list.push(res[1].trim());
            }
            for (let i = 0; i < list.length; i++) {
                switch (list[i]){
                    case 'AstraZeneca':
                        output.data.astraZeneca = {};
                        output.data.astraZeneca.第一劑 = extractNumber(list[i + 1]);
                        output.data.astraZeneca.第二劑 = extractNumber(list[i + 2]);
                        output.data.astraZeneca.基礎加強劑 = extractNumber(list[i + 3]);
                        output.data.astraZeneca.追加劑 = extractNumber(list[i + 4]);
                        break;
                    case 'Moderna':
                        output.data.morderna = {};
                        console.log(list[i+1]);
                        output.data.morderna.第一劑 = extractNumber(list[i + 1]);
                        output.data.morderna.第二劑 = extractNumber(list[i + 2]);
                        output.data.morderna.基礎加強劑 = extractNumber(list[i + 3]);
                        output.data.morderna.追加劑 = extractNumber(list[i + 4]);
                        output.data.morderna.第二次追加劑 = extractNumber(list[i + 5]);
                        break;
                    // case 'Moderna 雙價 BA.1':
                    //     output.data.morderna雙價BA1 = {};
                    //     console.log(list[i+1]);
                    //     output.data.morderna雙價BA1.追加劑 = extractNumber(list[i + 1]);
                    //     output.data.morderna雙價BA1.第二次追加劑 = extractNumber(list[i + 2]);
                    //     output.data.morderna雙價BA1.第三次追加劑 = extractNumber(list[i + 3]);
                    //     break;
                    case '高端':
                        output.data.高端 = {};
                        output.data.高端.第一劑 = extractNumber(list[i + 1]);
                        output.data.高端.第二劑 = extractNumber(list[i + 2]);
                        output.data.高端.基礎加強劑 = extractNumber(list[i + 3]);
                        output.data.高端.追加劑 = extractNumber(list[i + 4]);
                        output.data.高端.第二次追加劑 = extractNumber(list[i + 5]);
                        break;
                    case 'BioNTech':
                        output.data.biontech = {};
                        output.data.biontech.第一劑 = extractNumber(list[i + 1]);
                        output.data.biontech.第二劑 = extractNumber(list[i + 2]);
                        output.data.biontech.基礎加強劑 = extractNumber(list[i + 3]);
                        output.data.biontech.追加劑 = extractNumber(list[i + 4]);
                        output.data.biontech.第二次追加劑 = extractNumber(list[i + 5]);
                        break;
                    case 'Novavax':
                        output.data.novavax = {};
                        output.data.novavax.第一劑 = extractNumber(list[i + 1]);
                        output.data.novavax.第二劑 = extractNumber(list[i + 2]);
                        output.data.novavax.基礎加強劑 = extractNumber(list[i + 3]);
                        output.data.novavax.追加劑 = extractNumber(list[i + 4]);
                        output.data.novavax.第二次追加劑 = extractNumber(list[i + 5]);
                        break;
                }
            }
            for (let j = list.length - 1; j >= 0; j--) {
                let res = list[j].match(/(\d+)\/(\d+)\/(\d+)/);
                if (res) {
                    let y = Number(res[1]) + 1911;
                    let m = res[2];
                    let d = res[3];
                    output.lastModified = `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
                    break;
                }
            }
            fs.writeFileSync(outputFile, JSON.stringify(output, null, '\t'), { flag: 'w' })
            resolve();
        });
    });
}

fetch(source).then(res => {
    return res.text();
}).then(content => {
    let pdf = /<a href="(.*?)"(.*?)>(.*?)疫苗接種統計資料\.pdf<\/a>/.exec(content);
    if (!pdf) return;

    fetch('https://www.cdc.gov.tw' + pdf[1]).then(res => {
        return res.text();
    }).then(content => {
        let pdf = /<a class="nav-link viewer-button" href="(.*?\.pdf)"/.exec(content);
        console.log('https://www.cdc.gov.tw' + pdf[1]);
        fetch('https://www.cdc.gov.tw' + pdf[1]).then(res => {
            const fileStream = fs.createWriteStream(pdfTempUrl);
            res.body.pipe(fileStream);
            fileStream.on("finish", async () => {
                await get_vaccine(pdfTempUrl);
                fs.unlink(pdfTempUrl, err => {
                    if (err) console.error('deleted fail', err);
                });
            });
        });
    });
});

