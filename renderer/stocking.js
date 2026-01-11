(function () {
    // Stocking History Logic
    let allStocking = [];
    let filteredStocking = [];
    let currentPage = 1;
    const pageSize = 10;

    window.initStocking = async function () {
        console.log("Initializing Stocking History...");

        const searchInput = document.getElementById("stockingSearchInput");
        if (searchInput) {
            searchInput.oninput = () => {
                currentPage = 1;
                window.filterStockingHistory();
            };
        }

        const yearSelect = document.getElementById("stockingYearSelect");
        if (yearSelect) {
            yearSelect.onchange = () => {
                currentPage = 1;
                window.filterStockingHistory();
            };
        }

        const monthSelect = document.getElementById("stockingMonthSelect");
        if (monthSelect) {
            monthSelect.onchange = () => {
                currentPage = 1;
                window.filterStockingHistory();
            };
        }

        const paginationControls = document.getElementById("stockingPaginationControls");
        if (paginationControls) {
            paginationControls.onclick = (e) => {
                e.preventDefault();
                const pageLink = e.target.closest(".page-link");
                if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
                    const page = pageLink.getAttribute("data-page");
                    if (page === "prev") currentPage--;
                    else if (page === "next") currentPage++;
                    else currentPage = parseInt(page);

                    window.renderStockingTable(filteredStocking);
                }
            };
        }

        await window.loadStockingHistory();
    };

    window.loadStockingHistory = async function () {
        const tableBody = document.getElementById("stockingTableBody");
        if (!tableBody) return;

        try {
            // Use the new flat stocking items method
            allStocking = await window.sqlite.storeManager("getAllStockingItems");
            filteredStocking = [...allStocking];
            window.renderStockingTable(filteredStocking);
        } catch (err) {
            console.error("Failed to load stocking history:", err);
        }
    };

    window.renderStockingTable = function (stockList) {
        const tableBody = document.getElementById("stockingTableBody");
        if (!tableBody) return;

        const totalEntries = stockList.length;
        const totalPages = Math.ceil(totalEntries / pageSize);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

        const start = (currentPage - 1) * pageSize;
        const end = Math.min(start + pageSize, totalEntries);
        const currentItems = stockList.slice(start, end);

        tableBody.innerHTML = totalEntries ? "" : '<tr><td colspan="8" class="text-center py-4 text-muted">No stocking records found.</td></tr>';

        currentItems.forEach((stock, index) => {
            const row = document.createElement("tr");
            const stockDate = new Date(stock.stocking_date);
            const formattedDate = stockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = stockDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const wQty = stock.wholesale_quantity || 0;
            const rQty = stock.retail_quantity || 0;
            const wCost = stock.wholesale_cost_price || 0;
            const rCost = stock.retail_cost_price || 0;

            const totalCost = (wQty * wCost) + (rQty * rCost);

            row.innerHTML = `
            <td class="text-muted">${start + index + 1}</td>
            <td class="text-muted">
                ${formattedDate}
                <span class="small text-muted d-block">${formattedTime}</span>
            </td>
            <td><div class="fw-semibold">${stock.product_name}</div></td>
            <td class="text-muted">${stock.supplier_name || 'N/A'}</td>
            <td class="text-center fw-medium text-info">${wQty}</td>
            <td class="text-center fw-medium text-primary">${rQty}</td>
            <td class="text-end text-muted small">
                W: ₦${Number(wCost).toLocaleString()}<br>
                R: ₦${Number(rCost).toLocaleString()}
            </td>
            <td class="text-end fw-bold text-success">₦${Number(totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        `;
            tableBody.appendChild(row);
        });

        window.renderStockingPagination(totalEntries, totalPages);
    };

    window.renderStockingPagination = function (totalEntries, totalPages) {
        const info = document.getElementById("stockingPaginationInfo");
        const controls = document.getElementById("stockingPaginationControls");
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

    window.filterStockingHistory = function () {
        const query = document.getElementById("stockingSearchInput").value.toLowerCase();
        const year = document.getElementById("stockingYearSelect").value;
        const month = document.getElementById("stockingMonthSelect").value;

        filteredStocking = allStocking.filter(stock => {
            const stockDate = new Date(stock.stocking_date);
            const matchesQuery = (
                stock.product_name.toLowerCase().includes(query) ||
                (stock.supplier_name && stock.supplier_name.toLowerCase().includes(query))
            );
            const matchesYear = !year || stockDate.getFullYear().toString() === year;
            const matchesMonth = !month || (stockDate.getMonth() + 1).toString().padStart(2, '0') === month;

            return matchesQuery && matchesYear && matchesMonth;
        });

        window.renderStockingTable(filteredStocking);
    };
})();