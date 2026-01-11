(function () {
  // Customers Page Logic
  let allCustomers = [];
  let filteredCustomers = [];
  let currentPage = 1;
  const pageSize = 10;

  window.initCustomers = async function () {
    console.log("Initializing Customers Page...");

    const customerForm = document.getElementById("customerForm");
    if (customerForm) {
      customerForm.onsubmit = window.saveCustomer;
    }

    const openBtn = document.getElementById("openCustomerModalBtn");
    if (openBtn) {
      openBtn.onclick = window.openCustomerModal;
    }

    const searchInput = document.getElementById("customerSearchInput");
    if (searchInput) {
      searchInput.oninput = () => {
        currentPage = 1;
        window.filterCustomers();
      };
    }

    const tableBody = document.getElementById("customerTableBody");
    if (tableBody) {
      tableBody.onclick = (e) => {
        const editBtn = e.target.closest(".edit-customer-btn");
        const deleteBtn = e.target.closest(".delete-customer-btn");

        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          window.editCustomer(id);
        } else if (deleteBtn) {
          const id = deleteBtn.getAttribute("data-id");
          window.deleteCustomer(id);
        }
      };
    }

    const paginationControls = document.getElementById("customerPaginationControls");
    if (paginationControls) {
      paginationControls.onclick = (e) => {
        e.preventDefault();
        const pageLink = e.target.closest(".page-link");
        if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
          const page = pageLink.getAttribute("data-page");
          if (page === "prev") currentPage--;
          else if (page === "next") currentPage++;
          else currentPage = parseInt(page);

          window.renderCustomerTable(filteredCustomers);
        }
      };
    }

    await window.loadCustomers();
  };

  window.loadCustomers = async function () {
    const tableBody = document.getElementById("customerTableBody");
    if (!tableBody) return;

    try {
      allCustomers = await window.sqlite.storeManager("getCustomers");
      filteredCustomers = [...allCustomers];
      window.renderCustomerTable(filteredCustomers);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  window.renderCustomerTable = function (customers) {
    const tableBody = document.getElementById("customerTableBody");
    if (!tableBody) return;

    const totalEntries = customers.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, totalEntries);
    const currentItems = customers.slice(start, end);

    tableBody.innerHTML = totalEntries ? "" : '<tr><td colspan="5" class="text-center py-4 text-muted">No customers found.</td></tr>';

    currentItems.forEach((customer, index) => {
      const isWalkIn = customer.name.toLowerCase() === "walk-in-customer";
      const row = document.createElement("tr");
      row.innerHTML = `
            <td class="text-muted">${start + index + 1}</td>
            <td><div class="fw-semibold">${customer.name}</div></td>
            <td class="text-muted">${customer.contact || 'N/A'}</td>
            <td class="text-truncate mw-250">${customer.address || 'N/A'}</td>
            <td class="text-center">
                ${isWalkIn ? '<span class="badge bg-secondary opacity-50">System Protected</span>' : `
                <button class="btn btn-sm btn-light text-primary shadow-sm me-1 edit-customer-btn" data-id="${customer.customer_id}" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger shadow-sm delete-customer-btn" data-id="${customer.customer_id}" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
                `}
            </td>
        `;
      tableBody.appendChild(row);
    });

    window.renderCustomerPagination(totalEntries, totalPages);
  };

  window.renderCustomerPagination = function (totalEntries, totalPages) {
    const info = document.getElementById("customerPaginationInfo");
    const controls = document.getElementById("customerPaginationControls");
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

  window.openCustomerModal = function () {
    const modalEl = document.getElementById("customerModal");
    const modal = new bootstrap.Modal(modalEl);

    // Reset form
    document.getElementById("customerForm").reset();
    document.getElementById("customerId").value = "";
    document.getElementById("customerModalTitle").innerHTML = '<i class="bi bi-person-plus me-2"></i> New Customer';
    document.getElementById("saveCustomerBtn").innerText = "Save Customer";

    modal.show();
  };

  window.saveCustomer = async function (e) {
    e.preventDefault();
    console.log("Saving Customer...");

    const id = document.getElementById("customerId").value;
    const name = document.getElementById("customerName").value;
    const contact = document.getElementById("customerContact").value;
    const address = document.getElementById("customerAddress").value;

    if (!name || !contact) {
      return window.electronAPI.warningDialog("Missing Info", "Please provide a name and contact number.");
    }

    try {
      let result;
      if (id) {
        result = await window.sqlite.storeManager("updateCustomer", id, name, address, contact);
      } else {
        result = await window.sqlite.storeManager("addCustomer", name, address, contact);
      }

      if (result && result.error) {
        window.electronAPI.errorDialog("Save Error", result.error);
      } else {
        const modalEl = document.getElementById("customerModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await window.loadCustomers();
      }
    } catch (err) {
      console.error("Save failed:", err);
      window.electronAPI.errorDialog("Save Error", "An unexpected error occurred.");
    }
  };

  window.editCustomer = function (id) {
    const customer = allCustomers.find(c => c.customer_id == id);
    if (!customer) return;

    if (customer.name.toLowerCase() === "walk-in-customer") {
      return window.electronAPI.warningDialog("Action Denied", "The Walk-in Customer record is protected and cannot be edited.");
    }

    document.getElementById("customerId").value = customer.customer_id;
    document.getElementById("customerName").value = customer.name;
    document.getElementById("customerContact").value = customer.contact;
    document.getElementById("customerAddress").value = customer.address;

    document.getElementById("customerModalTitle").innerHTML = '<i class="bi bi-pencil me-2"></i> Edit Customer';
    document.getElementById("saveCustomerBtn").innerText = "Update Customer";

    const modalEl = document.getElementById("customerModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  };

  window.deleteCustomer = async function (id) {
    const customer = allCustomers.find(c => c.customer_id == id);
    if (customer && customer.name.toLowerCase() === "walk-in-customer") {
      return window.electronAPI.warningDialog("Action Denied", "The Walk-in Customer record is protected and cannot be deleted.");
    }

    const confirm = window.confirm("Are you sure you want to delete this customer? This action cannot be undone.");
    if (!confirm) return;

    try {
      const result = await window.sqlite.storeManager("deleteCustomer", id);
      if (result && result.error) {
        window.electronAPI.errorDialog("Delete Error", result.error);
      } else {
        await window.loadCustomers();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  window.filterCustomers = function () {
    const query = document.getElementById("customerSearchInput").value.toLowerCase();
    filteredCustomers = allCustomers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.contact && c.contact.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
    window.renderCustomerTable(filteredCustomers);
  };
})();
