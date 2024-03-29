// nav bar
const limit = "5-11"
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;
MDCTopAppBar.attachTo(document.getElementById('app-bar'));
const numberFmt = new Intl.NumberFormat('en-US')

// "5-11" -> 511
function dateToNumber(date) {
    date = date.split("-");
    let month = Number(date[0]);
    date = Number(date[1]);
    return {
        month: month,
        date: date,
        number: month * 100 + date
    };
}

// clear cache, generate a random number string
const cache = (Math.floor(Math.random() * 1000000)).toString(16);

// party data
const cityToParty = {
    "基隆市": "國民黨",
    "台北市": "國民黨",
    "新北市": "國民黨",
    "宜蘭縣": "國民黨",
    "桃園市": "國民黨",
    "新竹縣": "國民黨",
    "新竹市": "民眾黨",
    "苗栗縣": "無黨籍",
    "台中市": "國民黨",
    "彰化縣": "國民黨",
    "南投縣": "國民黨",
    "雲林縣": "國民黨",
    "嘉義縣": "民進黨",
    "嘉義市": "國民黨",
    "台南市": "民進黨",
    "高雄市": "民進黨",
    "屏東縣": "民進黨",
    "花蓮縣": "國民黨",
    "台東縣": "國民黨",
    "澎湖縣": "民進黨",
    "金門縣": "無黨籍",
    "連江縣": "國民黨",
}

fetch('./data/dataset-2021.json?' + cache)
    .then(res => res.json())
    .then(data => {
        let labels = [];
        let confirmed = [];                 // 本土單日確診
        let confirmedForeign = [];          // 境外移入單日確診
        let backlog = [];                   // 本土單日校正回歸
        let confirmedAfterBackLog = [];     // 本土單日確診加上之後的校正回歸 (最準確的數字)
        let death = [];                     // 本土單日死亡數字
        let backlogCounter = {};            // 本土單日發佈確診加上今日發佈的校正回歸 (不準確的數字)
        Object.keys(data).forEach(date => {
            if (dateToNumber(date).number >= dateToNumber(limit).number) {
                let confirmedToday = data[date]['本土'];
                let confirmedTodayForeign = data[date]['境外'];
                let backlogToday = 0;
                if (data[date]['校正回歸']) {
                    Object.keys(data[date]['校正回歸']).forEach((key) => {
                        if (typeof backlogCounter[key] === 'undefined') {
                            backlogCounter[key] = data[date]['校正回歸'][key];
                        } else {
                            backlogCounter[key] += data[date]['校正回歸'][key];
                        }
                        backlogToday += data[date]['校正回歸'][key];
                    });
                }

                // push
                labels.push(date);
                confirmed.push(confirmedToday);
                confirmedForeign.push(confirmedTodayForeign);
                backlog.push(backlogToday);
                confirmedAfterBackLog.push(confirmedToday + backlogToday);
                death.push((data[date]['死亡']) ? data[date]['死亡'] : 0);
            }
        });

        let from = 0;
        let to = labels.length;
        new Chart(document.getElementById(`myChart2021`).getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.slice(from, to),
                datasets: [{
                    label: '本土確診',
                    data: confirmed.slice(from, to),
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }, {
                    label: '境外移入',
                    data: confirmedForeign.slice(from, to),
                    backgroundColor: 'rgba(66, 206, 245, 0.8)'
                }, {
                    label: '校正回歸',
                    data: backlog.slice(from, to),
                    backgroundColor: 'rgba(138, 192, 222, 0.8)'
                }]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        min: 0,
                        ticks: {
                            // forces step size to be 50 units
                            // stepSize: 100
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let sum = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    sum += tooltipItem.parsed.y;
                                });
                                let d = death[tooltipItems[0].parsed.x];
                                return `總合: ${sum}\n死亡: ${d}`;
                            },
                        }
                    }
                }
            }
        });

        new Chart(document.getElementById(`myChartDeath2021`).getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.slice(from, to),
                datasets: [{
                    label: '死亡人數',
                    data: death.slice(from, to),
                    backgroundColor: 'rgba(115, 115, 115, 0.8)'
                }]
            }, options: {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // backlogCounterToList
        let backgroundColorList = [];
        Object.keys(data).forEach(key => {
            if (typeof backlogCounter[key] === 'undefined') {
                backgroundColorList.push(0);
            } else {
                backgroundColorList.push(backlogCounter[key]);
            }
        });

        const footerSingleDay = (tooltipItems) => {
            let x = tooltipItems[0].dataIndex;
            let sum = confirmed[x] + backgroundColorList[x]
            return `合計：${sum}`;
        }
        const myChartSingleDay = new Chart(document.getElementById('myChartSingleDay').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '當日確診',
                    data: confirmed,
                    backgroundColor: 'rgba(255, 142, 71, 0.8)'
                }, {
                    label: '當日校正迴歸',
                    data: backgroundColorList,
                    backgroundColor: 'rgba(255, 232, 138, 0.8)'
                }]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            footer: footerSingleDay,
                        }
                    }
                }
            }
        });
    });


