var customersList;

document.addEventListener('DOMContentLoaded', async () => {
    // customersList = await window.sqlite.storeManager?.getCustomers();
    customersList = await window.sqlite.storeManager('getCustomers');
    console.log(customersList);
   
    loadCustomers();
});

function loadCustomers() {
    const customersHolder = document.getElementById('customersHolder');
    customersHolder.innerHTML = '';
    
    customersList.map(customer => {
        let newDiv = document.createElement('div');
        newDiv.innerHTML = `<div class="d-flex align-items-center border-bottom py-3">
                <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/user-01.jpg" alt="">
                <div class="w-100 ms-3">
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-0">${customer.name}</h6>
                    <span>27th August <i class="fa fa-arrow"></i><a href="#" class="ms-3" data-bs-toggle="modal"
                        data-bs-target="#myModal">Edit</a>
                      <button class="btn btn-primary btn-sm ms-3" data-bs-toggle="modal"
                        data-bs-target="#customerModal">All sales</button>
                    </span>
                  </div>
                  <span>Nigeria</span>
                </div>
              </div>`

              customersHolder.appendChild(newDiv);
    });
}

const addCustomerForm = document.getElementById('addCustomerForm');

addCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let data = {
        name: e.target.name.value,
        address: e.target.address.value,
        contact: e.target.contact.value,
    }

    console.log(data);

    // Insert the details 
    const addNewCustomer = window.sqlite.storeManager('addCustomer', data.name, data.address, data.contact);
    console.log(addNewCustomer);
    
    if (window.functions.handleDBError(addNewCustomer.code)) {
        console.log('Error while executing db query: ', addNewCustomer.code, addNewCustomer.message);

        window.electronAPI.errorDialog('Server Error', 'An Error occured!');
        return;
    }

    alert('Successfully added customer!');

    customersList = await window.sqlite.storeManager('getCustomers');
    loadCustomers();
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
                const checkStock = await window.sqlite.storeManager('checkTheStock', stock.product_name);
                console.log(checkStock);

                if (checkStock.length > 0) {
                    console.log('Product already exist');

                    console.log('stock details: ', checkStock[0].product_id, stock.stock_quantity_wholesale, stock.stock_quantity_retail, typeof stock.stock_quantity_wholesale);
                    
                    // Update the product database
                    const updateProduct = await window.sqlite.storeManager('updatestockQuantity', checkStock[0].product_id, stock.stock_quantity_wholesale, stock.stock_quantity_retail);

                    console.log(updateProduct);

                } else {
                    // Insert the product into the database
                    const insertProducts = await window.sqlite.storeManager('stockBranch', stock.product_name, stock.wholesale_price, stock.retail_price, stock.stock_quantity_wholesale, stock.stock_quantity_retail, stock.supplier_id, stock.category);

                    console.log(insertProducts);
                }
            });
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

retryInterval = setInterval(tryFetchPendingStocking, 10000);