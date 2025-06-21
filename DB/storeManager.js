import { db } from './dbConfig.js';

import { v4 as uuidv4 } from "uuid";

// Database operations
const storeManager = {
  getUsers: (role) => {
    try {
      const getUsersQuery = db.prepare(`SELECT * FROM Users WHERE role = ?`);
      const users = getUsersQuery.all(role);

      return users;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getCustomers: () => {
    try {
      const getCustomersQuery = db.prepare(`SELECT * FROM Customers`);
      const customers = getCustomersQuery.all();

      return customers;
    } catch (error) {
      console.error(error);
      return error.message;
    }
  },
  insertNewSale: (customerId, totalAmount, paymentMethod) => {
    const padZero = (num) => num.toString().padStart(2, "0");
    const date = new Date();

    let customTimestamp = `${date.getFullYear()}-${padZero(
      date.getMonth()
    )}-${padZero(date.getDay())}`;

    const id = uuidv4();
    try {
      const insertSaleQuery = db.prepare(
        "INSERT INTO Sales (sale_id, customer_id, sales_date, total_amount, payment_method) VALUES (?, ?, ?, ?, ?)"
      );
      const result = insertSaleQuery.run(
        id,
        customerId,
        customTimestamp,
        totalAmount,
        paymentMethod
      );

      return { lastInsertRowid: id };
    } catch (error) {
      return error;
    }
  },
  insertNewSaleItem: (
    saleId,
    productId,
    quantity,
    unitPrice,
    saleType,
    subTotal
  ) => {
    try {
      const insertSaleItemQuery = db.prepare(
        "INSERT INTO Sales_items (sale_item_id, sale_id, product_id, quantity, unit_price, sale_type, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      const result = insertSaleItemQuery.run(
        uuidv4(),
        saleId,
        productId,
        quantity,
        unitPrice,
        saleType,
        subTotal
      );

      return result;
    } catch (error) {
      return error;
    }
  },
  updateWholesaleStockQuantity: (purchasedQuantity, productId) => {
    try {
      const updateQuery = db.prepare(
        `UPDATE Products SET stock_quantity_wholesale = stock_quantity_wholesale - ? WHERE product_id = ?`
      );
      const result = updateQuery.run(purchasedQuantity, productId);

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  updateRetailStockQuantity: (purchasedQuantity, productId) => {
    try {
      const updateQuery = db.prepare(
        `UPDATE Products SET stock_quantity_retail = stock_quantity_retail - ? WHERE product_id = ?`
      );
      const result = updateQuery.run(purchasedQuantity, productId);

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  checkUser: (username, password, role) => {
    try {
      const checkQuery = db.prepare(
        `SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?`
      );
      const result = checkQuery.all(username, password, role);

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  allProducts: async () => {
    try {
      const getProductQuery = db.prepare(
        `SELECT * from products INNER JOIN suppliers ON products.supplier_id = suppliers.supplier_id`
      );
      const products = getProductQuery.all();

      return products;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  products: async () => {
    try {
      const getProductQuery = db.prepare(
        `SELECT * from products GROUP BY category`
      );
      const products = getProductQuery.all();

      return products;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSuppliers: () => {
    try {
      const getSuppliersQuery = db.prepare(`SELECT * FROM Suppliers`);
      const result = getSuppliersQuery.all();

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  addSupplier: (name, address, contact, email) => {
    try {
      const addSupplierQuery = db.prepare(
        `INSERT INTO Suppliers (supplier_id, name, address, contact, email) VALUES (?, ?, ?, ?, ?)`
      );
      const result = addSupplierQuery.run(
        uuidv4(),
        name,
        address,
        contact,
        email
      );

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  addCustomer: (name, address, contact) => {
    try {
      const addCustomerQuery = db.prepare(
        `INSERT INTO Customers (customer_id, name, address, contact) VALUES (?, ?, ?, ?)`
      );
      const result = addCustomerQuery.run(uuidv4(), name, address, contact);

      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSales: () => {
    try {
      const getSalesQuery = db.prepare(
        "SELECT * FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id"
      );
      const sales = getSalesQuery.all();

      return sales;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSalesForSyncing: () => {
    try {
      const getSalesQuery = db.prepare(
        "SELECT sale_id, name, contact, total_amount, payment_method, sales_date FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0"
      );
      const sales = getSalesQuery.all();

      return sales;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSalesForSyncing2: () => {
    try {
      const getSalesQuery = db.prepare(
        "SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0"
      );
      const sales = getSalesQuery.all();

      return sales;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSaleItems: (saleId) => {
    try {
      const getSalesQuery = db.prepare(
        "SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?"
      );
      const sales = getSalesQuery.all(saleId);

      return sales;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  supplierProducts: async (supplierId) => {
    try {
      const getProductQuery = db.prepare(
        `SELECT product_name from products WHERE supplier_id = ?`
      );
      const products = getProductQuery.all(supplierId);

      return products;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  productDetails: async (productId) => {
    try {
      const getProductDetailQuery = db.prepare(
        `SELECT * from products WHERE product_id = ?`
      );
      const productDetail = getProductDetailQuery.all(productId);

      return productDetail;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  productSales: async (productId) => {
    try {
      const getProductDetailQuery = db.prepare(
        `SELECT * from Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN products ON Sales_items.product_id = Products.product_id WHERE Sales_items.product_id = ?`
      );
      const productDetail = getProductDetailQuery.all(productId);

      return productDetail;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getSaleItemsByProductId: (saleId) => {
    try {
      const getSalesQuery = db.prepare(
        "SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?"
      );
      const sales = getSalesQuery.all(saleId);

      return sales;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  checkTheStock: (productId) => {
    try {
      const checkStock = db.prepare(
        "SELECT * FROM products WHERE product_id = ?"
      );
      const stock = checkStock.all(productId);

      return stock;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  stockBranch: (
    productId,
    productName,
    wholesalePrice,
    retailPrice,
    stockQuantityWholesale,
    stockQuantityRetail,
    supplierId,
    category
  ) => {
    try {
      const insertProductQuery = db.prepare(
        "INSERT INTO products (product_id, product_name, wholesale_price, retail_price, stock_quantity_wholesale, stock_quantity_retail, supplier_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );

      const insertProduct = insertProductQuery.run(
        productId,
        productName,
        wholesalePrice,
        retailPrice,
        stockQuantityWholesale,
        stockQuantityRetail,
        supplierId,
        category
      );

      return insertProduct;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  addProduct: (
    productId,
    productName,
    wholesalePrice,
    retailPrice,
    supplierId,
    category
  ) => {
    try {
      const insertProductQuery = db.prepare(
        "INSERT INTO products (product_id, product_name, wholesale_price, retail_price, stock_quantity_wholesale, stock_quantity_retail, supplier_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );

      const insertProduct = insertProductQuery.run(
        productId,
        productName,
        wholesalePrice,
        retailPrice,
        0,
        0,
        supplierId,
        category
      );

      return insertProduct;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  updateLastSyncedDate: (date) => {
    try {
      const updateQuery = db.prepare("UPDATE Settings SET lastSyncedDate = ?");

      const updateColumn = updateQuery.run(date);

      return updateColumn;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  updatestockQuantity: (
    productId,
    stockQuantityWholesale,
    stockQuantityRetail
  ) => {
    try {
      const updateProductQuery = db.prepare(
        "UPDATE products SET stock_quantity_wholesale = ?, stock_quantity_retail = ? WHERE product_id = ?"
      );

      const updateProduct = updateProductQuery.run(
        stockQuantityWholesale,
        stockQuantityRetail,
        productId
      );

      return updateProduct;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  updateProduct: (
    productId,
    productName,
    wholesalePrice,
    retailPrice,
    category
  ) => {
    try {
      const updateProductQuery = db.prepare(
        "UPDATE products SET product_name = ?, wholesale_price = ?, retail_price = ?, category =?  WHERE product_id = ?"
      );

      const updateProduct = updateProductQuery.run(
        productName,
        wholesalePrice,
        retailPrice,
        category,
        productId
      );

      return updateProduct;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  updateSyncedColumn: () => {
    try {
      const updateColumnQuery = db.prepare(
        "UPDATE Sales SET synced = ? WHERE synced = ?"
      );

      const updateSyncedColumn = updateColumnQuery.run(1, 0);

      return updateSyncedColumn;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  getLastSynced: () => {
    try {
      const getQuery = db.prepare("SELECT * FROM Settings");

      const getlastSynced = getQuery.all();

      return getlastSynced;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
};


export default storeManager;