fetch('./data/city_statistic.json?' + cache)
    .then(res => res.json())
    .then(data => {
        for (let mode = 0; mode < 2; mode++) {
            let cities = [];
            let nums = [];
            let proportion = [];
            let numOther = 0;
            let proportionOther = 0;

            let parties_num_map = {};
            //let parties_list = [];
            //let parties_num = [];

            data.dataList[(mode == 0) ? 'from511' : 'before14'].forEach(e => {
                let party = cityToParty[e.city];
                // 有些 city 的 label 超怪，好像是有亂碼吧
                // 所以要過濾一下
                if (party) {
                    if (parties_num_map[party]) {
                        parties_num_map[party] += e.num;
                    } else {
                        parties_num_map[party] = e.num;
                    }

                    if (cities.length >= 7) {
                        numOther += e.num;
                        proportionOther += e.proportion;
                    } else {
                        cities.push(e.city);
                        nums.push(e.num);
                        proportion.push(e.proportion);
                    }
                }
            });

            cities.push("其他");
            nums.push(numOther);
            proportion.push(proportionOther);

            let dom = (mode == 0) ? 'myPieChart' : 'myPieChart-14';
            document.getElementById(`${dom}-update-date`).textContent = data.lastModified.split('-')[0];
            new Chart(document.getElementById(dom).getContext('2d'), {
                type: 'pie',
                plugins: [ChartDataLabels],
                data: {
                    labels: cities,
                    datasets: [{
                        label: '確診縣市',
                        data: nums,
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(255, 159, 64)',
                            'rgb(232, 210, 3)',
                            'rgb(75, 192, 192)',
                            'rgb(54, 162, 235)',
                            'rgb(153, 102, 255)',
                            'rgb(205, 155, 36)',
                            'rgb(150, 150, 150)'
                        ]
                    },]
                }, options: {
                    layout: {
                        padding: 50
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                footer: (tooltipItems) => {
                                    return `${(proportion[tooltipItems[0].dataIndex] * 100).toFixed(1)} %`;
                                },
                            }
                        }, datalabels: {
                            anchor: 'end',
                            align: 'end',
                            offset: 10,
                            color: '#505050',
                            clamp: true,
                            font: {
                                weight: 'bold'
                            },
                            formatter: (num, ctx) => {
                                return `${ctx.chart.data.labels[ctx.dataIndex]}\n${(proportion[ctx.dataIndex] * 100).toFixed(1)}%`
                            }
                        }, legend: {
                            display: false
                        }
                    }
                }
            });
            ['國民黨', '民眾黨', '民進黨', '無黨籍'].forEach(e => {
                let num = numberFmt.format(Number(parties_num_map[e]));
                document.querySelector(`#${dom}-table td[data-party="${e}"]`).textContent = `${num} 人`;
            });
        }
    });

fetch('./data/latest_statistic.json?' + cache)
    .then(res => res.json())
    .then(data => {
        ['確診', '死亡', '昨日確診'].forEach(e => {
            let num = numberFmt.format(Number(data[e]));
            document.querySelector(`td[data-statistic="${e}"]`).textContent = `${num} 人`;
        })
    })
    .catch(err => console.log(err))

