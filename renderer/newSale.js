var productSelect = document.getElementById("productSelect");
var productQuantity = document.getElementById("quantity");
var purchaseType = document.getElementById("purchaseType");

var invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));

var productList;
var customers;
var cart = [];

// Parent element that will contain multiple child elements
const cartBody =  document.getElementById("cartBody");
const addCartBtn = document.getElementById('addCartBtn');
const processSaleBtn = document.getElementById('processSaleBtn');

document.addEventListener('DOMContentLoaded', async () => {
    productList = await window.sqlite.storeManager?.allProducts();
    customers = await window.sqlite.storeManager?.getCustomers();

    console.log(productList, customers);

    loadSelections();
});

function loadSelections() {
    const productSelect = document.getElementById("productSelect");

    productList.map(p => {
        let newOption = document.createElement('option');
        newOption.innerHTML = `${p.product_name}`;
        newOption.value = p.product_id;

        productSelect.appendChild(newOption);
    }).join('');

    const roleSelect = document.getElementById("role");
    customers.map(cus => {
        let newOption = document.createElement('option');
        newOption.innerHTML = cus.name;
        newOption.value = `${cus.customer_id}-${cus.name}`;

        roleSelect.appendChild(newOption);
    }).join('');
}

function attachSelectCheck() {
    window.electronAPI.warningDialog('Select Customer', 'Please select a customer!');
}

function addToCart() {
    const customer = document.getElementById("role").value;
    const productId = parseInt(document.getElementById("productSelect").value);
    const quantity = parseInt(document.getElementById("quantity").value);
    const purchaseType = document.getElementById("purchaseType").value;

    let split = customer.split('-');
    let customerId = split[0];
    let customerName = split[1];

    if (!customerName) return window.electronAPI.warningDialog('Invalid Customer', 'Please select a customer.');
    if (!productId) return window.electronAPI.warningDialog('Invalid Product', 'Please select a product.');
    if (!quantity || quantity < 1) return window.electronAPI.warningDialog('Invalid Quantity', 'Quantity must be at least 1.');
    if (!purchaseType) return window.electronAPI.warningDialog('Invalid Purchase Type', 'Please select a purchase type.');

    const product = productList.find(p => p.product_id === productId);

    // Check if product quantity is more than the available product quantity
    if (purchaseType == 'Wholesale') {
        if (quantity > product.stock_quantity_wholesale) {
            return window.electronAPI.errorDialog('Insufficient Product', 'You do not have sufficient products for this sale.');
        }
        // Update the quantity of the product
        product.stock_quantity_wholesale -= quantity; 
    } else {
        if (quantity > product.stock_quantity_retail) {
            return window.electronAPI.errorDialog('Insufficient Product', 'You do not have sufficient products for this sale.');
        }
        // Update the quantity of the product
        product.stock_quantity_retail -= quantity;
    }

    const existingItem = cart.find(item => item.product_id === productId && item.customerName === customerName && item.purchaseType === purchaseType);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity, customerName, customerId, purchaseType });
    }

    console.log(cart);
    
    updateCart();
}

function updateCart() {
    cartBody.innerHTML = "";
    let totalPrice = 0;

    cart.forEach((item, index) => {
        // Populate the table based on the purchaseType
        if (item.purchaseType == 'Wholesale') {
            let total = item.wholesale_price * item.quantity;
            totalPrice += total;

            let row = `
            <tr>
                <td>${index + 1}</td>
                <td>Test Date</td>
                <td>${item.product_name}</td>
                <td>${item.purchaseType}</td>
                <td>₦${item.wholesale_price}</td>
                <td>${item.quantity}</td>
                <td>₦${total}</td>
                <td><a class="btn btn-sm btn-primary remove-button" id="${index}-${item.product_id}-${item.purchaseType}">Delete</a></td>
            </tr>`;
            cartBody.innerHTML += row;
        } else {
            let total = item.retail_price * item.quantity;
            totalPrice += total;

            let row = `
            <tr>
                <td>${index + 1}</td>
                <td>Test Date</td>
                <td>${item.product_name}</td>
                <td>${item.purchaseType}</td>
                <td>₦${item.retail_price}</td>
                <td>${item.quantity}</td>
                <td>₦${total}</td>
                <td><a class="btn btn-sm btn-primary remove-button" id="${index}-${item.product_id}-${item.purchaseType}">Delete</a></td>
            </tr>`;
            cartBody.innerHTML += row;
        }
    });

    document.getElementById("totalPrice").innerText = totalPrice.toFixed(2);
}


function removeFromCart(index, id, purchaseType) {

    if (purchaseType == 'Wholesale') {
        let productIndex = productList.findIndex(p => p.product_id == id);
        let productFromCart = cart.find((p) => p.product_id == id && p.purchaseType === purchaseType);

        console.log(id, purchaseType, productIndex, productFromCart);
        
        productList[productIndex].stock_quantity_wholesale += productFromCart.quantity;
    } else {
        let productIndex = productList.findIndex(p => p.product_id == id);
        let productFromCart = cart.find((p) => p.product_id == id && p.purchaseType === purchaseType);

        console.log(id, purchaseType, productIndex, productFromCart);

        productList[productIndex].stock_quantity_retail += productFromCart.quantity;
    }
    

    cart.splice(index, 1);

    updateCart();
}

