document.addEventListener("DOMContentLoaded", function () {
    console.log("Checking stockData:", stockData);

    if (!window.stockData || Object.keys(stockData).length === 0) {
        console.error("Stock data not found. Ensure stock_data.js is loaded correctly.");
        return;
    }

    populateStockDropdown();
});

// Function to populate the stock dropdown
function populateStockDropdown() {
    let stockDropdown = document.getElementById("calcStock");
    stockDropdown.innerHTML = "";

    Object.keys(stockData).forEach(stock => {
        let option = document.createElement("option");
        option.value = stock;
        option.textContent = stock;
        stockDropdown.appendChild(option);
    });

    stockDropdown.addEventListener("change", function () {
        updateDateDropdowns(stockDropdown.value);
    });

    updateDateDropdowns(stockDropdown.value);
}

// Function to update start and end date dropdowns
function updateDateDropdowns(selectedStock) {
    let startDateDropdown = document.getElementById("startDate");
    let endDateDropdown = document.getElementById("endDate");

    startDateDropdown.innerHTML = "";
    endDateDropdown.innerHTML = "";

    if (!stockData[selectedStock]) {
        console.warn(`No data available for ${selectedStock}`);
        return;
    }

    let availableDates = [];

    // Collect all available dates from stockData
    Object.keys(stockData[selectedStock]).forEach(year => {
        stockData[selectedStock][year].forEach(record => {
            availableDates.push(record.Date); // Add exact date (YYYY-MM-DD)
        });
    });

    availableDates.sort((a, b) => new Date(a) - new Date(b)); // Ensure proper chronological order

    // Populate dropdowns with exact dates
    availableDates.forEach(date => {
        let option1 = document.createElement("option");
        let option2 = document.createElement("option");

        option1.value = date;
        option1.textContent = date;
        option2.value = date;
        option2.textContent = date;

        startDateDropdown.appendChild(option1);
        endDateDropdown.appendChild(option2);
    });
}

// Event listener for the calculate button
document.getElementById("calculateButton").addEventListener("click", function () {
    let investmentAmount = parseFloat(document.getElementById("amount").value);
    let selectedStock = document.getElementById("calcStock").value;
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let resultElem = document.getElementById("result");

    if (!investmentAmount || investmentAmount <= 0) {
        alert("Please enter a valid investment amount.");
        return;
    }

    if (!stockData[selectedStock]) {
        alert("Stock data not available for the selected stock.");
        return;
    }

    let startRecord = null;
    let endRecord = null;

    // Find the records matching the selected start and end dates
    Object.keys(stockData[selectedStock]).forEach(year => {
        stockData[selectedStock][year].forEach(record => {
            if (record.Date === startDate) {
                startRecord = record;
            }
            if (record.Date === endDate) {
                endRecord = record;
            }
        });
    });

    if (!startRecord || !endRecord) {
        alert("Stock prices for the selected dates are not available.");
        return;
    }

    // Calculate the number of shares bought on the start date
    const shares = investmentAmount / startRecord.Close;
    // Calculate the final value at the end date
    const finalValue = shares * endRecord.Close;

    // Display the result
    resultElem.innerText = `Investing $${investmentAmount.toFixed(2)} in ${selectedStock} on ${startDate} at $${startRecord.Close.toFixed(2)} per share would be worth $${finalValue.toFixed(2)} on ${endDate} (shares bought: ${shares.toFixed(4)}).`;
});
