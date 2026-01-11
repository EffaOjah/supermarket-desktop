(function () {
  // Products State
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  const pageSize = 30;

  window.initProducts = async function () {
    console.log("Initializing Products Page...");

    const searchInput = document.getElementById("productSearchInput");
    const categorySelect = document.getElementById("productCategorySelect");
    const supplierSelect = document.getElementById("productSupplierSelect");

    if (searchInput) {
      searchInput.oninput = () => {
        currentPage = 1;
        window.filterProductItems();
      };
    }

    if (categorySelect) {
      categorySelect.onchange = () => {
        currentPage = 1;
        window.filterProductItems();
      };
    }

    if (supplierSelect) {
      supplierSelect.onchange = () => {
        currentPage = 1;
        window.filterProductItems();
      };
    }

    const paginationControls = document.getElementById("productPaginationControls");
    if (paginationControls) {
      paginationControls.onclick = (e) => {
        e.preventDefault();
        const pageLink = e.target.closest(".page-link");
        if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
          const page = pageLink.getAttribute("data-page");
          if (page === "prev") currentPage--;
          else if (page === "next") currentPage++;
          else currentPage = parseInt(page);

          window.renderProductTable(filteredProducts);
        }
      };
    }

    // Table Action Delegation (View Sales)
    const tableBody = document.getElementById("productTableBody");
    if (tableBody) {
      tableBody.onclick = (e) => {
        if (e.target.classList.contains("view-sales-btn")) {
          const productId = e.target.getAttribute("data-product-id");
          window.loadProductSalesHistory(productId);
        }
      };
    }

    const downloadBtn = document.getElementById("downloadInvoiceBtn");
    if (downloadBtn) {
      downloadBtn.onclick = window.downloadProductInvoice;
    }

    const printBtn = document.getElementById("printInvoiceBtn");
    if (printBtn) {
      printBtn.onclick = window.printProductInvoice;
    }

    // Sales Modal Delegation (View Invoice)
    const detailsHolder = document.getElementById("detailsHolder");
    if (detailsHolder) {
      detailsHolder.onclick = (e) => {
        if (e.target.classList.contains("view-invoice-btn")) {
          const saleId = e.target.getAttribute("data-sale-id");
          window.viewProductInvoice(saleId);
        }
      };
    }

    await window.loadProductData();
  };

  window.loadProductData = async function () {
    try {
      allProducts = await window.sqlite.storeManager("allProducts");
      const suppliers = await window.sqlite.storeManager("getSuppliers");

      // Populate Filters
      populateFilters(allProducts, suppliers);

      filteredProducts = [...allProducts];
      window.renderProductTable(filteredProducts);
    } catch (err) {
      console.error("Failed to load products data:", err);
    }
  };

  function populateFilters(products, suppliers) {
    const categorySelect = document.getElementById("productCategorySelect");
    const supplierSelect = document.getElementById("productSupplierSelect");

    if (categorySelect) {
      const categories = [...new Set(products.map(p => p.category))].sort();
      categorySelect.innerHTML = '<option value="" selected>All Categories</option>';
      categories.forEach(cat => {
        if (cat) {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.innerText = cat;
          categorySelect.appendChild(opt);
        }
      });
    }

    if (supplierSelect) {
      supplierSelect.innerHTML = '<option value="" selected>All Suppliers</option>';
      suppliers.forEach(sup => {
        const opt = document.createElement("option");
        opt.value = sup.supplier_id;
        opt.innerText = sup.name;
        supplierSelect.appendChild(opt);
      });
    }
  }

  window.renderProductTable = function (productList) {
    const tableBody = document.getElementById("productTableBody");
    if (!tableBody) return;

    const totalEntries = productList.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, totalEntries);
    const currentItems = productList.slice(start, end);

    tableBody.innerHTML = totalEntries ? "" : '<tr><td colspan="9" class="text-center py-4 text-muted">No products found.</td></tr>';

    currentItems.forEach((product, index) => {
      const row = document.createElement("tr");

      // Stock indicators
      const wQty = product.stock_quantity_wholesale || 0;
      const rQty = product.stock_quantity_retail || 0;
      const reorderLevel = product.reorder_level || 10;

      const wBadgeClass = wQty < reorderLevel ? 'bg-danger' : (wQty < reorderLevel * 2 ? 'bg-warning' : 'bg-success');
      const rBadgeClass = rQty < reorderLevel ? 'bg-danger' : (rQty < reorderLevel * 2 ? 'bg-warning' : 'bg-success');

      row.innerHTML = `
                <td class="text-muted">${start + index + 1}</td>
                <td>
                    <div class="fw-semibold">${product.product_name}</div>
                </td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary rounded-pill">${product.category || 'N/A'}</span></td>
                <td class="text-muted small">${product.name || 'Unknown'}</td>
                <td class="text-end fw-medium">₦${Number(product.wholesale_selling_price).toLocaleString()}</td>
                <td class="text-center">
                    <span class="badge ${wBadgeClass} bg-opacity-10 text-${wBadgeClass.replace('bg-', '')}">${wQty}</span>
                </td>
                <td class="text-end fw-medium">₦${Number(product.retail_selling_price).toLocaleString()}</td>
                <td class="text-center">
                    <span class="badge ${rBadgeClass} bg-opacity-10 text-${rBadgeClass.replace('bg-', '')}">${rQty}</span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary shadow-sm view-sales-btn" data-product-id="${product.product_id}" data-bs-toggle="modal" data-bs-target="#allsales">
                        View Sales
                    </button>
                </td>
            `;
      tableBody.appendChild(row);
    });

    window.renderProductPagination(totalEntries, totalPages);
  };

  window.renderProductPagination = function (totalEntries, totalPages) {
    const info = document.getElementById("productPaginationInfo");
    const controls = document.getElementById("productPaginationControls");
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

  window.filterProductItems = function () {
    const query = document.getElementById("productSearchInput").value.toLowerCase();
    const category = document.getElementById("productCategorySelect").value;
    const supplierId = document.getElementById("productSupplierSelect").value;

    filteredProducts = allProducts.filter(product => {
      const matchesQuery = product.product_name.toLowerCase().includes(query);
      const matchesCategory = !category || product.category === category;
      const matchesSupplier = !supplierId || product.supplier_id == supplierId;

      return matchesQuery && matchesCategory && matchesSupplier;
    });

    window.renderProductTable(filteredProducts);
  };

  window.loadProductSalesHistory = async function (productId) {
    const detailsHolder = document.getElementById("detailsHolder");
    if (!detailsHolder) return;

    detailsHolder.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
      const rawProductSales = await window.sqlite.storeManager("productSales", productId);
      const productSales = rawProductSales.sort((a, b) => new Date(b.sales_date) - new Date(a.sales_date));

      if (!productSales || productSales.length === 0) {
        detailsHolder.innerHTML = '<div class="text-center py-5 text-muted">No sales recorded for this product.</div>';
        return;
      }

      let html = `
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Date</th>
                                <th class="text-center">Quantity Sold</th>
                                <th class="text-center">Type</th>
                                <th class="text-end">Unit Price</th>
                                <th class="text-end">Total</th>
                                <th class="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productSales.map((sale, index) => {
        const subtotal = sale.unit_price * sale.quantity;
        const discountValue = (sale.discount / 100) * subtotal;
        const total = subtotal - discountValue;
        return `
                                    <tr>
                                        <td class="text-muted">${index + 1}</td>
                                        <td class="text-muted">${new Date(sale.sales_date).toLocaleDateString()}</td>
                                        <td class="text-center fw-medium">${sale.quantity}</td>
                                        <td class="text-center">
                                            <span class="badge ${sale.sale_type === 'Wholesale' ? 'bg-info' : 'bg-primary'} bg-opacity-10 text-${sale.sale_type === 'Wholesale' ? 'info' : 'primary'}">${sale.sale_type}</span>
                                        </td>
                                        <td class="text-end">₦${Number(sale.unit_price).toLocaleString()}</td>
                                        <td class="text-end fw-bold">₦${total.toLocaleString()}</td>
                                        <td class="text-center">
                                            <button class="btn btn-sm btn-light view-invoice-btn" data-sale-id="${sale.sale_id}" data-bs-toggle="modal" data-bs-target="#invoiceModal">
                                                View Invoice
                                            </button>
                                        </td>
                                    </tr>
                                `;
      }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
      detailsHolder.innerHTML = html;
    } catch (err) {
      console.error("Error loading product sales:", err);
      detailsHolder.innerHTML = '<div class="alert alert-danger">Error loading sales history.</div>';
    }
  };

  window.viewProductInvoice = async function (saleId) {
    try {
      const saleItems = await window.sqlite.storeManager("getSaleItems", saleId);
      if (!saleItems || saleItems.length === 0) return;

      const mainSale = saleItems[0];

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

  window.downloadProductInvoice = async function () {
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

  window.printProductInvoice = function () {
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
