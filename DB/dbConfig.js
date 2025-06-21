// DB/storeManager.js
import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

// Get writable path
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "store.db");

// Open the DB
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export { db };