fetch('./data/vaccine.json?' + cache)
    .then(res => res.json())
    .then(data => {
        document.querySelector('#vaccine-update-date').textContent = `${data.lastModified}`;
        let sum = { "第一劑": 0, "第二劑": 0, "基礎加強劑": 0, "追加劑": 0 , "第二次追加劑": 0};
        Object.keys(data.data).forEach(e => {
            Object.keys(sum).forEach(f => {
                let n = isNaN(Number(data.data[e][f])) ? 0 : Number(data.data[e][f]);
                sum[f] += Number(n);
                document.querySelector(`td[data-vaccine="${e}"][data-n="${f}"]`).textContent = `${numberFmt.format(n) } 人次`;
            });
        });
        const peopleInTaiwan = 23570000; // 大概2357萬
        document.querySelector(`td[data-vaccine="sum"][data-n="第一劑"]`).innerHTML = `${numberFmt.format(sum['第一劑'])} 人次<br>約占總人口 ${(sum['第一劑'] / peopleInTaiwan * 100).toFixed(2)}%`;
        document.querySelector(`td[data-vaccine="sum"][data-n="第二劑"]`).innerHTML = `${numberFmt.format(sum['第二劑'])} 人次<br>約占總人口 ${(sum['第二劑'] / peopleInTaiwan * 100).toFixed(2)}%`;
        document.querySelector(`td[data-vaccine="sum"][data-n="基礎加強劑"]`).innerHTML = `${numberFmt.format(sum['基礎加強劑'])} 人次`;
        document.querySelector(`td[data-vaccine="sum"][data-n="追加劑"]`).innerHTML = `${numberFmt.format(sum['追加劑'])} 人次<br>約占總人口 ${(sum['追加劑'] / peopleInTaiwan * 100).toFixed(2)}%`;
        document.querySelector(`td[data-vaccine="sum"][data-n="第二次追加劑"]`).innerHTML = `${numberFmt.format(sum['第二次追加劑'])} 人次<br>約占總人口 ${(sum['第二次追加劑'] / peopleInTaiwan * 100).toFixed(2)}%`;
    })
    .catch(err => console.log(err))

// for 2023
fetch('./data/dataset-robot.json?' + cache)
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        let labels = [];
        let confirmed = [];                 // 本土單日確診
        let confirmedForeign = [];          // 境外移入單日確診
        let backlog = [];                   // 本土單日校正回歸
        let confirmedAfterBackLog = [];     // 本土單日確診加上之後的校正回歸 (最準確的數字)
        let death = [];                     // 本土單日死亡數字
        let backlogCounter = {};            // 本土單日發佈確診加上今日發佈的校正回歸 (不準確的數字)
        Object.keys(data).forEach(date => {
            let confirmedToday = data[date]['本土'];
            let confirmedTodayForeign = data[date]['境外'];
            let backlogToday = 0;
            if (data[date]['校正回歸']) {
                Object.keys(data[date]['校正回歸']).forEach((key) => {
                    if (typeof backlogCounter[key] === 'undefined') {
                        backlogCounter[key] = data[date]['校正回歸'][key];
                    } else {
                        backlogCounter[key] += data[date]['校正回歸'][key];
                    }
                    backlogToday += data[date]['校正回歸'][key];
                });
            }

            // push
            labels.push(date);
            confirmed.push(confirmedToday);
            confirmedForeign.push(confirmedTodayForeign);
            backlog.push(backlogToday);
            confirmedAfterBackLog.push(confirmedToday + backlogToday);
            death.push((data[date]['死亡']) ? data[date]['死亡'] : 0);
        });

        for (let charts = 0; charts < 2; charts++) {
            let from = 0;
            let to = labels.length;
            let latest = "";
            if (charts == 1) {
                latest = "Latest";
                to = labels.length;
                from = Math.max(0, to - 30);
            }
            new Chart(document.getElementById(`myChart2023${latest}`).getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels.slice(from, to),
                    datasets: [{
                        label: '本土確診',
                        data: confirmed.slice(from, to),
                        backgroundColor: 'rgba(0, 166, 255, 0.8)'
                    }, {
                        label: '境外移入',
                        data: confirmedForeign.slice(from, to),
                        backgroundColor: 'rgba(66, 206, 245, 0.8)'
                    }, {
                        label: '校正回歸',
                        data: backlog.slice(from, to),
                        backgroundColor: 'rgba(138, 192, 222, 0.8)'
                    }]
                },
                options: {
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            min: 0,
                            ticks: {
                                // forces step size to be 50 units
                                // stepSize: 100
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                footer: (tooltipItems) => {
                                    let sum = 0;
                                    tooltipItems.forEach((tooltipItem) => {
                                        sum += tooltipItem.parsed.y;
                                    });
                                    let d = death[tooltipItems[0].parsed.x];
                                    return `總合: ${sum}\n死亡: ${d}`;
                                },
                            }
                        }
                    }
                }
            });

            new Chart(document.getElementById(`myChartDeath2023${latest}`).getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels.slice(from, to),
                    datasets: [{
                        label: '死亡人數',
                        data: death.slice(from, to),
                        backgroundColor: 'rgba(115, 115, 115, 0.8)'
                    }]
                }, options: {
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // for latest data (single day)
        let last = Object.keys(data).length - 1;
        let lastDate = Object.keys(data)[last];
        document.querySelector("#latest-data-single-day-date").textContent = `2022/${lastDate.split("-")[0].padStart(2, '0')}/${lastDate.split("-")[1].padStart(2, '0')}`;
        document.querySelector("td[data-latest-single-day='本土']").textContent = confirmed[last]+"人";
        document.querySelector("td[data-latest-single-day='境外']").textContent = confirmedForeign[last]+"人";
        document.querySelector("td[data-latest-single-day='死亡']").textContent = death[last]+"人";
    });


