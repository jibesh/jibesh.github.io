function plot_grade_dist(dt) {
    dt[0].marker = {
        color: ["#ef233c", "#d5f2e3", "#73ba9b", "#003e1f", "#d90429", "#08bdbd", "#43291f"]
    };
    dt[0].type = 'bar';
    let layout = {
        xaxis: {
            title: {
                text: "Grade",
                font: {
                    family: "Space Grotesk, sans-serif",
                    size: 18,
                    color: '#7f7f7f'
                }
            },
        },
        yaxis: {
            title: {
                text: "Percentage of Students",
                font: {
                    family: "Space Grotesk, sans-serif",
                    size: 18,
                    color: '#7f7f7f'
                }
            }
        },
        showlegend: false
    };
    var config = {responsive: true}
    Plotly.newPlot('plot', dt, layout, config);
}

let plot_div = document.getElementById('plot');
let plot_data = document.getElementById('plot_data');
if (plot_div && plot_data) {
    plot_grade_dist([JSON.parse(plot_data.value)]);
}