const salesHolder = document.getElementById('salesHolder');

var sales;

document.addEventListener('DOMContentLoaded', async () => {
  sales = await window.sqlite.storeManager?.getSales();
  console.log('Sales: ', sales);

  loadSales();
});

function loadSales() {
  // Group the sales by the sales_date
  const grouped = sales.reduce((acc, sale) => {
    const { sales_date } = sale;
    if (!acc[sales_date]) {
      acc[sales_date] = [];
    }
    acc[sales_date].push(sale);
    return acc;
  }, {});

  console.log(grouped);

  for (const sales_date in grouped) {
    const sales = grouped[sales_date];
    console.log('SalesD:', sales);


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

async function viewSaleInvoice(saleId) {
  const invoiceHolder = document.getElementById('invoiceHolder');

  invoiceHolder.innerHTML = '';

  let saleDetails = await window.sqlite.storeManager?.getSaleItems(saleId);
  console.log(saleDetails);

  const newDiv = document.createElement('div');
  newDiv.innerHTML = `
        <table id="saleDetailTable" class="table table-bordered invoice-details">
                      <thead>
                        <tr>
                          <th>ITEMS</th>
                          <th>PURCHASE TYPE</th>
                          <th>QUANTITY</th>
                          <th>PRICE</th>
                          <th>SUB TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${saleDetails.map(sale => `
                          <tr>
                          <td>${sale.product_name}</td>
                          <td>${sale.sale_type}</td>
                          <td>${sale.quantity}</td>
                          <td>₦${sale.unit_price}</td>
                          <td>${sale.quantity * sale.unit_price}</td>
                          </tr>
        
                          `).join('')}
                      </tbody>
          </table>
          <p class="fs-6 text-end">Total: ${saleDetails[0].total_amount}</p>`

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


document.getElementById('printBtn').addEventListener('click', downloadInvoiceImage);

