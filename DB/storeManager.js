import { db } from './dbConfig.js';

// Require custom date module
// const date = require('../modules/dateModule.js');

// Get users
const getUsers = (role) => {
    try {
        const getUsersQuery = db.prepare(`SELECT * FROM Users WHERE role = ?`);
        const users = getUsersQuery.all(role);

        return users;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get customers
const getCustomers = () => {
    try {
        const getCustomersQuery = db.prepare(`SELECT * FROM Customers`);
        const customers = getCustomersQuery.all();

        return customers;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Insert new sale
const insertNewSale = (customerId, totalAmount, paymentMethod) => {
    const padZero = (num) => num.toString().padStart(2, '0');
    const date = new Date();

    let customTimestamp = `${date.getFullYear()}-${padZero(date.getMonth())}-${padZero(date.getDay())}`;

    try {
        const insertSaleQuery = db.prepare('INSERT INTO Sales (customer_id, sales_date, total_amount, payment_method) VALUES (?, ?, ?, ?)');
        const result = insertSaleQuery.run(customerId, customTimestamp, totalAmount, paymentMethod);

        return result;
    } catch (error) {
        return error;
    }
}

// Insert new sale item
const insertNewSaleItem = (saleId, productId, quantity, unitPrice, saleType, subTotal) => {
    try {
        const insertSaleItemQuery = db.prepare('INSERT INTO Sales_items (sale_id, product_id, quantity, unit_price, sale_type, subtotal) VALUES (?, ?, ?, ?, ?, ?)');
        const result = insertSaleItemQuery.run(saleId, productId, quantity, unitPrice, saleType, subTotal);

        return result;
    } catch (error) {
        return error;
    }
}

// Update the wholesale stock quantity
const updateWholesaleStockQuantity = (purchasedQuantity, productId) => {
    try {
        const updateQuery = db.prepare(`UPDATE Products SET stock_quantity_wholesale = stock_quantity_wholesale - ? WHERE product_id = ?`);
        const result = updateQuery.run(purchasedQuantity, productId);

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Update the wholesale stock quantity
const updateRetailStockQuantity = (purchasedQuantity, productId) => {
    try {
        const updateQuery = db.prepare(`UPDATE Products SET stock_quantity_retail = stock_quantity_retail - ? WHERE product_id = ?`);
        const result = updateQuery.run(purchasedQuantity, productId);

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Check user
const checkUser = (username, password, role) => {
    try {
        const checkQuery = db.prepare(`SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?`);
        const result = checkQuery.all(username, password, role);

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get all products
const allProducts = async () => {
    try {
        const getProductQuery = db.prepare(`SELECT * from products`);
        const products = getProductQuery.all();

        return products;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get products by category
const products = async () => {
    try {
        const getProductQuery = db.prepare(`SELECT * from products GROUP BY category`);
        const products = getProductQuery.all();

        return products;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get suppliers
const getSuppliers = () => {
    try {
        const getSuppliersQuery = db.prepare(`SELECT * FROM Suppliers`);
        const result = getSuppliersQuery.all();

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Add new Supplier
const addSupplier = (name, address, contact, email) => {
    try {
        const addSupplierQuery = db.prepare(`INSERT INTO Suppliers (name, address, contact, email) VALUES (?, ?, ?, ?)`);
        const result = addSupplierQuery.run(name, address, contact, email);

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Add new Customer
const addCustomer = (name, address, contact) => {
    try {
        const addCustomerQuery = db.prepare(`INSERT INTO Customers (name, address, contact) VALUES (?, ?, ?)`);
        const result = addCustomerQuery.run(name, address, contact);

        return result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get sales
const getSales = () => {
    try {
        const getSalesQuery = db.prepare('SELECT * FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id');
        const sales = getSalesQuery.all();

        return sales;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get all sales
const getSalesForSyncing = () => {
    try {
        const getSalesQuery = db.prepare('SELECT name, contact, total_amount, payment_method, sales_date FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0');
        const sales = getSalesQuery.all();

        return sales;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get all sales
const getSalesForSyncing2 = () => {
    try {
        const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0');
        const sales = getSalesQuery.all();

        return sales;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get sale using sale_id
const getSaleItems = (saleId) => {
    try {
        const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?');
        const sales = getSalesQuery.all(saleId);

        return sales;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get products using supplier_id
const supplierProducts = async (supplierId) => {
    try {
        const getProductQuery = db.prepare(`SELECT product_name from products WHERE supplier_id = ?`);
        const products = getProductQuery.all(supplierId);

        return products;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Load product details
const productDetails = async (productId) => {
    try {
        const getProductDetailQuery = db.prepare(`SELECT * from products WHERE product_id = ?`);
        const productDetail = getProductDetailQuery.all(productId);

        return productDetail;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get all sales for a particular product
const productSales = async (productId) => {
    try {
        const getProductDetailQuery = db.prepare(`SELECT * from Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN products ON Sales_items.product_id = Products.product_id WHERE Sales_items.product_id = ?`);
        const productDetail = getProductDetailQuery.all(productId);

        return productDetail;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Get the sale that the specified product exists using the product_id
const getSaleItemsByProductId = (saleId) => {
    try {
        const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?');
        const sales = getSalesQuery.all(saleId);

        return sales;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Check if stock already exist
const checkTheStock = (productName) => {
    try {
        const checkStock = db.prepare('SELECT * FROM products WHERE product_name = ?');
        const stock = checkStock.all(productName);

        return stock;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Insert products gotten from the web api
const stockBranch = (productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category) => {
    try {
        const insertProductQuery = db.prepare('INSERT INTO products (product_name, wholesale_price, retail_price, stock_quantity_wholesale, stock_quantity_retail, supplier_id, category) VALUES (?, ?, ?, ?, ?, ?, ?)');

        const insertProduct = insertProductQuery.run(productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category);

        return insertProduct;
    } catch (error) {
        console.error(error);
        return error;
    }
}

// Update products quantity gotten from the web api
const updatestockQuantity = (productId, stockQuantityWholesale, stockQuantityRetail) => {
    try {
        const updateProductQuery = db.prepare('UPDATE products SET stock_quantity_wholesale = ?, stock_quantity_retail = ? WHERE product_id = ?');

        const updateProduct = updateProductQuery.run(stockQuantityWholesale, stockQuantityRetail, productId);

        return updateProduct;
    } catch (error) {
        console.error(error);
        return error;
    }
}

const storeManager = { allProducts, products, getUsers, getCustomers, insertNewSale, insertNewSaleItem, updateWholesaleStockQuantity, updateRetailStockQuantity, checkUser, getSuppliers, addSupplier, addCustomer, getSales, getSalesForSyncing, getSalesForSyncing2, getSaleItems, supplierProducts, productDetails, productSales, getSaleItemsByProductId, checkTheStock, stockBranch, updatestockQuantity };

export default storeManager;