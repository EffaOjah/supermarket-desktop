// main.js

import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import Store from 'electron-store';
// import storeManager from './DB/storeManager.js';
import myJwt from './jwt/jwt.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Writable path
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'store.db');
const defaultDbPath = path.join(process.resourcesPath, 'store.db'); // Comes from `extraResource`

// Only copy on first run
if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(defaultDbPath, dbPath);
}

const branchFilePath = path.join(userDataPath, 'file.json');
const defaultBranchFilePath = path.join(process.resourcesPath, 'file.json');

if (!fs.existsSync(branchFilePath)) {
    fs.copyFileSync(defaultBranchFilePath, branchFilePath);
}

// Open the DB from the user data directory
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Instantiate store
// const store = new Store();

// Get the system's app data path (safe for writes)
const storePath = path.join(userDataPath, 'config');

// Create store with custom path
const store = new Store({
    cwd: storePath, // <- where the config.json will be saved
});


Menu.setApplicationMenu(null);

const createWindow = () => {

    console.log('Path:', store.path);
    console.log('Before:', store.get('authToken'));

    store.set('authToken', '123405');

    console.log('After:', store.get('authToken'));


    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.mjs'),
            webSecurity: true,
        }
    });

    win.maximize();

    /* Check if software have been activated,
    before loading first page */

    fs.readFile(path.join(userDataPath, 'file.json'), (err, data) => {
        if (err) {
            throw err;
        } else {
            data = JSON.parse(data);
            console.log(data.branchId);

            if (data.branchId == null) {
                win.loadFile('./pages/activation-page.html');
            } else {
                win.loadFile('./pages/signin.html');
            }
        }
    })

    ipcMain.on('redirect', (event, page) => {
        const token = store.get('authToken');

        if (!token) {
            console.log('No Token provided');
            return win.loadFile('./pages/signin.html');
        }

        const verifyToken = myJwt.verifyToken(token);
        if (!verifyToken) {
            console.log('Invalid token');
            return win.loadFile('./pages/signin.html');
        }

        win.loadFile(page);
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.handle('activate-software', (event, activationKey, branchName) => {
    let data = {
        branchId: activationKey,
        branchName: branchName
    }

    data = JSON.stringify(data);

    fs.writeFile(path.join(userDataPath, 'file.json'), data, (err) => {
        if (err) {
            let error = { error: 'Error activating software' };
            return error;
        }
        console.log('Successfully activated software');
        let message = { message: 'Successfully activated software' };

        return message;
    });
});

ipcMain.handle('get-software-details', async () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(userDataPath, 'file.json'), 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                reject(err);
            } else {
                try {
                    const parsed = JSON.parse(data);
                    console.log(parsed);
                    resolve(parsed);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
});

ipcMain.handle('sync-products', async (lastSynced) => {
    try {
        const response = await fetch(`https://web.marybillconglomerate.com.ng/storeApi/get-products?lastSynced=${lastSynced}`);
        return await response.json();

    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
});

ipcMain.handle('stock-products', async () => {
    try {
        const result = await new Promise((resolve, reject) => {
            fs.readFile(path.join(userDataPath, 'file.json'), 'utf-8', (err, data) => {
                if (err) reject(err);
                else resolve(JSON.parse(data));
            });
        });

        const response = await fetch(`https://web.marybillconglomerate.com.ng/storeApi/pendingStocking?branchId=${result.branchId}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
});

ipcMain.handle('sync-sales', async (event, data) => {
    try {
        const fileContent = await fs.promises.readFile(path.join(userDataPath, 'file.json'), 'utf-8');
        const { branchId } = JSON.parse(fileContent);

        const response = await fetch(`https://web.marybillconglomerate.com.ng/storeApi/sync-sales-from-branches?branchId=${branchId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        return await response.json();
    } catch (error) {
        console.error('Sync sales fetch error:', error);
        return { error: true, message: error.message };
    }
});


ipcMain.handle('show-warning-dialog', (event, title, message) => {
    dialog.showMessageBox({
        type: "warning",
        title: title,
        message: message,
        buttons: ["OK"]
    });
});

ipcMain.handle('show-error-dialog', (event, title, message) => {
    dialog.showMessageBox({
        type: "error",
        title: title,
        message: message,
        buttons: ["OK"]
    });
});

ipcMain.handle('login', async (event, username, password, role) => {
    try {
        const checkUser = await storeManager.checkUser(username, password, role);
        console.log('CheckUser: ', checkUser);

        if (checkUser.length < 1) {
            console.log('Invalid Login Details');
            return { success: false, message: 'Invalid Login Details' };
        }

        const generateToken = myJwt.generateToken(checkUser[0].user_id, checkUser[0].role);
        console.log('generateToken: ', generateToken);

        store.set('authToken', generateToken);
        return { success: true, message: 'Login successful' };
    } catch (error) {
        return { success: false, message: error.message || "Login failed" };
    }
});

ipcMain.handle('verify-user', async () => {
    const token = store.get('authToken');

    if (!token) {
        console.log('No Token provided');
        return { success: false, message: "Not authenticated" };
    }

    const verifyToken = myJwt.verifyToken(token);
    console.log('Decoded: ', verifyToken);

    return { success: true, decoded: verifyToken };
});

ipcMain.handle("logout", () => {
    store.delete("authToken");
    return { success: true, message: "Logged out" };
});

ipcMain.on('print-image', (event, dataUrl) => {
    const printWindow = new BrowserWindow({ show: false });

    printWindow.loadURL(`data:text/html,
      <html>
        <body style="margin:0">
          <img src="${dataUrl}" style="width:100%;height:auto" />
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>`);

    printWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            printWindow.close();
        }, 1000);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


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
        const padZero = (num) => num.toString().padStart(2, '0');
        const date = new Date();

        let customTimestamp = `${date.getFullYear()}-${padZero(date.getMonth())}-${padZero(date.getDay())}`;

        const id = uuidv4();
        try {
            const insertSaleQuery = db.prepare('INSERT INTO Sales (sale_id, customer_id, sales_date, total_amount, payment_method) VALUES (?, ?, ?, ?, ?)');
            const result = insertSaleQuery.run(id, customerId, customTimestamp, totalAmount, paymentMethod);

            return { lastInsertRowid: id };
        } catch (error) {
            return error;
        }
    },
    insertNewSaleItem: (saleId, productId, quantity, unitPrice, saleType, subTotal) => {
        try {
            const insertSaleItemQuery = db.prepare('INSERT INTO Sales_items (sale_item_id, sale_id, product_id, quantity, unit_price, sale_type, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const result = insertSaleItemQuery.run(uuidv4(), saleId, productId, quantity, unitPrice, saleType, subTotal);

            return result;
        } catch (error) {
            return error;
        }
    },
    updateWholesaleStockQuantity: (purchasedQuantity, productId) => {
        try {
            const updateQuery = db.prepare(`UPDATE Products SET stock_quantity_wholesale = stock_quantity_wholesale - ? WHERE product_id = ?`);
            const result = updateQuery.run(purchasedQuantity, productId);

            return result;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    updateRetailStockQuantity: (purchasedQuantity, productId) => {
        try {
            const updateQuery = db.prepare(`UPDATE Products SET stock_quantity_retail = stock_quantity_retail - ? WHERE product_id = ?`);
            const result = updateQuery.run(purchasedQuantity, productId);

            return result;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    checkUser: (username, password, role) => {
        try {
            const checkQuery = db.prepare(`SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?`);
            const result = checkQuery.all(username, password, role);

            return result;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    allProducts: async () => {
        try {
            const getProductQuery = db.prepare(`SELECT * from products INNER JOIN suppliers ON products.supplier_id = suppliers.supplier_id`);
            const products = getProductQuery.all();

            return products;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    products: async () => {
        try {
            const getProductQuery = db.prepare(`SELECT * from products GROUP BY category`);
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
            const addSupplierQuery = db.prepare(`INSERT INTO Suppliers (supplier_id, name, address, contact, email) VALUES (?, ?, ?, ?, ?)`);
            const result = addSupplierQuery.run(uuidv4(), name, address, contact, email);

            return result;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    addCustomer: (name, address, contact) => {
        try {
            const addCustomerQuery = db.prepare(`INSERT INTO Customers (customer_id, name, address, contact) VALUES (?, ?, ?, ?)`);
            const result = addCustomerQuery.run(uuidv4(), name, address, contact);

            return result;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getSales: () => {
        try {
            const getSalesQuery = db.prepare('SELECT * FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id');
            const sales = getSalesQuery.all();

            return sales;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getSalesForSyncing: () => {
        try {
            const getSalesQuery = db.prepare('SELECT sale_id, name, contact, total_amount, payment_method, sales_date FROM Sales INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0');
            const sales = getSalesQuery.all();

            return sales;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getSalesForSyncing2: () => {
        try {
            const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id INNER JOIN Customers ON Sales.customer_id = Customers.customer_id WHERE Sales.synced = 0');
            const sales = getSalesQuery.all();

            return sales;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getSaleItems: (saleId) => {
        try {
            const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?');
            const sales = getSalesQuery.all(saleId);

            return sales;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    supplierProducts: async (supplierId) => {
        try {
            const getProductQuery = db.prepare(`SELECT product_name from products WHERE supplier_id = ?`);
            const products = getProductQuery.all(supplierId);

            return products;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    productDetails: async (productId) => {
        try {
            const getProductDetailQuery = db.prepare(`SELECT * from products WHERE product_id = ?`);
            const productDetail = getProductDetailQuery.all(productId);

            return productDetail;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    productSales: async (productId) => {
        try {
            const getProductDetailQuery = db.prepare(`SELECT * from Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN products ON Sales_items.product_id = Products.product_id WHERE Sales_items.product_id = ?`);
            const productDetail = getProductDetailQuery.all(productId);

            return productDetail;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getSaleItemsByProductId: (saleId) => {
        try {
            const getSalesQuery = db.prepare('SELECT * FROM Sales_items INNER JOIN Sales ON Sales_items.sale_id = Sales.sale_id INNER JOIN Products ON Sales_items.product_id = Products.product_id WHERE Sales_items.sale_id = ?');
            const sales = getSalesQuery.all(saleId);

            return sales;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    checkTheStock: (productName) => {
        try {
            const checkStock = db.prepare('SELECT * FROM products WHERE product_name = ?');
            const stock = checkStock.all(productName);

            return stock;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    stockBranch: (productId, productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category) => {
        try {
            const insertProductQuery = db.prepare('INSERT INTO products (product_id, product_name, wholesale_price, retail_price, stock_quantity_wholesale, stock_quantity_retail, supplier_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

            const insertProduct = insertProductQuery.run(productId, productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category);

            return insertProduct;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    addProduct: (productId, productName, wholesalePrice, retailPrice, supplierId, category) => {
        try {
            const insertProductQuery = db.prepare('INSERT INTO products (product_id, product_name, wholesale_price, retail_price, stock_quantity_wholesale, stock_quantity_retail, supplier_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

            const insertProduct = insertProductQuery.run(productId, productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category);

            return insertProduct;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    updateLastSyncedDate: (date) => {
        try {
            const updateQuery = db.prepare('UPDATE Settings SET lastSyncedDate = ?');

            const updateColumn = updateQuery.run(date);

            return updateColumn;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    updatestockQuantity: (productId, stockQuantityWholesale, stockQuantityRetail) => {
        try {
            const updateProductQuery = db.prepare('UPDATE products SET stock_quantity_wholesale = ?, stock_quantity_retail = ? WHERE product_id = ?');

            const updateProduct = updateProductQuery.run(stockQuantityWholesale, stockQuantityRetail, productId);

            return updateProduct;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    updateProduct: (productId, productName, wholesalePrice, retailPrice, category) => {
        try {
            const updateProductQuery = db.prepare('UPDATE products SET product_name = ?, wholesale_price = ?, retail_price = ?, category =?  WHERE product_id = ?');

            const updateProduct = updateProductQuery.run(productName, wholesalePrice, retailPrice, category, productId);

            return updateProduct;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    updateSyncedColumn: () => {
        try {
            const updateColumnQuery = db.prepare('UPDATE Sales SET synced = ? WHERE synced = ?');

            const updateSyncedColumn = updateColumnQuery.run(1, 0);

            return updateSyncedColumn;
        } catch (error) {
            console.error(error);
            return error;
        }
    },
    getLastSynced: () => {
        try {
            const getQuery = db.prepare('SELECT * FROM Settings');

            const getlastSynced = getQuery.all();

            return getlastSynced;
        } catch (error) {
            console.error(error);
            return error;
        }
    }

}


ipcMain.handle('storeManager', async (event, method, ...args) => {
    if (typeof storeManager[method] === 'function') {
        try {
            return await storeManager[method](...args);
        } catch (error) {
            console.error(`Error in storeManager.${method}:`, error);
            throw error;
        }
    } else {
        throw new Error(`Method ${method} not found in storeManager`);
    }
});

ipcMain.handle('test', async (event) => {
    return store.path;
});



// ipcMain.handle('storeManager', (event) => {
//     return storeManager;
// });

// ipcMain.handle('get-users', (event, role) => {
//     return storeManager.getUsers(role);
// });

// ipcMain.handle('get-customers', (event) => {
//     return storeManager.getCustomers();
// });

// ipcMain.handle('insert-new-sale', (event, customerId, totalAmount, paymentMethod) => {
//     return storeManager.insertNewSale(customerId, totalAmount, paymentMethod);
// });

// ipcMain.handle('insert-new-sale-item', (event, saleId, productId, quantity, unitPrice, saleType, subTotal) => {
//     return storeManager.insertNewSaleItem(saleId, productId, quantity, unitPrice, saleType, subTotal);
// });

// ipcMain.handle('update-wholesale-stock-quantity', (event, purchasedQuantity, productId) => {
//     return storeManager.updateWholesaleStockQuantity(purchasedQuantity, productId);
// });

// ipcMain.handle('update-retail-stock-quantity', (event, purchasedQuantity, productId) => {
//     return storeManager.updateRetailStockQuantity(purchasedQuantity, productId);
// });

// ipcMain.handle('check-user', (event, username, password, role) => {
//     return storeManager.checkUser(username, password, role);
// });

// ipcMain.handle('all-products', (event) => {
//     return storeManager.allProducts();
// });

// ipcMain.handle('products', (event) => {
//     return storeManager.products();
// });

// ipcMain.handle('get-suppliers', (event) => {
//     return storeManager.getSuppliers();
// });

// ipcMain.handle('add-supplier', (event, name, address, contact, email) => {
//     return storeManager.addSupplier(name, address, contact, email);
// });

// ipcMain.handle('add-customer', (event, name, address, contact) => {
//     return storeManager.addCustomer(name, address, contact);
// });

// ipcMain.handle('get-sales', (event) => {
//     return storeManager.getSales();
// });

// ipcMain.handle('get-sales-for-syncing', (event) => {
//     return storeManager.getSalesForSyncing();
// });

// ipcMain.handle('get-sales-for-syncing2', (event) => {
//     return storeManager.getSalesForSyncing2();
// });

// ipcMain.handle('get-sale-items', (event, saleId) => {
//     return storeManager.getSaleItems(saleId);
// });

// ipcMain.handle('supplier-products', (event, supplierId) => {
//     return storeManager.supplierProducts(supplierId);
// });

// ipcMain.handle('product-details', (event, productId) => {
//     return storeManager.productDetails(productId);
// });

// ipcMain.handle('product-sales', (event, productId) => {
//     return storeManager.productSales(productId);
// });

// ipcMain.handle('get-sale-items-by-productId', (event, saleId) => {
//     return storeManager.getSaleItemsByProductId(saleId);
// });

// ipcMain.handle('check-the-stock', (event, productName) => {
//     return storeManager.checkTheStock(productName);
// });

// ipcMain.handle('stock-branch', (event, productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category) => {
//     return storeManager.stockBranch(productName, wholesalePrice, retailPrice, stockQuantityWholesale, stockQuantityRetail, supplierId, category);
// });

// ipcMain.handle('update-stock-quantity', (event, productId, stockQuantityWholesale, stockQuantityRetail) => {
//     return storeManager.updatestockQuantity(productId, stockQuantityWholesale, stockQuantityRetail);
// });