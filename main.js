// nav bar
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;
MDCTopAppBar.attachTo(document.getElementById('app-bar'));

fetch('/dataset.json')
.then(function (response) {
    return response.json();
})
.then(function (data) {
    let labels = [];
    let values = [];
    let backlog = [];
    let death = [];
    Object.keys(data).forEach(key => {
        labels.push(key);
        values.push(data[key]['本土']);
        death.push((data[key]['死亡']) ? data[key]['死亡'] : 0);
        if (data[key]['校正回歸']){
            let sum = 0;
            Object.keys(data[key]['校正回歸']).forEach((key2)=>{
                sum += data[key]['校正回歸'][key2];
            });
            backlog.push(sum);
        }else{
            backlog.push(0);
        }
    });
    const ctx = document.getElementById('myChart').getContext('2d');
    const footer = (tooltipItems)=>{
        let sum = 0;
        tooltipItems.forEach((tooltipItem)=>{
            sum += tooltipItem.parsed.y;
        });
        let d = death[tooltipItems[0].parsed.x];
        return `ㄗㄨㄥˇㄏㄜˊ: ${sum}\nㄙˇㄨㄤˊ: ${d}`;
    }
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, 
            datasets: [{
                label: 'ㄐㄧㄠˋㄓㄥˋㄏㄨㄟˊㄍㄨㄟㄑㄧㄢˊ',
                data: values,
                backgroundColor: 'rgba(115, 115, 115, 0.2)',
                borderWidth: 1
            },{
                label: 'ㄐㄧㄠˋㄓㄥˋㄏㄨㄟˊㄍㄨㄟ',
                data: backlog,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
});

