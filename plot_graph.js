document.addEventListener("DOMContentLoaded", function () {
    let stockSelect = document.getElementById("stockSelect");
    let yearSelect = document.getElementById("yearSelect");
    let chartSelect = document.getElementById("chartSelect");
    let filtersDiv = document.getElementById("filters");

    // Populate stock and year dropdowns
    stockList.stocks.forEach(stock => {
        let option = document.createElement("option");
        option.value = stock;
        option.text = stock;
        stockSelect.appendChild(option);
    });

    stockList.years.forEach(year => {
        let option = document.createElement("option");
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    });

    // Event Listener for Chart Type Change
    chartSelect.addEventListener("change", function () {
        let selectedChart = this.value;

        if (selectedChart === "pie") {
            filtersDiv.style.display = "none"; // Hide both stock & year filters
        } else if (selectedChart === "treemap") {
            filtersDiv.style.display = "block"; // Show filters
            stockSelect.style.display = "none"; // Hide stock filter for treemap
            yearSelect.style.display = "inline-block"; // Show year filter
        } else {
            filtersDiv.style.display = "block"; // Show both filters
            stockSelect.style.display = "inline-block"; // Show stock filter
            yearSelect.style.display = "inline-block"; // Show year filter
        }

        document.getElementById("plot").innerHTML = ""; // Reset plot area
    });

    // Event Listener for "Show Graph" Button
    document.getElementById("showGraphButton").addEventListener("click", updateGraph);
});

// Function to update the graph based on selection
function updateGraph() {
    let graphType = document.getElementById("chartSelect").value;
    let stock = document.getElementById("stockSelect").value;
    let year = document.getElementById("yearSelect").value;

    document.getElementById("plot").innerHTML = ""; // Clear previous content

    if (graphType === "pie") {
        plotPieChart();
        return;
    }

    if (graphType === "treemap") {
        plotTreemap(year);
        return;
    }

    if (!stock || !year) {
        alert("Please select a stock and year!");
        return;
    }

    let dataPoints = stockData[stock]?.[year];

    if (!dataPoints || dataPoints.length === 0) {
        alert(`No data available for ${stock} in ${year}`);
        return;
    }

    let filteredData = dataPoints.filter(d => new Date(d.Date).getFullYear() === parseInt(year));

    if (filteredData.length === 0) {
        alert(`No valid data found for ${stock} in ${year} (after filtering).`);
        return;
    }

    if (graphType === "regression") {
        plotRegressionGraph(filteredData, stock, year);
    } else if (graphType === "candlestick") {
        plotCandlestickChart(filteredData, stock, year);
    }
}

// 📊 Regression Graph
function plotRegressionGraph(data, stock, year) {
    let dates = data.map(d => new Date(d.Date));
    let prices = data.map(d => d.Close);

    let xValues = dates.map((d, i) => i);
    let yValues = prices;

    let sumX = xValues.reduce((a, b) => a + b, 0);
    let sumY = yValues.reduce((a, b) => a + b, 0);
    let sumXY = xValues.map((x, i) => x * yValues[i]).reduce((a, b) => a + b, 0);
    let sumXX = xValues.map(x => x * x).reduce((a, b) => a + b, 0);
    let n = xValues.length;

    let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;
    let regressionLine = xValues.map(x => slope * x + intercept);

    let trace1 = {
        x: dates,
        y: prices,
        mode: 'markers',
        name: 'Close Prices',
        marker: { color: 'blue' },
        hovertemplate: `<b>Date:</b> %{x}<br><b>Close Price:</b> $%{y:.2f}`
    };

    let trace2 = {
        x: dates,
        y: regressionLine,
        mode: 'lines',
        name: 'Regression Line',
        line: { color: 'red' },
        hovertemplate: `<b>Date:</b> %{x}<br><b>Trend Price:</b> $%{y:.2f}`
    };

    Plotly.newPlot("plot", [trace1, trace2], { title: `${stock} Regression Graph (${year})` });
}

// 📈 Candlestick Chart
function plotCandlestickChart(data, stock, year) {
    let trace = {
        x: data.map(d => d.Date),
        close: data.map(d => d.Close),
        open: data.map(d => d.Open),
        high: data.map(d => d.High),
        low: data.map(d => d.Low),
        type: 'candlestick',
        name: `${stock} Candlestick`
    };

    Plotly.newPlot("plot", [trace], { title: `${stock} Candlestick Chart (${year})` });
}

// 🥧 Pie Chart
function plotPieChart() {
    let stocks = stockList.stocks;
    let totalPerformance = {};

    stocks.forEach(stock => {
        let total = 0;
        for (let year = 2015; year <= 2025; year++) {
            if (stockData[stock] && stockData[stock][year]) {
                stockData[stock][year].forEach(record => total += record.Close);
            }
        }
        totalPerformance[stock] = total;
    });

    Plotly.newPlot('plot', [{
        values: Object.values(totalPerformance),
        labels: Object.keys(totalPerformance),
        type: 'pie'
    }], { title: 'Stock Performance (2015-2025)' });
}

// 🌳 Treemap Function
function plotTreemap(selectedYear) {
    if (!selectedYear) {
        alert("Please select a year for the treemap.");
        return;
    }

    let labels = [], values = [], changes = [], hoverData = [];

    stockList.stocks.forEach(stock => {
        let records = stockData[stock]?.[selectedYear];
        if (!records || records.length === 0) return;

        records.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        let firstClose = records[0].Close;
        let lastClose = records[records.length - 1].Close;
        let percentChange = ((lastClose - firstClose) / firstClose) * 100;
        let marketCap = records[0]["Market Cap"] / 1e9;

        labels.push(stock);
        values.push(marketCap);
        changes.push(percentChange);

        hoverData.push([stock, firstClose.toFixed(2), marketCap.toFixed(2), lastClose.toFixed(2), percentChange.toFixed(2)]);
    });

    let cmin = Math.min(...changes);
    let cmax = Math.max(...changes);

    let treemapTrace = {
        type: "treemap",
        labels: labels,
        parents: Array(labels.length).fill(""),
        values: values,
        marker: {
            colors: changes,
            cmin: cmin,
            cmax: cmax,
            colorscale: [[0, "rgb(255,0,0)"], [0.5, "rgb(255,255,255)"], [1, "rgb(0,200,0)"]],
            colorbar: { title: "% Change", ticksuffix: "%" }
        },
    };

    Plotly.newPlot("plot", [treemapTrace], { title: `Treemap for ${selectedYear}` });
}
