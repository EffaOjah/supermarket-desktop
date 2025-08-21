const stockHolder = document.getElementById('stockHolder');

var stocking;

document.addEventListener('DOMContentLoaded', async () => {
    stocking = await window.sqlite.storeManager('getStocking');
    console.log('Stocking: ', stocking);

    loadStocking();
});

function loadStocking() {
    stockHolder.innerHTML = '';
    // Group the stocking by the stocking_date
    const grouped = stocking.reduce((acc, stock) => {
        const { stocking_date } = stock;
        if (!acc[stocking_date]) {
            acc[stocking_date] = [];
        }
        acc[stocking_date].push(stock);
        return acc;
    }, {});

    console.log('grouped: ', grouped);

    for (const stocking_date in grouped) {
        const stockings = grouped[stocking_date];
        console.log('Stockings:', stockings);

        const newDiv = document.createElement('div');
        newDiv.innerHTML = `
        <div class="h-100 bg-secondary rounded p-4">
            <div class="mb-2">
              <h6 class="mb-4">${new Date(stocking_date).toDateString()}</h6>
            </div>
            
              ${stockings.map((stock, index) => `
                <div class="d-flex align-items-center border-bottom py-3">
              <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/product_placeholder.jpg" alt="">
              <div class="w-100 ms-3">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-0">Stocking</h6>
                  <div>
                    <small class="d-none">${new Date(stock.stocking_date).toDateString()}</small>
                    <span class="d-none">${stock.stocking_id}</span>
                    <span class="badge view-stocking-span" data-bs-toggle="modal" data-bs-target="#invoiceModal">View details</span>
                  </div>
                </div>
                <span>${stock.products_length} products were delivered</span>
              </div>
              </div>
              `).join('')}
                
            
            </div>`;

        stockHolder.appendChild(newDiv);
    }
}

// Function to filter stocking by date
function filterStocking(yearMonth) {
    console.log('Filtering stocking for year-month: ', yearMonth);

    // Filter stocking where stocking_date matches year and month
    const filtered = stocking.filter(item => {
        const stockingDate = new Date(item.stocking_date);
        const stockingYearMonth = `${stockingDate.getFullYear()}-${String(stockingDate.getMonth() + 1).padStart(2, '0')}`;
        return stockingYearMonth === yearMonth;
    }) || [];

    // Group the stock by full stocking_date (YYYY-MM-DD)
    const groupedStock = filtered.reduce((acc, stock) => {
        const dateKey = stock.stocking_date.split('T')[0]; // ensures no time part
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(stock);
        return acc;
    }, {});

    console.log('GroupedFiltered: ', groupedStock);

    // Clear old results
    stockHolder.innerHTML = '';

    if (filtered.length < 1) {
        console.log('No stock found');
        stockHolder.innerHTML = `<h2>No stock found!</h2>`;
    } else {
        for (const stocking_date in groupedStock) {
            const stockList = groupedStock[stocking_date];

            stockHolder.innerHTML += `
        <div class="h-100 bg-secondary rounded p-4 mb-3">
          <div class="mb-2">
            <h6 class="mb-4">${new Date(stocking_date).toDateString()}</h6>
          </div>
          ${stockList.map((stock, index) => `
                <div class="d-flex align-items-center border-bottom py-3">
              <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/product_placeholder.jpg" alt="">
              <div class="w-100 ms-3">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-0">Stocking</h6>
                  <div>
                    <small class="d-none">${new Date(stock.stocking_date).toDateString()}</small>
                    <span class="d-none">${stock.stocking_id}</span>
                    <span class="badge view-stocking-span" data-bs-toggle="modal" data-bs-target="#invoiceModal">View details</span>
                  </div>
                </div>
                <span>${stock.products_length} products were delivered</span>
              </div>
              </div>
              `).join('')}
        </div>
      `;
        }
    }
}

