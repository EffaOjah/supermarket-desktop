// main.js

import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import path from "path";
import Store from "electron-store";
import storeManager from "./DB/storeManager.js";
import myJwt from "./jwt/jwt.js";
import fs from "fs";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
// import { v4 as uuidv4 } from "uuid";

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Writable path
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "store.db");
const defaultDbPath = path.join(process.resourcesPath, "store.db"); // Comes from `extraResource`

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

// Menu.setApplicationMenu(null);

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
        win.loadFile("./pages/signin.html");
      }
    }
  });

  ipcMain.on("redirect", (event, page) => {
    const token = store.get("authToken");

    if (!token) {
      console.log("No Token provided");
      return win.loadFile("./pages/signin.html");
    }

    const verifyToken = myJwt.verifyToken(token);
    if (!verifyToken) {
      console.log("Invalid token");
      return win.loadFile("./pages/signin.html");
    }

    win.loadFile(page);
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle("activate-software", (event, activationKey, branchName) => {
  let data = {
    branchId: activationKey,
    branchName: branchName,
  };

  data = JSON.stringify(data);

  fs.writeFile(path.join(userDataPath, "file.json"), data, (err) => {
    if (err) {
      let error = { error: "Error activating software" };
      return error;
    }
    console.log("Successfully activated software");
    let message = { message: "Successfully activated software" };

    return message;
  });
});

ipcMain.handle("get-software-details", async () => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(userDataPath, "file.json"), "utf-8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
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

ipcMain.handle("sync-products", async (lastSynced) => {
  try {
    const response = await fetch(
      `https://web.marybillconglomerate.com.ng/storeApi/get-products?lastSynced=${lastSynced}`
    );
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
});

ipcMain.handle("get-all-products", async () => {
  try {
    const response = await fetch(
      `https://web.marybillconglomerate.com.ng/storeApi/get-all-products`
    );
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
});

ipcMain.handle("stock-products", async () => {
  try {
    const result = await new Promise((resolve, reject) => {
      fs.readFile(
        path.join(userDataPath, "file.json"),
        "utf-8",
        (err, data) => {
          if (err) reject(err);
          else resolve(JSON.parse(data));
        }
      );
    });

    const response = await fetch(
      `https://web.marybillconglomerate.com.ng/storeApi/pendingStocking?branchId=${result.branchId}`
    );
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
});

ipcMain.handle("sync-sales", async (event, data) => {
  try {
    const fileContent = await fs.promises.readFile(
      path.join(userDataPath, "file.json"),
      "utf-8"
    );
    const { branchId } = JSON.parse(fileContent);

    const response = await fetch(
      `https://web.marybillconglomerate.com.ng/storeApi/sync-sales-from-branches?branchId=${branchId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Sync sales fetch error:", error);
    return { error: true, message: error.message };
  }
});

ipcMain.handle("show-warning-dialog", (event, title, message) => {
  dialog.showMessageBox({
    type: "warning",
    title: title,
    message: message,
    buttons: ["OK"],
  });
});

ipcMain.handle("show-error-dialog", (event, title, message) => {
  dialog.showMessageBox({
    type: "error",
    title: title,
    message: message,
    buttons: ["OK"],
  });
});

ipcMain.handle("login", async (event, username, password, role) => {
  try {
    const checkUser = await storeManager.checkUser(username, password, role);
    console.log("CheckUser: ", checkUser);

    if (checkUser.length < 1) {
      console.log("Invalid Login Details");
      return { success: false, message: "Invalid Login Details" };
    }

    const generateToken = myJwt.generateToken(
      checkUser[0].user_id,
      checkUser[0].role
    );
    console.log("generateToken: ", generateToken);

    store.set("authToken", generateToken);
    return { success: true, message: "Login successful" };
  } catch (error) {
    return { success: false, message: error.message || "Login failed" };
  }
});

ipcMain.handle("verify-user", async () => {
  const token = store.get("authToken");

  if (!token) {
    console.log("No Token provided");
    return { success: false, message: "Not authenticated" };
  }

  const verifyToken = myJwt.verifyToken(token);
  console.log("Decoded: ", verifyToken);

  return { success: true, decoded: verifyToken };
});

ipcMain.handle("logout", () => {
  store.delete("authToken");
  return { success: true, message: "Logged out" };
});

ipcMain.on("print-image", (event, dataUrl) => {
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

  printWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});



ipcMain.handle("storeManager", async (event, method, ...args) => {
  if (typeof storeManager[method] === "function") {
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

ipcMain.handle("test", async (event) => {
  return store.path;
});
