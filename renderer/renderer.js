const signinForm = document.getElementById('signinForm');

signinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        username: e.target.username.value,
        password: e.target.password.value,
        role: e.target.role.value,
    };

    console.log(data);

    window.electronStore.login(data.username, data.password, data.role).then((result) => {
        console.log(result);

        if (result.success === false) {
            return window.electronAPI.errorDialog('Invalid credentials', result.message);
        }

        window.electronStore.getProtectedData().then((result) => {
            // redirect the user based on the user's role
            if (result.decoded.role == 'salesRep') {
                // Redirect the user
                window.pageRedirect.redirect('./pages/new sale.html');
            } else {
                // Redirect the user
                window.pageRedirect.redirect('./pages/admin dashboard.html');
            }
        });
    });
});

// document.getElementById('setBTN').addEventListener('click', () => {
//     window.electronStore.manualSet().then((result) => {
//         console.log(result);
//     });
// });

// document.getElementById('testBTN').addEventListener('click', () => {
//     window.electronStore.getProtectedData().then((result) => {
//         console.log(result);

//         window.pageRedirect.redirect('./pages/index.html');
//     });
// });


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



setTimeout(() => {
    const sales = window.sqlite.storeManager?.getSalesForSyncing();
    const sales2 = window.sqlite.storeManager?.getSalesForSyncing2();
    console.log(sales);
    
    const data = {
        sales: sales,
        saleItems: sales2
    }
    // Send a fetch request to the webApi
    fetch('https://web.marybillconglomerate.com.ng/storeApi/sync-sales-from-branches?branchId=1', {
    // fetch('localhost:3000/storeApi/sync-sales-from-branches?branchId=1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) return response.json();
            return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}, 5000);