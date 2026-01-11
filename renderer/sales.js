(function () {
  // Sales History Logic
  let allSales = [];
  let filteredSales = [];
  let currentPage = 1;
  const pageSize = 10;

  window.initSales = async function () {
    console.log("Initializing Sales History Page...");

    // Setup Programmatic Event Listeners (CSP Fix)
    const searchInput = document.getElementById("salesSearchInput");
    if (searchInput) {
      searchInput.oninput = () => {
        currentPage = 1;
        window.filterSales();
      };
    }

    const yearSelect = document.getElementById("salesYearSelect");
    if (yearSelect) {
      yearSelect.onchange = () => {
        currentPage = 1;
        window.filterSales();
      };
    }

    const monthSelect = document.getElementById("salesMonthSelect");
    if (monthSelect) {
      monthSelect.onchange = () => {
        currentPage = 1;
        window.filterSales();
      };
    }

    const downloadBtn = document.getElementById("downloadInvoiceBtn");
    if (downloadBtn) {
      downloadBtn.onclick = window.downloadInvoice;
    }

    const printBtn = document.getElementById("printInvoiceBtn");
    if (printBtn) {
      printBtn.onclick = window.printInvoice;
    }

    const tableBody = document.getElementById("salesTableBody");
    if (tableBody) {
      tableBody.onclick = (e) => {
        const viewBtn = e.target.closest(".view-invoice-btn");
        if (viewBtn) {
          const id = viewBtn.getAttribute("data-id");
          window.viewSaleInvoice(id);
        }
      };
    }

    const paginationControls = document.getElementById("paginationControls");
    if (paginationControls) {
      paginationControls.onclick = (e) => {
        e.preventDefault();
        const pageLink = e.target.closest(".page-link");
        if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
          const page = pageLink.getAttribute("data-page");
          if (page === "prev") currentPage--;
          else if (page === "next") currentPage++;
          else currentPage = parseInt(page);

          window.renderSalesTable(filteredSales);
        }
      };
    }

    await window.loadSales();
  };

  window.loadSales = async function () {
    const tableBody = document.getElementById("salesTableBody");
    if (!tableBody) return;

    try {
      const sales = await window.sqlite.storeManager("getSales");
      // Sort sales by date descending (newest first)
      allSales = sales.sort((a, b) => new Date(b.sales_date) - new Date(a.sales_date));
      filteredSales = [...allSales];

      window.renderSalesTable(filteredSales);
    } catch (err) {
      console.error("Failed to load sales:", err);
    }
  };

  window.renderSalesTable = function (salesList) {
    const tableBody = document.getElementById("salesTableBody");
    if (!tableBody) return;

    const totalEntries = salesList.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, totalEntries);
    const currentItems = salesList.slice(start, end);

    tableBody.innerHTML = totalEntries ? "" : '<tr><td colspan="6" class="text-center py-4 text-muted">No sales found.</td></tr>';

    currentItems.forEach((sale, index) => {
      const row = document.createElement("tr");
      const saleDate = new Date(sale.sales_date);
      const formattedDate = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      row.innerHTML = `
            <td class="text-muted">${start + index + 1}</td>
            <td class="text-muted">${formattedDate}</td>
            <td class="fw-medium">#${sale.sale_id}</td>
            <td><div class="fw-semibold">${sale.name || 'Walk-in Customer'}</div></td>
            <td class="text-end fw-bold">₦${Number(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary shadow-sm view-invoice-btn" data-id="${sale.sale_id}" data-bs-toggle="modal" data-bs-target="#invoiceModal">
                    View Invoice
                </button>
            </td>
        `;
      tableBody.appendChild(row);
    });

    window.renderPagination(totalEntries, totalPages);
  };

  window.renderPagination = function (totalEntries, totalPages) {
    const info = document.getElementById("paginationInfo");
    const controls = document.getElementById("paginationControls");
    if (!info || !controls) return;

    if (totalEntries === 0) {
      info.innerText = "Showing 0 to 0 of 0 entries";
      controls.innerHTML = "";
      return;
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalEntries);
    info.innerText = `Showing ${start} to ${end} of ${totalEntries} entries`;

    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link border-0 bg-transparent" href="javascript:void(0)" data-page="prev"><i class="bi bi-chevron-left"></i></a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link border-0 rounded-circle ${currentPage === i ? '' : 'text-muted'}" href="javascript:void(0)" data-page="${i}">${i}</a>
            </li>
        `;
    }

    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link border-0 bg-transparent text-muted" href="javascript:void(0)" data-page="next"><i class="bi bi-chevron-right"></i></a>
        </li>
    `;

    controls.innerHTML = html;
  };

  window.filterSales = function () {
    const query = document.getElementById("salesSearchInput").value.toLowerCase();
    const year = document.getElementById("salesYearSelect").value;
    const month = document.getElementById("salesMonthSelect").value;

    filteredSales = allSales.filter(sale => {
      const saleDate = new Date(sale.sales_date);
      const matchesQuery = (sale.sale_id.toString().includes(query) || (sale.name && sale.name.toLowerCase().includes(query)));
      const matchesYear = !year || saleDate.getFullYear().toString() === year;
      const matchesMonth = !month || (saleDate.getMonth() + 1).toString().padStart(2, '0') === month;

      return matchesQuery && matchesYear && matchesMonth;
    });

    window.renderSalesTable(filteredSales);
  };

  window.viewSaleInvoice = async function (saleId) {
    try {
      const saleItems = await window.sqlite.storeManager("getSaleItems", saleId);
      if (!saleItems || saleItems.length === 0) return;

      const mainSale = allSales.find(s => s.sale_id == saleId) || saleItems[0];

      document.getElementById("invoiceId").innerText = `#${saleId}`;
      document.getElementById("invoiceDate").innerText = `Date: ${new Date(mainSale.sales_date).toLocaleDateString()}`;
      document.getElementById("invoiceCustomerName").innerText = mainSale.name || "Walk-in Customer";
      document.getElementById("invoiceCustomerPhone").innerText = mainSale.contact || "N/A";
      document.getElementById("invoicePaymentMethod").innerText = mainSale.payment_method || "N/A";

      const softwareDetails = await window.electronAPI.getSoftwareDetails();
      document.getElementById("invoiceBranchName").innerText = softwareDetails.branchName || "Marybill Conglomerate";

      const invoiceHolder = document.getElementById("invoiceHolder");
      let subtotal = 0;
      let totalDiscount = 0;

      let tableHtml = `
            <table class="table table-bordered table-sm align-middle mb-0">
                <thead class="bg-light">
                    <tr>
                        <th class="ps-3">Item Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-end">Unit Price</th>
                        <th class="text-end pe-3">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;

      saleItems.forEach(item => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemDiscount = (item.discount / 100) * itemSubtotal;
        subtotal += itemSubtotal;
        totalDiscount += itemDiscount;

        tableHtml += `
                <tr>
                    <td class="ps-3">
                        <div class="fw-semibold">${item.product_name}</div>
                        <div class="small text-muted">${item.sale_type || 'Retail'}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">₦${Number(item.unit_price).toLocaleString()}</td>
                    <td class="text-end pe-3">₦${itemSubtotal.toLocaleString()}</td>
                </tr>
            `;
      });

      tableHtml += `</tbody></table>`;
      invoiceHolder.innerHTML = tableHtml;

      const total = subtotal - totalDiscount;
      document.getElementById("invoiceSubtotal").innerText = `₦${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      document.getElementById("invoiceTotalDiscount").innerText = `-₦${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      document.getElementById("invoiceTotal").innerText = `₦${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    } catch (err) {
      console.error("Failed to load invoice details:", err);
    }
  };

  window.downloadInvoice = async function () {
    const element = document.getElementById("printableInvoice");
    if (!element) return;

    try {
      const generator = window.electronAPI && window.electronAPI.html2canvas ? window.electronAPI.html2canvas : (typeof html2canvas !== 'undefined' ? html2canvas : null);
      if (!generator) return console.error("html2canvas not found");

      const canvas = await generator(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Invoice-${document.getElementById("invoiceId").innerText}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  window.printInvoice = function () {
    const element = document.getElementById("printableInvoice");
    if (!element) return;

    const printContents = element.innerHTML;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <html>
            <head>
                <title>Print Invoice</title>
                <link href="../assets/bootstrap/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                    .border-bottom-dashed { border-bottom: 1px dashed #dee2e6; }
                    .text-primary { color: #0d6efd !important; }
                    .text-success { color: #198754 !important; }
                    .text-muted { color: #6c757d !important; }
                    .fw-bold { font-weight: 700 !important; }
                    img { border-radius: 8px; margin-bottom: 10px; }
                    .table { width: 100%; margin-bottom: 1rem; color: #212529; vertical-align: top; border-color: #dee2e6; }
                    @media print { 
                        body { padding: 0; }
                        .no-print { display: none; } 
                    }
                </style>
            </head>
            <body>
                <div class="container">${printContents}</div>
                <script>
                    window.onload = () => { 
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };
})();
