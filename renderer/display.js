document.addEventListener('DOMContentLoaded', async () => {
    const sales = await window.sqlite.storeManager?.getSales();

    document.getElementById('myUl').innerHTML = sales.map(el => `${el.name}`);

    for (let i = 0; i < sales.length; i++) {
        console.log(sales[i]);   
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