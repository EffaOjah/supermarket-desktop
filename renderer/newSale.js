(function () {
    // State variables
    let productList = [];
    let customers = [];
    let cart = [];
    // DOM Elements (initially null)
    let cartBody;
    let addCartBtn;
    let processSaleBtn;

    // Expose init function for SPA router
    window.initNewSale = async function () {
        console.log("Initializing New Sale Page...");

        // Select elements after DOM is loaded
        cartBody = document.getElementById("cartBody");
        addCartBtn = document.getElementById("addCartBtn");
        processSaleBtn = document.getElementById("processSaleBtn");
        const closeSaleBtn = document.getElementById("closeSaleBtn");

        if (!addCartBtn || !cartBody) {
            console.error("New Sale elements not found! specific DOM elements missing.");
            return;
        }

        // Load Data
        try {
            productList = await window.sqlite.storeManager("allProducts");
            customers = await window.sqlite.storeManager("getCustomers");
            window.loadNewSaleSelections();
        } catch (err) {
            console.error("Failed to load data:", err);
        }

        // Attach Event Listeners
        setupEventListeners(closeSaleBtn);

        const downloadBtn = document.getElementById("downloadInvoiceBtn");
        if (downloadBtn) {
            downloadBtn.onclick = () => { console.log("Download clicked"); window.downloadInvoice(); };
        }

        const printBtn = document.getElementById("printInvoiceBtn");
        if (printBtn) {
            printBtn.onclick = () => { console.log("Print clicked"); window.printInvoice(); };
        }

        // Initial UI updates
        window.updateNewSaleCart();
    };

    function setupEventListeners(closeSaleBtn) {
        console.log("Setting up event listeners for New Sale...");
        addCartBtn.onclick = () => { console.log("Add Cart clicked"); window.addToCart(); };
        processSaleBtn.onclick = () => { console.log("Process Sale clicked"); window.processSale(); };
        if (closeSaleBtn) closeSaleBtn.onclick = () => { console.log("Close Sale clicked"); window.closeSale(); };

        const prodSelect = document.getElementById("productSelect");
        if (prodSelect) prodSelect.onchange = window.updateStockDisplay;

        const typeRadios = document.querySelectorAll('input[name="purchaseType"]');
        typeRadios.forEach(radio => radio.onchange = window.updateStockDisplay);

        // Cart Delegation
        cartBody.onclick = (event) => {
            if (event.target.closest(".remove-button")) {
                const btn = event.target.closest(".remove-button");
                let [index, id, type] = btn.id.split(":");
                window.removeFromCart(parseInt(index), id, type);
            }
        };

        // Discount Delegation
        cartBody.onchange = (e) => {
            if (e.target.classList.contains("discount-select")) {
                const index = e.target.dataset.index;
                const value = e.target.value;

                if (value === "custom") {
                    const customInput = document.querySelector(`.custom-discount-input[data-index="${index}"]`);
                    if (customInput) {
                        customInput.classList.remove("d-none");
                        customInput.focus();
                    }
                } else {
                    const customInput = document.querySelector(`.custom-discount-input[data-index="${index}"]`);
                    if (customInput) customInput.classList.add("d-none");

                    cart[index].discount = parseFloat(value);
                    window.updateNewSaleCart();
                }
            }

            if (e.target.classList.contains("custom-discount-input")) {
                const index = e.target.dataset.index;
                const value = parseFloat(e.target.value) || 0;
                cart[index].discount = value;
                window.updateNewSaleCart();
            }
        };

        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                let method = "Cash";
                if (e.target.id === "payCard") method = "Card";
                if (e.target.id === "payTransfer") method = "Transfer";
                if (e.target.id === "payWallet") method = "Wallet";

                cart.forEach(item => item.paymentMethod = method);
            });
        });
    }

    window.loadNewSaleSelections = function () {
        const productSelect = document.getElementById("productSelect");
        const customerSelect = document.getElementById("customerSelect");

        if (!productSelect || !customerSelect) return;

        productSelect.innerHTML = '<option value="" selected disabled>Select product...</option>';
        productList.forEach((p) => {
            let newOption = document.createElement("option");
            newOption.innerHTML = `${p.product_name}`;
            newOption.value = p.product_id;
            productSelect.appendChild(newOption);
        });

        customerSelect.innerHTML = '<option value="" selected disabled>Select customer...</option>';
        customers.forEach((cus) => {
            let newOption = document.createElement("option");
            newOption.innerHTML = cus.name;
            newOption.value = `${cus.customer_id}:${cus.name}`;
            customerSelect.appendChild(newOption);
        });
    }

    window.addToCart = function () {
        const customer = document.getElementById("customerSelect").value;
        const productId = document.getElementById("productSelect").value;
        const quantity = parseInt(document.getElementById("quantityInput").value);

        const purchaseTypeRadio = document.querySelector('input[name="purchaseType"]:checked');
        const purchaseType = purchaseTypeRadio ? purchaseTypeRadio.nextElementSibling.innerText : null;

        let split = customer.split(":");
        let customerId = split[0];
        let customerName = split[1];

        if (!customerName)
            return window.electronAPI.warningDialog("Invalid Customer", "Please select a customer.");
        if (!productId)
            return window.electronAPI.warningDialog("Invalid Product", "Please select a product.");
        if (!quantity || quantity < 1)
            return window.electronAPI.warningDialog("Invalid Quantity", "Quantity must be at least 1.");
        if (!purchaseType)
            return window.electronAPI.warningDialog("Invalid Purchase Type", "Please select a purchase type.");

        const product = productList.find((p) => p.product_id == productId);

        if (!product) {
            return window.electronAPI.errorDialog("Invalid Product", "Please select a product.");
        }

        if (purchaseType == "Wholesale") {
            if (quantity > product.stock_quantity_wholesale) {
                return window.electronAPI.errorDialog("Insufficient Product", "You do not have sufficient products for this sale.");
            }
            product.stock_quantity_wholesale -= quantity;
        } else {
            if (quantity > product.stock_quantity_retail) {
                return window.electronAPI.errorDialog("Insufficient Product", "You do not have sufficient products for this sale.");
            }
            product.stock_quantity_retail -= quantity;
        }

        const existingItem = cart.find(
            (item) => item.product_id == productId &&
                item.customerName === customerName &&
                item.purchaseType === purchaseType
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity, customerName, customerId, purchaseType, paymentMethod: "cash", discount: 0 });
        }

        window.updateNewSaleCart();
    }

    window.updateNewSaleCart = function () {
        if (!cartBody) return;
        cartBody.innerHTML = "";
        let totalSubtotal = 0;
        let totalDiscount = 0;

        cart.forEach((item, index) => {
            let unitPrice = item.purchaseType == "Wholesale" ? item.wholesale_selling_price : item.retail_selling_price;
            let subtotal = unitPrice * item.quantity;
            let discountedPrice = unitPrice - (unitPrice * (item.discount || 0) / 100);
            let discountValue = (unitPrice * (item.discount || 0) / 100) * item.quantity;

            totalSubtotal += subtotal;
            totalDiscount += discountValue;

            let row = `
            <tr>
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.purchaseType}</td>
                <td>${item.quantity}</td>
                <td>₦${unitPrice}</td>
                <td>₦${subtotal.toFixed(2)}</td>
                <td>
                    <select class="discount-select form-select" data-index="${index}">
                        <option value="0" ${item.discount == 0 ? "selected" : ""}>0%</option>
                        <option value="2" ${item.discount == 2 ? "selected" : ""}>2%</option>
                        <option value="5" ${item.discount == 5 ? "selected" : ""}>5%</option>
                        <option value="7" ${item.discount == 7 ? "selected" : ""}>7%</option>
                        <option value="custom">Custom</option>
                    </select>
                    <input type="number" class="custom-discount-input form-control d-none mt-1" data-index="${index}" value="${item.discount}" min="0" max="100" placeholder="Custom %">
                </td>
                <td>₦${discountValue.toFixed(2)}</td>
                <td><a class="btn btn-sm btn-primary remove-button" id="${index}:${item.product_id}:${item.purchaseType}">Delete</a></td>
            </tr>`;
            cartBody.innerHTML += row;
        });

        let finalTotal = totalSubtotal - totalDiscount;

        document.getElementById("subtotalPrice").innerText = `₦${totalSubtotal.toFixed(2)}`;
        document.getElementById("summaryDiscount").innerText = `-₦${totalDiscount.toFixed(2)}`;
        document.getElementById("totalPrice").innerText = `₦${finalTotal.toFixed(2)}`;
        document.getElementById("cartItemCount").innerText = `${cart.length} Item${cart.length !== 1 ? 's' : ''}`;
    }

    window.removeFromCart = function (index, id, purchaseType) {
        let productIndex = productList.findIndex((p) => p.product_id == id);
        let productFromCart = cart.find((p) => p.product_id == id && p.purchaseType === purchaseType);

        if (purchaseType == "Wholesale") {
            productList[productIndex].stock_quantity_wholesale += productFromCart.quantity;
        } else {
            productList[productIndex].stock_quantity_retail += productFromCart.quantity;
        }

        cart.splice(index, 1);
        window.updateNewSaleCart();
    }

    window.processSale = async function () {
        const timeStamp = new Date().toISOString();

        if (cart.length === 0)
            return window.electronAPI.warningDialog("Empty Cart", "Cart is empty. Add products first!");

        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentRadio)
            return window.electronAPI.warningDialog("Invalid Payment Method", "Please choose a payment method!");

        let paymentMethod = "Cash";
        if (paymentRadio.id === "payCard") paymentMethod = "Card";
        if (paymentRadio.id === "payTransfer") paymentMethod = "Transfer";
        if (paymentRadio.id === "payWallet") paymentMethod = "Wallet";

        let confirm = window.confirm("Are you sure you wanna process this sale?");
        if (!confirm) return;

        const newSale = await window.sqlite.storeManager(
            "insertNewSale",
            cart[0].customerId,
            document.getElementById("totalPrice").innerText.replace('₦', ''),
            paymentMethod,
            timeStamp
        );

        if (window.functions.handleDBError(newSale.code)) {
            window.electronAPI.errorDialog("Server Error", "An Error occured!");
            return;
        }

        const paymentReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const paymentDateTime = new Date().toISOString();

        await window.sqlite.storeManager(
            "insertPayment",
            newSale.lastInsertRowid,
            document.getElementById("totalPrice").innerText.replace('₦', ''),
            paymentMethod,
            paymentReference,
            "completed",
            paymentDateTime
        );

        for (const item of cart) {
            let unitPrice = item.purchaseType == "Wholesale" ? item.wholesale_selling_price : item.retail_selling_price;
            let discountedPrice = unitPrice - (unitPrice * (item.discount || 0) / 100);
            let total = discountedPrice * item.quantity;

            await window.sqlite.storeManager(
                "insertNewSaleItem",
                newSale.lastInsertRowid,
                item.product_id,
                item.quantity,
                item.discount,
                unitPrice,
                item.purchaseType,
                total
            );

            if (item.purchaseType == "Wholesale") {
                window.sqlite.storeManager("updateWholesaleStockQuantity", item.quantity, item.product_id);
            } else {
                window.sqlite.storeManager("updateRetailStockQuantity", item.quantity, item.product_id);
            }
        }

        alert("Sale recorded successfully!");
        const generatedSaleId = newSale.lastInsertRowid;
        cart = [];
        window.updateNewSaleCart();
        window.viewNewSaleInvoice(generatedSaleId);
        window.closeSale();
        syncSales();
    }

    window.closeSale = function () {
        if (cart.length > 0) {
            let confirmClose = window.confirm("Are you sure you want to close this sale? All cart items will be cleared.");
            if (!confirmClose) return;

            cart.forEach(item => {
                let productIndex = productList.findIndex(p => p.product_id == item.product_id);
                if (productIndex !== -1) {
                    if (item.purchaseType === "Wholesale") {
                        productList[productIndex].stock_quantity_wholesale += item.quantity;
                    } else {
                        productList[productIndex].stock_quantity_retail += item.quantity;
                    }
                }
            });
        }

        cart = [];
        window.updateNewSaleCart();
        window.updateStockDisplay();

        // Re-populate and reset selects properly
        window.loadNewSaleSelections();
        document.getElementById("customerSelect").disabled = false;
        document.getElementById("quantityInput").value = 1;
    }

    window.updateStockDisplay = function () {
        const productId = document.getElementById("productSelect").value;
        const purchaseTypeRadio = document.querySelector('input[name="purchaseType"]:checked');
        const purchaseType = purchaseTypeRadio ? purchaseTypeRadio.nextElementSibling.innerText.trim() : "Retail";
        const stockDisplay = document.getElementById("stockDisplay");

        if (productId && productList) {
            const product = productList.find((p) => p.product_id == productId);
            if (product) {
                const stock = purchaseType === "Wholesale" ? product.stock_quantity_wholesale : product.stock_quantity_retail;
                stockDisplay.innerText = stock;
            } else {
                stockDisplay.innerText = "0";
            }
        }
    }

    window.viewNewSaleInvoice = async function (saleId) {
        const invoiceModalEl = document.getElementById("invoiceModal");
        if (!invoiceModalEl) return;

        const invoiceModal = new bootstrap.Modal(invoiceModalEl);
        invoiceModal.show();

        let saleDetails = await window.sqlite.storeManager("getSaleItems", saleId);
        if (!saleDetails || saleDetails.length === 0) return;

        const mainSale = saleDetails[0];

        document.getElementById("invoiceId").innerText = `#Sale-${saleId}`;
        document.getElementById("invoiceDate").innerText = `Date: ${new Date(mainSale.sales_date).toLocaleDateString()}`;
        document.getElementById("invoiceCustomerName").innerText = mainSale.name || "Walk-in Customer";
        document.getElementById("invoiceCustomerPhone").innerText = mainSale.contact || "N/A";
        document.getElementById("invoicePaymentMethod").innerText = mainSale.payment_method || "N/A";

        const invBranch = document.getElementById("invoiceBranchName");
        if (invBranch) {
            const softwareDetails = await window.electronAPI.getSoftwareDetails();
            invBranch.innerText = softwareDetails.branchName || "Marybill Conglomerate";
        }

        const invoiceHolder = document.getElementById("invoiceHolder");
        let totalSubtotal = 0;
        let totalDiscountValue = 0;

        let tableHtml = `
        <table class="table table-sm table-borderless align-middle mb-0">
            <thead class="border-bottom text-muted small text-uppercase">
                <tr>
                    <th class="py-2">Item</th>
                    <th class="py-2">Type</th>
                    <th class="py-2 text-center">Qty</th>
                    <th class="py-2 text-end">Unit</th>
                    <th class="py-2 text-end">Discount</th>
                    <th class="py-2 text-end">Total</th>
                </tr>
            </thead>
            <tbody>
                ${saleDetails.map(item => {
            const itemSubtotal = item.unit_price * item.quantity;
            const itemDiscountValue = (item.discount / 100) * itemSubtotal;
            const itemNetTotal = itemSubtotal - itemDiscountValue;

            totalSubtotal += itemSubtotal;
            totalDiscountValue += itemDiscountValue;

            return `
                        <tr class="border-bottom-dashed">
                            <td class="py-3">
                                <span class="fw-bold d-block">${item.product_name}</span>
                            </td>
                            <td class="py-3 fs-7">${item.sale_type}</td>
                            <td class="py-3 text-center">${item.quantity}</td>
                            <td class="py-3 text-end">₦${parseFloat(item.unit_price).toLocaleString()}</td>
                            <td class="py-3 text-end text-success">-${item.discount}%</td>
                            <td class="py-3 text-end fw-bold">₦${itemNetTotal.toLocaleString()}</td>
                        </tr>
                    `;
        }).join("")}
            </tbody>
        </table>`;

        invoiceHolder.innerHTML = tableHtml;
        document.getElementById("invoiceSubtotal").innerText = `₦${totalSubtotal.toLocaleString()}`;
        document.getElementById("invoiceTotalDiscount").innerText = `-₦${totalDiscountValue.toLocaleString()}`;
        document.getElementById("invoiceTotal").innerText = `₦${parseFloat(mainSale.total_amount).toLocaleString()}`;
    }

    function syncSales() {
        setTimeout(async () => {
            const sales = await window.sqlite.storeManager("getSalesForSyncing");
            const sales2 = await window.sqlite.storeManager("getSalesForSyncing2");
            const data = { sales, saleItems: sales2 };
            console.log("Sales data to sync:", data);
            const response = await window.electronAPI.syncSales(data);
            if (response?.error) return console.error("Sync failed:", response.message, response.error);
            const updateSyncedColumn = await window.sqlite.storeManager("updateSyncedColumn");
            console.log("Synced column updated:", updateSyncedColumn);
        }, 5000);
    }
})();
