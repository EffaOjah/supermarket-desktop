import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'store.db');

// Path to the default DB inside app resources
const defaultDbPath = path.join(process.resourcesPath, 'store.db');

// Copy the default DB if it doesn't already exist
if (!fs.existsSync(dbPath)) {
  fs.copyFileSync(defaultDbPath, dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export { db };
