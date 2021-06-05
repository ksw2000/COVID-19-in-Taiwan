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

        const footer = (tooltipItems) => {
            let sum = 0;
            tooltipItems.forEach((tooltipItem) => {
                sum += tooltipItem.parsed.y;
            });
            let d = death[tooltipItems[0].parsed.x];
            return `ㄗㄨㄥˇㄏㄜˊ: ${sum}\nㄙˇㄨㄤˊ: ${d}`;
        }

        const myChart = new Chart(document.getElementById('myChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ㄐㄧㄠˋㄓㄥˋㄏㄨㄟˊㄍㄨㄟㄑㄧㄢˊ',
                    data: confirmed,
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }, {
                    label: 'ㄐㄧㄠˋㄓㄥˋㄏㄨㄟˊㄍㄨㄟ',
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
                            footer: footer,
                        }
                    }
                }
            }
        });

        const myLineChart = new Chart(document.getElementById('myLineChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ㄑㄩㄝˋㄓㄣˇㄕㄨˋ',
                    data: confirmedAfterBackLog,
                    backgroundColor: 'rgba(0, 166, 255, 0.8)'
                }, {
                    label: 'ㄙˇㄨㄤˊㄕㄨˋ',
                    data: death,
                    backgroundColor: 'rgba(255, 74, 74, 0.8)'
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
                }
            }
        });

        const myChartDeath = new Chart(document.getElementById('myChartDeath').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ㄙˇㄨㄤˊㄖㄣˊㄕㄨˋ',
                    data: death,
                    backgroundColor: 'rgba(115, 115, 115, 0.8)'
                }]
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
            return `ㄏㄜˊㄐ一ˋ : ${sum}`;
        }
        const myChartSingleDay = new Chart(document.getElementById('myChartSingleDay').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ㄉㄤㄖˋㄑㄩㄝˋㄓㄣˇ',
                    data: confirmed,
                    backgroundColor: 'rgba(255, 142, 71, 0.8)'
                }, {
                    label: 'ㄉㄤㄖˋㄐㄧㄠˋㄓㄥˋㄏㄨㄟˊㄍㄨㄟ',
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
        let dataList = [];
        let sum = 0;
        Object.keys(data.data).forEach(city => {
            sum += data.data[city];
            dataList.push({
                city: city,
                num: data.data[city]
            });
        })
        dataList.sort((a, b) => {
            return (a.num < b.num) ? 1 : -1;
        });

        let citys = [];
        let nums = [];
        let other = 0;
        // 數字小於 5% 的話加入 other
        dataList.forEach(e => {
            if (citys.length >= 6) {
                other += e.num;
            } else {
                citys.push(e.city);
                nums.push(e.num);
            }
        });
        citys.push("其他");
        nums.push(other);

        const footerMyPie = (tooltipItems) => {
            return `${(tooltipItems[0].raw / sum * 100).toFixed(1)}%`;
        }
        const myPieChart = new Chart(document.getElementById('myPieChart').getContext('2d'), {
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
                        'rgb(205, 155, 36)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
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
                            footer: footerMyPie,
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
                        formatter: (num,ctx)=>{
                            return `${ctx.chart.data.labels[ctx.dataIndex]}\n${(num/sum*100).toFixed(1)}%`
                        }, labels: {
                            title: {
                                font: {
                                    weight: 'bold'
                                }
                            },
                            value: {
                                color: 'green'
                            }
                        }
                    }, legend: {
                        display: false
                    }
                }
            }
        });

    });