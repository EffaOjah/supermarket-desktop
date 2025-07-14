// let retryIntervalOne = null;

// async function tryFetchProducts() {
//   if (!navigator.onLine) {
//     console.log("Offline — will retry...");
//     return;
//   }

//   // Get last synced
//   const lastSyncedDate = await window.sqlite.storeManager("getLastSynced");
//   console.log(lastSyncedDate);

//   // Fetch data from Electron (main process)
//   const data = await window.electronAPI.syncProducts(
//     lastSyncedDate[0].lastSyncedDate
//   );

//   if (data?.error) {
//     console.error("Failed to fetch:", data.message);
//     return;
//   }

//   console.log(data);

//   clearInterval(retryIntervalOne);

//   if (!data.products) {
//     console.log("There are no pending stocks");
//     return;
//   }

//   for (const product of data.products) {
//     console.log(product.product_name, product.product_id);

//     const checkStock = await window.sqlite.storeManager(
//       "checkTheStock",
//       product.product_id
//     );
//     console.log(checkStock);

//     if (checkStock.length > 0) {
//       console.log("Product already exists");
//       const updateProduct = await window.sqlite.storeManager(
//         "updateProduct",
//         checkStock[0].product_id,
//         product.product_name,
//         product.wholesale_price,
//         product.retail_price,
//         product.category
//       );
//       console.log(updateProduct);
//     } else {
//       const insertProducts = await window.sqlite.storeManager(
//         "addProduct",
//         product.product_id,
//         product.product_name,
//         product.wholesale_price,
//         product.retail_price,
//         product.supplier_id,
//         product.category
//       );
//       console.log(insertProducts);
//     }
//   }
// }

// // Try every 8 seconds
// retryIntervalOne = setInterval(tryFetchProducts, 8000);

let retryInterval = null;

async function tryFetchPendingStocking() {
  if (!navigator.onLine) {
    console.log("Offline — will retry...");
    return;
  }

  // Fetch data from Electron (main process)
  const data = await window.electronAPI.stockProducts();

  if (data?.error) {
    console.error("Failed to fetch:", data.message);
    return;
  }

  clearInterval(retryInterval);

  if (!data.pendingStock) {
    console.log("There are no pending stocks");
    return;
  }

  console.log(data);

  for (const stock of data.pendingStock) {
    console.log(stock.product_name, stock.product_id);

    const checkStock = await window.sqlite.storeManager(
      "checkTheStock",
      stock.product_id
    );
    console.log(checkStock);

    if (checkStock.length > 0) {
      console.log("Product already exists");
      const updateProduct = await window.sqlite.storeManager(
        "updatestockQuantity",
        checkStock[0].product_id,
        stock.stock_quantity_wholesale,
        stock.stock_quantity_retail
      );
      console.log(updateProduct);
    } else {
      const insertProducts = await window.sqlite.storeManager(
        "stockBranch",
        stock.product_id,
        stock.product_name,
        stock.wholesale_cost_price,
        stock.wholesale_selling_price,
        stock.retail_cost_price,
        stock.retail_selling_price,
        stock.stock_quantity_wholesale,
        stock.stock_quantity_retail,
        stock.supplier_id,
        stock.category
      );
      console.log(insertProducts);
    }
  }
}

// Try every 10 seconds
retryInterval = setInterval(tryFetchPendingStocking, 10000);

// Operation to sync sales
setTimeout(async () => {
  const sales = await window.sqlite.storeManager("getSalesForSyncing");
  const sales2 = await window.sqlite.storeManager("getSalesForSyncing2");

  const data = {
    sales,
    saleItems: sales2,
  };

  console.log("Sales data to sync:", data);

  const response = await window.electronAPI.syncSales(data);

  if (response?.error) {
    console.error("Sync failed:", response.message);
    return;
  }

  console.log("Sync response:", response);

  const updateSyncedColumn = await window.sqlite.storeManager(
    "updateSyncedColumn"
  );
  console.log("Synced column updated:", updateSyncedColumn);
}, 5000);

// Function to get all products
async function getProducts() {
  const response = await window.electronAPI.getAllProducts();
  console.log("All products: ", response);

  if (response?.error) {
    console.error("Sync failed:", response.message);
    return;
  }

  for (const product of response.products) {
    console.log(product.product_name, product.product_id);

    const checkStock = await window.sqlite.storeManager(
      "checkTheStock",
      product.product_id
    );
    console.log(checkStock);

    if (checkStock.length > 0) {
      console.log("Product already exists");
      const updateProduct = await window.sqlite.storeManager(
        "updateProduct",
        checkStock[0].product_id,
        product.product_name,
        product.wholesale_cost_price,
        product.wholesale_selling_price,
        product.retail_cost_price,
        product.retail_selling_price,
        product.category
      );
      console.log(updateProduct);
    } else {
      console.log("This product did not exist: ", checkStock);

      const insertProducts = await window.sqlite.storeManager(
        "addProduct",
        product.product_id,
        product.product_name,
        product.wholesale_cost_price,
        product.wholesale_selling_price,
        product.retail_cost_price,
        product.retail_selling_price,
        product.supplier_id,
        product.category
      );
      console.log(insertProducts);
    }
  }
}

getProducts();
