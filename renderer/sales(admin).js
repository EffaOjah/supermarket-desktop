const salesHolder = document.getElementById('salesHolder');

var sales;

document.addEventListener('DOMContentLoaded', async () => {
  sales = await window.sqlite.storeManager('getSales');
  console.log('Sales: ', sales);

  loadSales();
});

function loadSales() {
  salesHolder.innerHTML = '';
  // Group the sales by the sales_date
  const grouped = sales.reduce((acc, sale) => {
    const { sales_date } = sale;
    if (!acc[sales_date]) {
      acc[sales_date] = [];
    }
    acc[sales_date].push(sale);
    return acc;
  }, {});

  console.log('grouped: ', grouped);

  for (const sales_date in grouped) {
    const sales = grouped[sales_date];
    console.log('Sales:', sales);

    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
        <div class="h-100 bg-secondary rounded p-4">
            <div class="mb-2">
              <h6 class="mb-4">${new Date(sales_date).toDateString()}</h6>
            </div>
            
              ${sales.map((sale, index) => `
                <div class="d-flex align-items-center border-bottom py-3">
              <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/NIVEA.webp" alt="">
              <div class="w-100 ms-3">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-0">${sale.name}</h6>
                  <div>
                    <small class="d-none">${new Date(sale.sales_date).toDateString()}</small>
                    <span class="d-none">${sale.sale_id}</span>
                    <span class="badge view-invoice-span" data-bs-toggle="modal" data-bs-target="#invoiceModal">View invoice</span>
                  </div>
                </div>
                <span>${sale.payment_method}</span>
              </div>
              </div>
              `).join('')}
                
            
            </div>`;

    salesHolder.appendChild(newDiv);
  }
}

// Function to filter sales by date
function filterSales(yearMonth) {
  console.log('Filtering sales for year-month: ', yearMonth);

  // Filter sales where sales_date matches year and month
  const filtered = sales.filter(item => {
    const saleDate = new Date(item.sales_date);
    const saleYearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    return saleYearMonth === yearMonth;
  }) || [];

  // Group the sales by full sales_date (YYYY-MM-DD)
  const groupedSales = filtered.reduce((acc, sale) => {
    const dateKey = sale.sales_date.split('T')[0]; // ensures no time part
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(sale);
    return acc;
  }, {});

  console.log('GroupedFiltered: ', groupedSales);

  // Clear old results
  salesHolder.innerHTML = '';

  if (filtered.length < 1) {
    console.log('No sale found');
    salesHolder.innerHTML = `<h2>No sale found!</h2>`;
  } else {
    for (const sales_date in groupedSales) {
      const salesList = groupedSales[sales_date];

      salesHolder.innerHTML += `
        <div class="h-100 bg-secondary rounded p-4 mb-3">
          <div class="mb-2">
            <h6 class="mb-4">${new Date(sales_date).toDateString()}</h6>
          </div>
          ${salesList.map(sale => `
            <div class="d-flex align-items-center border-bottom py-3">
              <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/NIVEA.webp" alt="">
              <div class="w-100 ms-3">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-0">${sale.name}</h6>
                  <div>
                    <small class="d-none">${new Date(sale.sales_date).toDateString()}</small>
                    <span class="d-none">${sale.sale_id}</span>
                    <span class="badge view-invoice-span" data-bs-toggle="modal" data-bs-target="#invoiceModal">View invoice</span>
                  </div>
                </div>
                <span>${sale.payment_method}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

async function viewSaleInvoice(saleId) {
  const invoiceHolder = document.getElementById('invoiceHolder');

  invoiceHolder.innerHTML = '';

  let saleDetails = await window.sqlite.storeManager('getSaleItems', saleId);
  console.log(saleId, 'saleDetails: ', saleDetails);

  let theBranchName = branchName;
  document.getElementById('branch').innerHTML = theBranchName == 'MARYBILL MABILCO VENTURES' || theBranchName == 'MABILCO ENTERPRISE' ? branchName : `MaryBill Conglomerate | ${branchName}`;

  document.getElementById('customer').innerHTML = saleDetails[0].name;
  document.getElementById('paymentMethod').innerHTML = saleDetails[0].payment_method;
  document.getElementById('saleDate').innerHTML = saleDetails[0].sales_date;

  const newDiv = document.createElement('div');
  newDiv.innerHTML = `
        <table id="saleDetailTable" class="table table-bordered invoice-details">
                      <thead>
                <tr>
                    <th>S/N</th>
                    <th>ITEMS</th>
                    <th>PURCHASE TYPE</th>
                    <th>QUANTITY</th>
                    <th>PRICE PER QUANTITY</th>
                    <th>TOTAL PRICE</th>
                    <th>DISCOUNT RATE</th>
                    <th>DISCOUNT VALUE</th>
                    <th>NET PAY</th>
                </tr>
            </thead>
            <tbody>
                ${saleDetails.map((sale, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${sale.product_name}</td>
                        <td>${sale.sale_type}</td>
                        <td>${sale.quantity}</td>
                        <td>₦${sale.unit_price}</td>
                        <td>₦${sale.quantity * sale.unit_price}</td>
                        <td>${sale.discount}%</td>
                        <td>₦${((sale.discount / 100) * (sale.quantity * sale.unit_price)).toFixed(2)}</td>
                        <td>₦${(sale.quantity * sale.unit_price) - (sale.discount / 100 * (sale.quantity * sale.unit_price))}</td>
                    </tr>`).join("")}
            </tbody>
          </table>
          <p class="fs-6 text-end">Total: ₦${saleDetails[0].total_amount}</p>`

  invoiceHolder.appendChild(newDiv);
}

/* Event Delegation */
// Attach a single event listener to the parent
salesHolder.addEventListener('click', (event) => {
  if (event.target.classList.contains('view-invoice-span')) {
    viewSaleInvoice(event.target.previousElementSibling.innerHTML)
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
    filterSales(selectedDate);
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

  loadSales();
});


document.getElementById('printBtn').addEventListener('click', downloadInvoiceImage);