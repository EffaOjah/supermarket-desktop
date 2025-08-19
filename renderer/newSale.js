var productSelect = document.getElementById("productSelect");
var productQuantity = document.getElementById("quantity");
var purchaseType = document.getElementById("purchaseType");
var paymentMethodSelect = document.getElementById("paymentMethodSelect");

var invoiceModal = new bootstrap.Modal(document.getElementById("invoiceModal"));

var productList;
var customers;
var cart = [];

// Parent element that will contain multiple child elements
const cartBody = document.getElementById("cartBody");
const addCartBtn = document.getElementById("addCartBtn");
const processSaleBtn = document.getElementById("processSaleBtn");

document.addEventListener("DOMContentLoaded", async () => {
    productList = await window.sqlite.storeManager("allProducts");
    customers = await window.sqlite.storeManager("getCustomers");

    console.log(productList, customers);
    loadSelections();
});

function loadSelections() {
    const productSelect = document.getElementById("productSelect");
    productList.map((p) => {
        let newOption = document.createElement("option");
        newOption.innerHTML = `${p.product_name}`;
        newOption.value = p.product_id;
        productSelect.appendChild(newOption);
    });

    const roleSelect = document.getElementById("role");
    customers.map((cus) => {
        let newOption = document.createElement("option");
        newOption.innerHTML = cus.name;
        newOption.value = `${cus.customer_id}:${cus.name}`;
        roleSelect.appendChild(newOption);
    });
}

function attachSelectCheck() {
    window.electronAPI.warningDialog("Select Customer", "Please select a customer!");
}

function addToCart() {
    const customer = document.getElementById("role").value;
    const productId = document.getElementById("productSelect").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const purchaseType = document.getElementById("purchaseType").value;

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

    const product = productList.find((p) => p.product_id === productId);

    // Check stock quantity
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
        (item) => item.product_id === productId &&
            item.customerName === customerName &&
            item.purchaseType === purchaseType
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity, customerName, customerId, purchaseType, paymentMethod: "cash", discount: 0 });
    }

    console.log(cart);
    updateCart();
}

function updateCart() {
    cartBody.innerHTML = "";
    let totalPrice = 0;

    cart.forEach((item, index) => {
        let unitPrice = item.purchaseType == "Wholesale" ? item.wholesale_selling_price : item.retail_selling_price;
        let discountedPrice = unitPrice - (unitPrice * (item.discount || 0) / 100);
        let total = unitPrice * item.quantity;
        let discountTotal = discountedPrice * item.quantity;
        totalPrice += discountTotal;

        let row = `
            <tr>
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.purchaseType}</td>
                <td>${item.quantity}</td>
                <td>₦${unitPrice}</td>
                <td>₦${total}</td>
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
                <td>₦${discountTotal.toFixed(2)}</td>
                <td><a class="btn btn-sm btn-primary remove-button" id="${index}:${item.product_id}:${item.purchaseType}">Delete</a></td>
            </tr>`;
        cartBody.innerHTML += row;
    });

    document.getElementById("totalPrice").innerText = totalPrice.toFixed(2);
}

function removeFromCart(index, id, purchaseType) {
    let productIndex = productList.findIndex((p) => p.product_id == id);
    let productFromCart = cart.find((p) => p.product_id == id && p.purchaseType === purchaseType);

    if (purchaseType == "Wholesale") {
        productList[productIndex].stock_quantity_wholesale += productFromCart.quantity;
    } else {
        productList[productIndex].stock_quantity_retail += productFromCart.quantity;
    }

    cart.splice(index, 1);
    updateCart();
}

paymentMethodSelect.addEventListener('change', (e) => {
    cart.forEach(item => item.paymentMethod = e.target.value);
});

async function processSale() {
    const date = new Date();
    let timeStamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    console.log('Date: ', timeStamp);

    if (cart.length === 0)
        return window.electronAPI.warningDialog("Empty Cart", "Cart is empty. Add products first!");

    if (paymentMethodSelect.value == "")
        return window.electronAPI.warningDialog("Invalid Payment Method", "Please choose a payment method!");

    let confirm = window.confirm("Are you sure you wanna process this sale?");
    if (!confirm) return;

    const newSale = await window.sqlite.storeManager(
        "insertNewSale",
        cart[0].customerId,
        document.getElementById("totalPrice").innerText,
        cart[0].paymentMethod,
        timeStamp
    );

    if (window.functions.handleDBError(newSale.code)) {
        console.log("Error while executing db query: ", newSale.code, newSale.message);
        window.electronAPI.errorDialog("Server Error", "An Error occured!");
        return;
    }

    for (const item of cart) {
        let unitPrice = item.purchaseType == "Wholesale" ? item.wholesale_selling_price : item.retail_selling_price;
        let discountedPrice = unitPrice - (unitPrice * (item.discount || 0) / 100);
        let total = discountedPrice * item.quantity;

        const newSaleItem = await window.sqlite.storeManager(
            "insertNewSaleItem",
            newSale.lastInsertRowid,
            item.product_id,
            item.quantity,
            item.discount,
            unitPrice,
            item.purchaseType,
            total
        );

        if (window.functions.handleDBError(newSaleItem.code)) {
            console.log("Error while executing db query: ", newSaleItem.code, newSaleItem.message);
            window.electronAPI.errorDialog("Server Error", "An Error occured!");
            return;
        }

        if (item.purchaseType == "Wholesale") {
            window.sqlite.storeManager("updateWholesaleStockQuantity", item.quantity, item.product_id);
        } else {
            window.sqlite.storeManager("updateRetailStockQuantity", item.quantity, item.product_id);
        }
    }

    console.log("Sale Recorded:", cart);
    alert("Sale recorded successfully!");

    cart = [];
    updateCart();
    viewSaleInvoice(newSale.lastInsertRowid);
    closeSale();
    syncSales();
}

