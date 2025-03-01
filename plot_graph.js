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
      // Call the updated treemap function which handles the year dropdown internally
      plotTreemap();
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
  
  // 🌳 Updated Treemap Function
  function plotTreemap() {
    // Get the year dropdown element (ensure your HTML includes an element with id "yearSelect")
    let yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = "";
    stockList.years.forEach(year => {
      let option = document.createElement("option");
      option.value = year;
      option.text = year;
      yearSelect.appendChild(option);
    });
  
    // Listen for changes on the year dropdown to update the treemap
    yearSelect.addEventListener("change", updateTreemap);
  
    // If there is at least one year, set it as the default and draw the treemap
    if (stockList.years.length > 0) {
      yearSelect.value = stockList.years[0];
      updateTreemap();
    }
  
    // Function to update the treemap based on the selected year
    function updateTreemap() {
      let selectedYear = yearSelect.value;
      if (!selectedYear) return;
  
      // Arrays for Plotly data
      let labels = [];
      let values = [];    // For rectangle sizing (market cap in billions)
      let changes = [];   // Percentage change from first to last close
      let hoverData = []; // Custom hover info for each stock
  
      // For each stock in stockList, compute the required metrics for the selected year
      stockList.stocks.forEach(stock => {
        let records = stockData[stock]?.[selectedYear];
        if (!records || records.length === 0) {
          return; // Skip stocks with no data for this year
        }
  
        // Sort records by date
        records.sort((a, b) => new Date(a.Date) - new Date(b.Date));
  
        // Extract first and last close values
        let firstClose = records[0].Close;
        let lastClose  = records[records.length - 1].Close;
  
        // Calculate percentage change from the first close to the last close
        let percentChange = ((lastClose - firstClose) / firstClose) * 100;
  
        // Use the market cap from the first record, scaling it to billions
        let marketCap = records[0]["Market Cap"] / 1e9;
  
        labels.push(stock);
        values.push(marketCap);
        changes.push(percentChange);
  
        // Prepare custom hover information
        hoverData.push({
          stock: stock,
          firstClose: firstClose.toFixed(2),
          lastClose: lastClose.toFixed(2),
          marketCap: marketCap.toFixed(2),
          percentChange: percentChange.toFixed(2)
        });
      });
  
      // Determine the color scale limits based on percentage changes
      let cmin = Math.min(...changes);
      let cmax = Math.max(...changes);
  
      // Build the treemap trace using Plotly
      let treemapTrace = {
        type: "treemap",
        labels: labels,
        parents: Array(labels.length).fill(""),
        values: values,
        marker: {
          colors: changes,
          cmin: cmin,
          cmax: cmax,
          colorscale: [
            [0, "rgb(255,0,0)"],
            [0.5, "rgb(255,255,255)"],
            [1, "rgb(0,200,0)"]
          ],
          colorbar: {
            title: "% Change",
            ticksuffix: "%"
          }
        },
        hovertemplate:
          "<b>%{label}</b><br>" +
          "Market Cap: $%{customdata[2]}B<br>" +
          "Change: %{customdata[4]}%<br>" +
          "First Close: $%{customdata[1]}<br>" +
          "Last Close: $%{customdata[3]}<br>" +
          "<extra></extra>",
        customdata: hoverData.map(h => [
          h.stock,
          h.firstClose,
          h.marketCap,
          h.lastClose,
          h.percentChange
        ])
      };
  
      // Define the layout for the treemap
      let layout = {
        title: `Treemap for ${selectedYear}`,
        margin: { t: 50, l: 0, r: 0, b: 0 }
      };
  
      // Render the treemap in the element with id "treemap"
      Plotly.newPlot("treemap", [treemapTrace], layout).then(function() {
        // Attach a click handler to update the summary area (ensure an element with id "summary" exists)
        let plotDiv = document.getElementById("treemap");
        plotDiv.on('plotly_click', function(data) {
          let point = data.points[0];
          let ticker = point.label;
          let custom = point.customdata;
          let firstClose = custom[1];
          let marketCap = custom[2];
          let lastClose  = custom[3];
          let percentChange = custom[4];
  
          // Build and display the summary HTML for the clicked stock
          let summaryHTML = `
            <h2>${ticker} Summary for ${selectedYear}</h2>
            <p><strong>Market Cap:</strong> $${marketCap} Billion</p>
            <p><strong>First Close:</strong> $${firstClose}</p>
            <p><strong>Last Close:</strong> $${lastClose}</p>
            <p><strong>Percentage Change:</strong> ${percentChange}%</p>
            <p><a href="https://finance.yahoo.com/quote/${ticker}/news?p=${ticker}" target="_blank">Search ${ticker} on Yahoo Finance</a></p>
          `;
          document.getElementById("summary").innerHTML = summaryHTML;
        });
      });
    }
  }