async function processSale() {
    if (cart.length === 0) return window.electronAPI.warningDialog('Empty Cart', 'Cart is empty. Add products first!');

    let confirm = window.confirm('Are you sure you wanna process this sale?');
    if (confirm == true) {
        // Insert into the sales table
        const newSale = await window.sqlite.storeManager?.insertNewSale(cart[0].customerId, document.getElementById("totalPrice").innerText, 'cash');

        // Check if there was an error while executing the query
        if (window.functions.handleDBError(newSale.code)) {
            console.log('Error while executing db query: ', newSale.code, newSale.message);

            window.electronAPI.errorDialog('Server Error', 'An Error occured!');
            return;
        }

        cart.forEach(async item => {
            // Add new sale item based on the purchaseType
            if (item.purchaseType == 'Wholesale') {
                const newSaleItem = await window.sqlite.storeManager?.insertNewSaleItem(newSale.lastInsertRowid, item.product_id, item.quantity, item.wholesale_price, item.purchaseType, item.wholesale_price * item.quantity);

                if (window.functions.handleDBError(newSaleItem.code)) {
                    console.log('Error while executing db query: ', newSaleItem.code, newSaleItem.message);
            
                    window.electronAPI.errorDialog('Server Error', 'An Error occured!');
                    return;
                }

                // Update the stock quantity of the purchased products
                window.sqlite.storeManager?.updateWholesaleStockQuantity(item.quantity, item.product_id);
            } else {
                const newSaleItem = await window.sqlite.storeManager?.insertNewSaleItem(newSale.lastInsertRowid, item.product_id, item.quantity, item.retail_price, item.purchaseType, item.retail_price * item.quantity);

                if (window.functions.handleDBError(newSaleItem.code)) {
                    console.log('Error while executing db query: ', newSaleItem.code, newSaleItem.message);
            
                    window.electronAPI.errorDialog('Server Error', 'An Error occured!');
                    return;
                }

                // Update the stock quantity of the purchased products
                window.sqlite.storeManager?.updateRetailStockQuantity(item.quantity, item.product_id);
            }

            
        });

        console.log("Sale Recorded:", cart);
        alert("Sale recorded successfully!");
        
        cart = [];
        updateCart();

        // Display invoice
        viewSaleInvoice(newSale.lastInsertRowid);

        closeSale();        
    } else {
        return;
    }
}

function closeSale() {
    /* Load the customers and the products
        incase of any update */
        load_customers_products();
        
        // Clear the cart
        cart = [];

        // Clear the cart table
        cartBody.innerHTML = "";
        
        // Disable the customers select
        document.getElementById("role").disabled = false;
        // Set the value of the Customers back to default
        document.getElementById("role").value = "";

        // Disable the closeSaleBtn
        document.getElementById("closeSaleBtn").disabled = true;
        document.getElementById("closeSaleBtn").style.display = 'none';
}
// Extra function to load products/customers
async function load_customers_products() {
    productList = await window.sqlite.storeManager?.allProducts();
    customers = await window.sqlite.storeManager?.getCustomers();

    console.log(productList, customers);
}
// Enable the inputs once a customer is selected
document.getElementById("role").addEventListener('change', () => {
    if (document.getElementById("role").value !== '') {
        // Disable the customers select
        document.getElementById("role").disabled = true;

        // Enable the closeSaleBtn, product select, quantity and purchaseType input
        document.getElementById("closeSaleBtn").disabled = false;
        document.getElementById("closeSaleBtn").style.display = 'block';
    }
});

// Function to close sale
document.getElementById('closeSaleBtn').addEventListener('click', () => {
    var confirm = window.confirm('Are you sure you wanna close sale?');
    
    if (confirm == true) {
        closeSale();
    } else {
        return;
    }
    
});


addCartBtn.addEventListener('click', addToCart);
processSaleBtn.addEventListener('click', processSale);

/* Event Delegation */
// Attach a single event listener to the parent
cartBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-button')) {
        let targetDetails = event.target.id;

        let split = targetDetails.split('-');

        event.target.addEventListener('click', removeFromCart(split[0], split[1], split[2]));
    }
});

async function viewSaleInvoice(saleId) {
    // Display the modal
    invoiceModal.show();
    
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


window.electronStore.getProtectedData().then((result) => {
    console.log(result);
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
  
  // Handle product syncing
let retryInterval = null;

function tryFetchPendingStocking() {
    if (!navigator.onLine) {
        console.log("Offline — will retry...");
        return;
    }

    // Send a fetch request to the webApi
    fetch('https://web.marybillconglomerate.com.ng/storeApi/pendingStocking?branchId=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error("Server error");
            return response.json();
        })
        .then(data => {
            console.log(data);

            // Stop retries after success
            clearInterval(retryInterval);

            if (!data.pendingStock) {
                console.log('There are no pending stocks');
                return;
            }

            data.pendingStock.forEach(async stock => {
                console.log(stock.product_name);

                // Check if the stock sent already exists in the database
                const checkStock = await window.sqlite.storeManager?.checkTheStock(stock.product_name);
                console.log(checkStock);

                if (checkStock.length > 0) {
                    console.log('Product already exist');

                    console.log('stock details: ', checkStock[0].product_id, stock.stock_quantity_wholesale, stock.stock_quantity_retail, typeof stock.stock_quantity_wholesale);
                    
                    // Update the product database
                    const updateProduct = await window.sqlite.storeManager?.updatestockQuantity(checkStock[0].product_id, stock.stock_quantity_wholesale, stock.stock_quantity_retail);

                    console.log(updateProduct);

                } else {
                    // Insert the product into the database
                    const insertProducts = await window.sqlite.storeManager?.stockBranch(stock.product_name, stock.wholesale_price, stock.retail_price, stock.stock_quantity_wholesale, stock.stock_quantity_retail, stock.supplier_id, stock.category);

                    console.log(insertProducts);
                }
            });
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

retryInterval = setInterval(tryFetchPendingStocking, 10000);