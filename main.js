// nav bar
const limit = "5-11"
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;
MDCTopAppBar.attachTo(document.getElementById('app-bar'));
const numberFmt = new Intl.NumberFormat('en-US')

// "5-11" -> 511
function dateToNumber(date) {
    date = date.split("-");
    month = Number(date[0]);
    date = Number(date[1]);
    return {
        month: month,
        date: date,
        number: month * 100 + date
    };
}

// party data
const cityToParty = {
    "基隆市": "民進黨",
    "台北市": "民眾黨",
    "新北市": "國民黨",
    "宜蘭縣": "國民黨",
    "桃園市": "民進黨",
    "新竹縣": "國民黨",
    "新竹市": "民進黨",
    "苗栗縣": "國民黨",
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
    "澎湖縣": "國民黨",
    "金門縣": "國民黨",
    "連江縣": "國民黨",
}

fetch('./data/dataset.json')
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        let labels = [];
        let confirmed = [];                 // 本土單日確診
        let backlog = [];                   // 本土單日校正回歸
        let confirmedAfterBackLog = [];     // 本土單日確診加上之後的校正回歸 (最準確的數字)
        let death = [];                     // 本土單日死亡數字
        let backlogCounter = {};            // 本土單日發佈確診加上今日發佈的校正回歸 (不準確的數字)
        Object.keys(data).forEach(date => {
            if (dateToNumber(date).number >= dateToNumber(limit).number) {
                let confirmedToday = data[date]['本土'];
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
                backlog.push(backlogToday);
                confirmedAfterBackLog.push(confirmedToday + backlogToday);
                death.push((data[date]['死亡']) ? data[date]['死亡'] : 0);
            }
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
            new Chart(document.getElementById(`myChart${latest}`).getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels.slice(from, to),
                    datasets: [{
                        label: '當日發佈數據',
                        data: confirmed.slice(from, to),
                        backgroundColor: 'rgba(0, 166, 255, 0.8)'
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

            new Chart(document.getElementById(`myChartDeath${latest}`).getContext('2d'), {
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

        /*
        const myLineChart = new Chart(document.getElementById('myLineChart').getContext('2d'), {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    label: '確診數',
                    data: confirmedAfterBackLog,
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 600,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }, plugins: lineLabelPlugin
            }
        });

        const myLineChartDeath = new Chart(document.getElementById('myLineChartDeath').getContext('2d'), {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    label: '死亡數',
                    data: death,
                    backgroundColor: 'rgba(255, 74, 74, 0.8)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 50
                    }
                }, plugins: lineLabelPlugin
            }
        });
        */

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


fetch('./data/city_statistic.json')
    .then(res => res.json())
    .then(data => {
        for (let mode = 0; mode < 2; mode++) {
            let citys = [];
            let nums = [];
            let proportion = [];
            let numOther = 0;
            let proportionOther = 0;

            let parties_num_map = {};
            //let parties_list = [];
            //let parties_num = [];

            data.dataList[(mode == 0) ? 'from511' : 'before14'].forEach(e => {
                party = cityToParty[e.city];
                // 有些 city 的 label 超怪，好像是有亂碼吧
                // 所以要過濾一下
                if (party) {
                    if (parties_num_map[party]) {
                        parties_num_map[party] += e.num;
                    } else {
                        parties_num_map[party] = e.num;
                    }

                    if (citys.length >= 7) {
                        numOther += e.num;
                        proportionOther += e.proportion;
                    } else {
                        citys.push(e.city);
                        nums.push(e.num);
                        proportion.push(e.proportion);
                    }
                }
            });

            citys.push("其他");
            nums.push(numOther);
            proportion.push(proportionOther);

            let dom = (mode == 0) ? 'myPieChart' : 'myPieChart-14';
            document.getElementById(`${dom}-update-date`).textContent = data.lastModified.split('-')[0];
            new Chart(document.getElementById(dom).getContext('2d'), {
                type: 'pie',
                plugins: [ChartDataLabels],
                data: {
                    labels: citys,
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
            ['國民黨', '民眾黨', '民進黨'].forEach(e => {
                let num = numberFmt.format(Number(parties_num_map[e]));
                document.querySelector(`#${dom}-table td[data-party="${e}"]`).textContent = `${num} 人`;
            });
        }
    });

fetch('./data/latest_statistic.json')
    .then(res => res.json())
    .then(data => {
        ['確診', '死亡', '昨日確診'].forEach(e => {
            let num = numberFmt.format(Number(data[e]));
            document.querySelector(`td[data-latest-statistic="${e}"]`).textContent = `${num} 人`;
        })
    })
    .catch(err => console.log(err))

fetch('./data/vaccine.json')
    .then(res => res.json())
    .then(data => {
        document.querySelector('#vaccine-update-date').textContent = `${data.lastModified}`;
        Object.keys(data.data).forEach(e => {
            Object.keys(data.data[e]).forEach(f => {
                let num = numberFmt.format(Number(data.data[e][f]));
                document.querySelector(`td[data-vaccine="${e}"][data-n="${f}"]`).textContent = `${num} 人次`;
            });
        });
    })
    .catch(err => console.log(err))