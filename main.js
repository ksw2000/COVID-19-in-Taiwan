// nav bar
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;
MDCTopAppBar.attachTo(document.getElementById('app-bar'));

fetch('dataset.json')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
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
                    x: {
                        stacked: false,
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        min: 0,
                        max: 600,
                        ticks: {
                            stepSize: 20
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

        const myChartDeath = new Chart(document.getElementById('myChartDeath').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ㄙˇㄨㄤˊㄖㄣˊㄕㄨˋ',
                    data: death,
                    backgroundColor: 'rgba(115, 115, 115, 0.8)'
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
                        max: 50,
                        ticks: {
                            stepSize: 1
                        }
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