// for 2022
fetch('./data/dataset-robot-2022.json?' + cache)
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        let labels = [];
        let confirmed = [];                 // 本土單日確診
        let confirmedForeign = [];          // 境外移入單日確診
        let backlog = [];                   // 本土單日校正回歸
        let confirmedAfterBackLog = [];     // 本土單日確診加上之後的校正回歸 (最準確的數字)
        let death = [];                     // 本土單日死亡數字
        let backlogCounter = {};            // 本土單日發佈確診加上今日發佈的校正回歸 (不準確的數字)
        Object.keys(data).forEach(date => {
            let confirmedToday = data[date]['本土'];
            let confirmedTodayForeign = data[date]['境外'];
            let backlogToday = 0;
            if (data[date]['校正回歸']) {
                Object.keys(data[date]['校正回歸']).forEach((key) => {
                    if (typeof backlogCounter[key] === 'undefined') {
                        backlogCounter[key] = data[date]['校正回歸'][key];
                    } else {
                        backlogCounter[key] += data[date]['校正回歸'][key];
                    }
                    backlogToday += data[date]['校正回歸'][key];
                });
            }

            // push
            labels.push(date);
            confirmed.push(confirmedToday);
            confirmedForeign.push(confirmedTodayForeign);
            backlog.push(backlogToday);
            confirmedAfterBackLog.push(confirmedToday + backlogToday);
            death.push((data[date]['死亡']) ? data[date]['死亡'] : 0);
        });

        let from = 0;
        let to = labels.length;
        let latest = "";
        new Chart(document.getElementById(`myChart2022`).getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.slice(from, to),
                datasets: [{
                    label: '本土確診',
                    data: confirmed.slice(from, to),
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }, {
                    label: '境外移入',
                    data: confirmedForeign.slice(from, to),
                    backgroundColor: 'rgba(66, 206, 245, 0.8)'
                }, {
                    label: '校正回歸',
                    data: backlog.slice(from, to),
                    backgroundColor: 'rgba(138, 192, 222, 0.8)'
                }]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        min: 0,
                        ticks: {
                            // forces step size to be 50 units
                            // stepSize: 100
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let sum = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    sum += tooltipItem.parsed.y;
                                });
                                let d = death[tooltipItems[0].parsed.x];
                                return `總合: ${sum}\n死亡: ${d}`;
                            },
                        }
                    }
                }
            }
        });

        new Chart(document.getElementById(`myChartDeath2022`).getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.slice(from, to),
                datasets: [{
                    label: '死亡人數',
                    data: death.slice(from, to),
                    backgroundColor: 'rgba(115, 115, 115, 0.8)'
                }]
            }, options: {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    });