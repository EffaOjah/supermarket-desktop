// Format for DB
function formatDateDB(date) {
    let y = date.getFullYear();
    let m = String(date.getMonth() + 1);
    let d = String(date.getDate());
    return `${y}-${m}-${d}`;
}

function getDateRange(option) {
    const today = new Date();
    let start, end;

    switch (option) {
        case "yesterday":
            start = end = new Date(today);
            start.setDate(today.getDate() - 1);
            break;

        case "last7":
            end = new Date(today);
            start = new Date(today);
            start.setDate(today.getDate() - 6);
            break;

        case "last30":
            end = new Date(today);
            start = new Date(today);
            start.setDate(today.getDate() - 29);
            break;

        case "thisMonth":
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today);
            break;

        case "lastMonth":
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;

        case "thisYear":
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today);
            break;

        case "lastYear":
            start = new Date(today.getFullYear() - 1, 0, 1);
            end = new Date(today.getFullYear() - 1, 11, 31);
            break;
    }

    return start && end
        ? {
            display: `${formatDateDB(start)} - ${formatDateDB(end)}`,
            start: formatDateDB(start),
            end: formatDateDB(end)
        }
        : null;
}

const dateRangeSelect = document.getElementById("dateRange");
const customRangeDiv = document.getElementById("customRange");
const customStart = document.getElementById("customStart");
const customEnd = document.getElementById("customEnd");
const dateInput = document.getElementById("dateInput");

dateRangeSelect.addEventListener("change", function () {
    const val = this.value;

    if (val === "custom") {
        customRangeDiv.style.display = "flex";
        document.querySelector('.cdr').style.display = "block";
        dateInput.value = "";
        return;
    } else {
        customRangeDiv.style.display = "none";
        document.querySelector('.cdr').style.display = "none";
    }

    const result = getDateRange(val);
    if (result) {
        dateInput.value = result.display;

        // Example: send to backend
        getAnalysis(result.start, result.end);
    }
});

// Handle custom range
function handleCustomRange() {
    if (customStart.value && customEnd.value) {
        const startDate = customStart.value;
        const endDate = customEnd.value;

        dateInput.value = `${startDate} - ${endDate}`;

        // Format the dates
        const formattedStartDate = removeLeadingZeroFromMonth(startDate);
        const formattedEndDate = removeLeadingZeroFromMonth(endDate);

        // Example: send to backend
        getAnalysis(formattedStartDate, formattedEndDate);
    }
}

customStart.addEventListener("change", handleCustomRange);
customEnd.addEventListener("change", handleCustomRange);

function removeLeadingZeroFromMonth(dateStr) {
    const parts = dateStr.split('-');
    parts[1] = parts[1].replace(/^0/, ''); // Remove leading zero from month
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

// Get the analysis
async function getAnalysis(start, end) {
    console.log("Sending to backend:", { startDate: start, endDate: end });

    // Get the analysis
    const wholesaleAnalysis = await window.sqlite.storeManager('getSalesAnalysisFromRange', 'Wholesale', start, end);

    const retailAnalysis = await window.sqlite.storeManager('getSalesAnalysisFromRange', 'Retail', start, end);

    console.log(wholesaleAnalysis, retailAnalysis);

    // Now, display the analysis
    // Update the html
    document.getElementById('dateRangeAnalysis').classList.remove('d-none');

    document.getElementById('wholesaleAmountFromRange').innerHTML = wholesaleAnalysis[0].total ? (wholesaleAnalysis[0].total).toLocaleString('en-US') : '0,00';
    document.getElementById('retailAmountFromRange').innerHTML = retailAnalysis[0].total ? (retailAnalysis[0].total).toLocaleString('en-US') : '0,00';
}