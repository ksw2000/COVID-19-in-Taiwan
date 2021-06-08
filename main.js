// nav bar
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;
MDCTopAppBar.attachTo(document.getElementById('app-bar'));

fetch('dataset.json')
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
        });

        const myChart = new Chart(document.getElementById('myChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '當日發佈數據',
                    data: confirmed,
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }, {
                    label: '校正回歸',
                    data: backlog,
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
                        max: 600,
                        ticks: {
                            // forces step size to be 50 units
                            stepSize: 100
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

        const lineLabelPlugin = {
            datalabels: {
                align: 'end',
                offset: 10,
                color: '#505050',
                //clamp: true,
                font: {
                    weight: 'bold'
                },
            }, legend: {
                display: false
            },
        }
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

        const myLineChartDeath = new Chart(document.getElementById('myLineChart-death').getContext('2d'), {
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

        const myChartDeath = new Chart(document.getElementById('myChartDeath').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '死亡人數',
                    data: death,
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


fetch('city_statistic.json')
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        for (mode = 0; mode < 2; mode++) {
            let citys = [];
            let nums = [];
            let proportion = [];
            let numOther = 0;
            let proportionOther = 0;

            data.dataList[(mode == 0) ? 'from511' : 'before14'].forEach(e => {
                if (citys.length >= 7) {
                    numOther += e.num;
                    proportionOther += e.proportion;
                } else {
                    citys.push(e.city);
                    nums.push(e.num);
                    proportion.push(e.proportion);
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
                    }]
                }, options: {
                    layout: {
                        padding: 50
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                footer: (tooltipItems) => {
                                    console.log(tooltipItems);
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
        }
    });