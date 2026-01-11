/**
 * SyncService - Managed background synchronization for Marybill Conglomerate SPA
 */
(function () {
  'use strict';

  window.SyncService = {
    branchId: null,
    intervals: {
      stocking: null,
      sales: null
    },
    isRunning: false,

    /**
     * Initialize the sync service
     */
    async init() {
      if (this.isRunning) return;

      console.log("Initializing SyncService...");

      try {
        // Fetch branch details to get branchId
        const details = await window.electronAPI.getSoftwareDetails();
        if (details && details.branchId) {
          this.branchId = details.branchId;
          console.log("SyncService: Branch activated. Ready to sync.");
        } else {
          console.warn("SyncService: Branch not activated. Syncing will be skipped.");
        }

        this.isRunning = true;

        // Start background intervals
        this.startBackgroundTasks();

        // Run initial sync
        await this.syncAll();

      } catch (error) {
        console.error("SyncService Initialization Error:", error);
      }
    },

    /**
     * Trigger an immediate sync of all items
     * Useful for page transitions to ensure fresh data
     */
    async syncAll() {
      if (!this.branchId) {
        // Refresh branch ID in case the user just activated
        const details = await window.electronAPI.getSoftwareDetails();
        if (details && details.branchId) {
          this.branchId = details.branchId;
        } else {
          return; // Still no branch ID, skip
        }
      }

      console.log("SyncService: Triggering immediate sync...");
      await Promise.allSettled([
        this.getProducts(),
        this.tryFetchPendingStocking(),
        this.syncSales()
      ]);
    },

    /**
     * Set up background intervals
     */
    startBackgroundTasks() {
      // Clear existing if any
      if (this.intervals.stocking) clearInterval(this.intervals.stocking);
      if (this.intervals.sales) clearInterval(this.intervals.sales);

      // Try fetch stocking every 10 seconds
      this.intervals.stocking = setInterval(() => this.tryFetchPendingStocking(), 10000);

      // Sync sales every 5 minutes
      this.intervals.sales = setInterval(() => this.syncSales(), 300000);
    },

    /**
     * Fetch current products from server
     */
    async getProducts() {
      if (!navigator.onLine) return;

      console.log("SyncService: Syncing products...");
      const response = await window.electronAPI.getAllProducts();

      if (response?.error || !response?.products) {
        console.error("SyncService: Product sync failed", response?.message);
        return;
      }

      for (const product of response.products) {
        const checkStock = await window.sqlite.storeManager("checkTheStock", product.product_id);

        if (checkStock.length > 0) {
          await window.sqlite.storeManager(
            "updateProduct",
            checkStock[0].product_id,
            product.product_name,
            product.wholesale_cost_price,
            product.wholesale_selling_price,
            product.retail_cost_price,
            product.retail_selling_price,
            product.category
          );
        } else {
          await window.sqlite.storeManager(
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
        }
      }
    },

    /**
     * Fetch pending stockings for the branch
     */
    async tryFetchPendingStocking() {
      if (!navigator.onLine || !this.branchId) return;

      const timeStamp = new Date().toISOString();
      const data = await window.electronAPI.stockProducts();

      if (data?.error || !data.pendingStock || data.pendingStock.length === 0) {
        return;
      }

      console.log("SyncService: Found pending stockings:", data.pendingStock.length);

      // Insert into the Stocking table
      const newStocking = await window.sqlite.storeManager("insertNewStocking", timeStamp, data.pendingStock.length);

      for (const stock of data.pendingStock) {
        const checkStock = await window.sqlite.storeManager("checkTheStock", stock.product_id);

        if (checkStock.length > 0) {
          await window.sqlite.storeManager(
            "updatestockQuantity",
            checkStock[0].product_id,
            stock.stock_quantity_wholesale,
            stock.stock_quantity_retail
          );
        } else {
          await window.sqlite.storeManager(
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
        }

        // Insert the stock item
        await window.sqlite.storeManager(
          "insertNewStockItem",
          newStocking.lastInsertRowid,
          stock.product_id,
          stock.stock_quantity_wholesale,
          stock.stock_quantity_retail
        );
      }

      // Send notification
      new Notification("Marybill Conglomerate!", {
        body: `${data.pendingStock.length} products have been stocked.`,
        icon: "../resources/app-icon.jpg"
      });
    },

    /**
     * Sync local sales to the server
     */
    async syncSales() {
      if (!navigator.onLine || !this.branchId) return;

      console.log("SyncService: Syncing sales to server...");
      const sales = await window.sqlite.storeManager("getSalesForSyncing");
      const sales2 = await window.sqlite.storeManager("getSalesForSyncing2");

      if (sales.length === 0) return;

      const data = { sales, saleItems: sales2 };
      const response = await window.electronAPI.syncSales(data);

      if (!response?.error) {
        await window.sqlite.storeManager("updateSyncedColumn");
        console.log("SyncService: Sales synced successfully.");
      } else {
        console.error("SyncService: Sales sync failed", response.message);
      }
    }
  };
})();