function closeSale() {
    load_customers_products();
    cart = [];
    cartBody.innerHTML = "";
    document.getElementById("role").disabled = false;
    document.getElementById("role").value = "";
    document.getElementById("closeSaleBtn").disabled = true;
    document.getElementById("closeSaleBtn").style.display = "none";
}

async function load_customers_products() {
    productList = await window.sqlite.storeManager("allProducts");
    customers = await window.sqlite.storeManager("getCustomers");
    console.log(productList, customers);
}

document.getElementById("role").addEventListener("change", () => {
    if (document.getElementById("role").value !== "") {
        document.getElementById("role").disabled = true;
        document.getElementById("closeSaleBtn").disabled = false;
        document.getElementById("closeSaleBtn").style.display = "block";
    }
});

document.getElementById("closeSaleBtn").addEventListener("click", () => {
    var confirm = window.confirm("Are you sure you wanna close sale?");
    if (confirm) closeSale();
});

addCartBtn.addEventListener("click", addToCart);
processSaleBtn.addEventListener("click", processSale);

// Event Delegation
cartBody.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-button")) {
        let [index, id, type] = event.target.id.split(":");
        removeFromCart(index, id, type);
    }
});

// Handle discount change events
cartBody.addEventListener("change", (e) => {
    if (e.target.classList.contains("discount-select")) {
        const index = e.target.dataset.index;
        const value = e.target.value;

        if (value === "custom") {
            document.querySelector(`.custom-discount-input[data-index="${index}"]`).classList.remove("d-none");
        } else {
            cart[index].discount = parseFloat(value);
            updateCart();
        }
    }

    if (e.target.classList.contains("custom-discount-input")) {
        const index = e.target.dataset.index;
        const value = parseFloat(e.target.value) || 0;
        cart[index].discount = value;
        updateCart();
    }
});

async function viewSaleInvoice(saleId) {
    invoiceModal.show();
    const invoiceHolder = document.getElementById("invoiceHolder");
    invoiceHolder.innerHTML = "";

    let saleDetails = await window.sqlite.storeManager("getSaleItems", saleId);
    console.log("saleDetails: ", saleDetails);

    let theBranchName = branchName;
    document.getElementById('branch').innerHTML = theBranchName == 'MARYBILL MABILCO VENTURES' || theBranchName == 'MABILCO ENTERPRISE' ? branchName : `MaryBill Conglomerate | ${branchName}`;

    document.getElementById('customer').innerHTML = saleDetails[0].name;
    document.getElementById('paymentMethod').innerHTML = saleDetails[0].payment_method;
    document.getElementById('saleDate').innerHTML = saleDetails[0].sales_date;

    const newDiv = document.createElement("div");
    newDiv.innerHTML = `
        <table id="saleDetailTable" class="table table-bordered invoice-details">
            <thead>
                <tr>
                    <th>S/N</th>
                    <th>ITEMS</th>
                    <th>PURCHASE TYPE</th>
                    <th>QUANTITY</th>
                    <th>PRICE PER QUANTITY</th>
                    <th>PRICE</th>
                    <th>DISCOUNT RATE</th>
                    <th>DISCOUNTED VALUE</th>
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
        <p class="fs-6 text-end">Total: ₦${saleDetails[0].total_amount}</p>`;
    invoiceHolder.appendChild(newDiv);
}

window.electronStore.getProtectedData().then((result) => console.log(result));

function printInvoice() {
    const invoiceContent = document.getElementById("printableInvoice").innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
        <html><head><title>Print Invoice</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;}
        .invoice-box{max-width:800px;margin:auto;padding:30px;border:1px solid #eee;box-shadow:0 0 10px rgba(0,0,0,.15);}
        .text-end{text-align:right;}table{width:100%;border-collapse:collapse;}table th,table td{border:1px solid #000;padding:8px;}</style>
        </head><body>${invoiceContent}</body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print(); printWindow.close();
}

async function downloadInvoiceImage() {
    const invoice = document.getElementById("printableInvoice");
    window.electronAPI.html2canvas(invoice).then((canvas) => {
        const imageData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = `invoice-${Math.floor(Math.random() * 1000)}.png`;
        link.click();
    });
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

document.getElementById("printBtn").addEventListener("click", downloadInvoiceImage);
