// main.js

import ws from 'windows-shortcuts';
import { app, BrowserWindow, Menu, Notification, dialog } from "electron";
// import { autoUpdater } from 'electron-updater';
import path from "path";
import Store from "electron-store";
import fs from "fs";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import registerIpcHandlers from "./ipc/ipcHandlers.js";
import { initAutoUpdater } from "./ipc/updateHandlers.js";

// Detect packaged/installed environment
const isPackaged = app.isPackaged;

// Set appId
app.setAppUserModelId('com.marybill.conglomerate');



const server = 'https://web.marybillconglomerate.com.ng'; // hosted folder
const feed = `${server}/updates/`;

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Writable path
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "store.db");

const defaultDbPath = path.join(process.resourcesPath, "store.db"); // Comes from `extraResource`
console.log(process.resourcesPath);

// Only copy on first run
if (!fs.existsSync(dbPath)) {
  fs.copyFileSync(defaultDbPath, dbPath);
}

const branchFilePath = path.join(userDataPath, "file.json");
const defaultBranchFilePath = path.join(process.resourcesPath, "file.json");

if (!fs.existsSync(branchFilePath)) {
  fs.copyFileSync(defaultBranchFilePath, branchFilePath);
}

// Open the DB from the user data directory
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Instantiate store
// const store = new Store();

// Get the system's app data path (safe for writes)
const storePath = path.join(userDataPath, "config");


// Create store with custom path
const store = new Store({
  cwd: storePath, // <- where the config.json will be saved
});

// Register IPC Handlers
registerIpcHandlers({ userDataPath, store });


// Don't show menu when app is packaged
if (app.isPackaged) {
  Menu.setApplicationMenu(null);
}

// Squirrel installer hook
const checkSquirrel = async () => {
  try {
    const squirrel = await import('electron-squirrel-startup');
    if (squirrel.default) app.quit();
  } catch (err) {
    // If import fails (e.g. on macOS/Linux), just ignore
  }
};

await checkSquirrel();

const createWindow = () => {
  console.log("Path:", store.path);
  console.log("Before:", store.get("authToken"));

  store.set("authToken", "123405");

  console.log("After:", store.get("authToken"));

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.mjs"),
      webSecurity: true,
    },
  });

  win.maximize();

  /* Check if software have been activated,
    before loading first page */

  fs.readFile(path.join(userDataPath, "file.json"), (err, data) => {
    if (err) {
      throw err;
    } else {
      data = JSON.parse(data);
      console.log(data.branchId);

      if (data.branchId == null) {
        win.loadFile("./pages/activation-page.html");
      } else {
        win.loadFile("./pages/login.html");
      }
    }
  });



  return win;
};

app.whenReady().then(async () => {
  const mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });



  if (process.platform === 'win32' && isPackaged) {
    // Initialize Auto Updater with professional UI
    initAutoUpdater(mainWindow, feed);

    // Desktop Shortcut
    const exePath = process.execPath;
    const desktopPath = app.getPath('desktop');
    const shortcutPath = path.join(desktopPath, 'Marybill Conglomerate.lnk');

    // Avoid creating duplicate shortcut
    if (!fs.existsSync(shortcutPath)) {
      ws.create(shortcutPath, {
        target: exePath,
        args: '',
        desc: 'Launch Marybill Conglomerate Software',
        icon: exePath, // or path.join(process.resourcesPath, 'app_icon.ico')
      }, function (err) {
        if (err) {
          console.error('Failed to create shortcut:', err);
        } else {
          console.log('Shortcut created on desktop!');
        }
      });
    }

    // Start Menu Shortcut
    const startMenuFolder = path.join(app.getPath('startMenu'), 'Marybill Conglomerate Ltd');
    const startMenuShortcut = path.join(startMenuFolder, 'Marybill Conglomerate.lnk');

    // Create folder if it doesn't exist
    if (!fs.existsSync(startMenuFolder)) {
      fs.mkdirSync(startMenuFolder, { recursive: true });
    }

    if (!fs.existsSync(startMenuShortcut)) {
      ws.create(startMenuShortcut, {
        target: exePath,
        desc: 'Launch Marybill Conglomerate Software',
        icon: exePath,
      }, err => err && console.error('Start Menu Shortcut Error:', err));
    }
  }
});