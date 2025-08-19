// DB/storeManager.js
import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

import { v4 as uuidv4 } from "uuid";

// Get writable path
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "store.db");

// Open the DB
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// ---- Create Tables if they don't exist ----
db.exec(`
CREATE TABLE IF NOT EXISTS Customers (
    customer_id TEXT NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    contact TEXT,
    customer_type TEXT,
    date_added TEXT,
    PRIMARY KEY(customer_id)
);

CREATE TABLE IF NOT EXISTS Products (
    product_id TEXT NOT NULL UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    wholesale_cost_price NUMERIC,
    wholesale_selling_price NUMERIC,
    retail_cost_price NUMERIC,
    retail_selling_price NUMERIC,
    stock_quantity_wholesale INTEGER,
    stock_quantity_retail INTEGER,
    supplier_id INTEGER NOT NULL,
    category TEXT,
    PRIMARY KEY(product_id),
    FOREIGN KEY(supplier_id) REFERENCES Suppliers(supplier_id)
);

CREATE TABLE IF NOT EXISTS Sales (
    sale_id TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    sales_date TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    discount INTEGER NOT NULL DEFAULT 0,
    synced INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(sale_id),
    FOREIGN KEY(customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE IF NOT EXISTS Sales_items (
    sale_item_id TEXT NOT NULL UNIQUE,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    discount INTEGER NOT NULL DEFAULT 0,
    sale_type TEXT CHECK(sale_type IN ('Wholesale', 'Retail')),
    subtotal INTEGER NOT NULL,
    PRIMARY KEY(sale_item_id),
    FOREIGN KEY(product_id) REFERENCES Products(product_id),
    FOREIGN KEY(sale_id) REFERENCES Sales(sale_id)
);

CREATE TABLE IF NOT EXISTS Settings (
    lastSyncedDate TEXT
);

CREATE TABLE IF NOT EXISTS Suppliers (
    supplier_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    contact TEXT,
    email VARCHAR(200) UNIQUE,
    PRIMARY KEY(supplier_id)
);

CREATE TABLE IF NOT EXISTS Users (
    user_id TEXT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50),
    PRIMARY KEY(user_id)
);
`);

// ---- Populate Customers if empty ----
const customerCount = db.prepare(`SELECT COUNT(*) AS count FROM Customers`).get().count;
if (customerCount === 0) {
    const stmt = db.prepare(`
        INSERT INTO Customers (customer_id, name, address, contact, customer_type, date_added)
        VALUES (@customer_id, @name, @address, @contact, @customer_type, @date_added)
    `);

    stmt.run({
        customer_id: uuidv4(),
        name: "walk-in-customer",
        address: "Unknown",
        contact: "0000000000",
        customer_type: "Regular",
        date_added: new Date().toISOString()
    });
}

// ---- Populate Users if empty ----
const userCount = db.prepare(`SELECT COUNT(*) AS count FROM Users`).get().count;
if (userCount === 0) {
    const stmt = db.prepare(`
        INSERT INTO Users (user_id, username, password, role)
        VALUES (?, ?, ?, ?)
    `);

    stmt.run("1", "mary", "1234", "salesRep");
    stmt.run("2", "storeManager", "123456", "storeManager");
}

// ---- Populate Suppliers if empty ----
const supplierCount = db.prepare(`SELECT COUNT(*) AS count FROM Suppliers`).get().count;
if (supplierCount === 0) {
    const stmt = db.prepare(`
        INSERT INTO Suppliers (supplier_id, name, address, contact)
        VALUES (?, ?, ?, ?)
    `);

    const suppliers = [
        [1, "WAMCO", "Wall street", "626228282828"],
        [2, "AAVA NIVEA", "", ""],
        [3, "AAVA NON-NIVEA", "", ""],
        [4, "RECKITT", "", ""],
        [5, "FMN", "", ""],
        [6, "AQUABIL", "", ""],
        [7, "GUINESS", "", ""],
        [8, "TOMATOE JOS", "", ""],
        [9, "PZ", "", ""]
    ];

    for (const supplier of suppliers) {
        stmt.run(supplier);
    }
}

// ---- Populate Settings with NULL lastSyncedDate if empty ----
const settingsCount = db.prepare(`SELECT COUNT(*) AS count FROM Settings`).get().count;
if (settingsCount === 0) {
    const stmt = db.prepare(`INSERT INTO Settings (lastSyncedDate) VALUES (?)`);
    stmt.run(null);
}


console.log("Database initialized");

export { db };