async function viewDetailsModal(stockId) {
    const detailsHolder = document.getElementById('details-Holder');

    detailsHolder.innerHTML = '';

    let stockingDetails = await window.sqlite.storeManager('getStockingItems', stockId);
    console.log('stockingDetails: ', stockingDetails);

    const newDiv = document.createElement('div');

    newDiv.innerHTML = `
        <table id="saleDetailTable" class="table table-bordered invoice-details">
                      <thead>
                <tr>
                    <th>S/N</th>
                    <th>PRODUCTS</th>
                    <th>SUPPLIER</th>
                    <th>NEW WHOLESALE QUANTITY</th>
                    <th>NEW RETAIL QUANTITY</th>
                </tr>
            </thead>
            <tbody>
                ${stockingDetails.map((stock, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${stock.product_name}</td>
                        <td>${stock.name}</td>
                        <td>${stock.wholesale_quantity}</td>
                        <td>${stock.retail_quantity}</td>
                    </tr>`).join("")}
            </tbody>
          </table>
          `

    detailsHolder.appendChild(newDiv);
}

/* Event Delegation */
// Attach a single event listener to the parent
stockHolder.addEventListener('click', (event) => {
    if (event.target.classList.contains('view-stocking-span')) {
        viewDetailsModal(event.target.previousElementSibling.innerHTML)
    }
});


// Function to print invoice
function printInvoice() {
    const invoiceContent = document.getElementById('printableInvoice').innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, .15);
          }
          .text-end { text-align: right; }
          .text-danger { color: red; }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .col-6 { width: 48%; }
          table { width: 100%; border-collapse: collapse; }
          table th, table td { border: 1px solid #000; padding: 8px; }
        </style>
      </head>
      <body>${invoiceContent}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}


async function downloadInvoiceImage() {
    const invoice = document.getElementById('printableInvoice');

    window.electronAPI.html2canvas(invoice).then(canvas => {
        const imageData = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = imageData;

        let randNo = Math.floor(Math.random() * 1000);

        link.download = `invoice.png-${randNo}.png`;
        link.click();
    });

}


// Date selection operation
const yearInput = document.getElementById('year');
const monthInput = document.getElementById('month');
const errorDisplay = document.getElementById('error');

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
}

function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
}

function isValidYear(year) {
    const yearNum = parseInt(year);
    return year.length === 4 && !isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear();
}

function isValidMonth(month) {
    const monthNum = parseInt(month);
    return month.length > 0 && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
}

function getFormattedDate() {
    const year = yearInput.value;
    const month = monthInput.value.padStart(2, '0'); // Ensure 2 digits

    let selectedDate = `${year}-${month}`;
    console.log('SelectedDate: ', selectedDate);

    if (selectedDate) {
        filterStocking(selectedDate);
    }
    return selectedDate;
}

function updateResult() {
    if (yearInput.value.length === 4 && monthInput.value.length > 0) {
        if (isValidYear(yearInput.value) && isValidMonth(monthInput.value)) {
            const formattedDate = getFormattedDate();
            return formattedDate;
        }
    }
    return null;
}

yearInput.addEventListener('input', () => {
    clearError();
    const year = yearInput.value;

    if (year.length === 4) {
        if (isValidYear(year)) {
            monthInput.disabled = false;
            monthInput.focus();
        } else {
            showError('Please enter a valid year (1900-' + new Date().getFullYear() + ')');
            monthInput.disabled = true;
        }
    } else {
        monthInput.disabled = true;
    }
    updateResult();
});

monthInput.addEventListener('input', () => {
    clearError();
    const month = monthInput.value;

    if (month.length > 0) {
        if (isValidMonth(month)) {
            updateResult();
        } else {
            showError('Please enter a valid month (1-12)');
        }
    }
    updateResult();
});

// Ensure only numbers are entered
[yearInput, monthInput].forEach(input => {
    input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '');
    });
});

// Close filter
document.getElementById('closeFilter').addEventListener('click', () => {
    [yearInput, monthInput].forEach(el => {
        el.value = '';
    });

    loadStocking();
});


document.getElementById('printBtn').addEventListener('click', downloadInvoiceImage);