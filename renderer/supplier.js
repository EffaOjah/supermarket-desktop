var suppliersList;

// Get all suppliers
document.addEventListener('DOMContentLoaded', async () => {
    suppliersList = await window.sqlite.storeManager?.getSuppliers();
    console.log(suppliersList);
    
    loadSuppliers();
});

function loadSuppliers() {
    const newTbody = document.createElement('tbody');
    newTbody.innerHTML = `
        ${suppliersList.map((supplier, index) => `
            <tr>
                          <td><input class="form-check-input" type="checkbox"></td>
                          <td>${supplier.name}</td>
                          <td>${!supplier.address ? 'N/A' : supplier.address}</td>
                          <td>${!supplier.contact ? 'N/A' : supplier.contact}</td>
                          <td>${!supplier.email ? 'N/A' : supplier.email}</td>
                          <td><a id="${index + 1}" class="btn btn-sm w-100 btn-primary bg-btn view-products-btn" href="#" data-bs-toggle="modal"
                              data-bs-target="#productsSuppliedModal">View products</a></td>
                          <td><a class="btn btn-sm w-50 w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
                              data-bs-target="#companyModal">About</a></td>
                        </tr>
        `).join('')}
    `

        document.getElementById('suppliersTable').append(newTbody);




    // suppliersList.map(supplier => {
    //     const tr = document.createElement('tr');
    //     tr.innerHTML = `
    //                   <td><input class="form-check-input" type="checkbox"></td>
    //                   <td>${supplier.name}</td>
    //                   <td>${supplier.address}</td>
    //                   <td>${supplier.contact}</td>
    //                   <td>${supplier.email}</td>
    //                   <td><a class="btn btn-sm w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
    //                       data-bs-target="#companyModal">View products</a></td>
    //                   <td><a class="btn btn-sm w-50 w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
    //                       data-bs-target="#companyModal">About</a></td>
    //                 `

    //                 suppliersTable.append(tr);
    // });
}


const addSupplierForm = document.getElementById('addSupplierForm');

addSupplierForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let data = {
        name: e.target.name.value,
        address: e.target.address.value,
        contact: e.target.contact.value,
        email: e.target.email.value,
    }

    console.log(data);

    // Insert the details 
    const addNewSupplier = window.sqlite.storeManager?.addSupplier(data.name, data.address, data.contact, data.email);
    console.log(addNewSupplier);
    
    if (window.functions.handleDBError(addNewSupplier.code)) {
        console.log('Error while executing db query: ', addNewSupplier.code, addNewSupplier.message);

        window.electronAPI.errorDialog('Server Error', 'An Error occured!');
        return;
    }

    alert('Successfully added supplier!');

    suppliersList = await window.sqlite.storeManager?.getSuppliers();
    loadSuppliers();
});

// Get products by a supplier
async function loadSupplierProducts(supplierId) {
    const products = await window.sqlite.storeManager?.supplierProducts(supplierId);

    const holder2 = document.getElementById('holder2');
    
    // Check if there are products supplied
    if (products.length < 1) {
        holder2.innerHTML = '<p class="text-secondary">No Products Supplied</p>';
    } else {
        holder2.innerHTML = `
        <ol>
        ${products.map((product, index) => `
            <li class="text-secondary">${product.product_name}</li>
        `).join('')}
                </ol>
        `
    }
}

/* Event Delegation */
// Attach a single event listener to the parent
document.getElementById('suppliersTable').addEventListener('click', (event) => {
    if (event.target.classList.contains('view-products-btn')) {
        loadSupplierProducts(event.target.id)
    }
});


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