
import { ipcMain, dialog, BrowserWindow, app } from "electron";
import path from "path";
import fs from "fs";
import storeManager from "../DB/storeManager.js";
import myJwt from "../jwt/jwt.js";

export default function registerIpcHandlers({ userDataPath, store }) {

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

    ipcMain.handle("get-app-version", () => {
        return app.getVersion();
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

    ipcMain.handle("sync-products", async (event, lastSynced) => { // Added event param which is standard for handlers
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

    ipcMain.handle("login", async (event, username, password) => {
        try {
            const checkUser = await storeManager.checkUser(username, password);
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

    ipcMain.on("redirect", (event, page) => {
        const token = store.get("authToken");

        // Using BrowserWindow.fromWebContents(event.sender) to infer the window
        // This allows moving this handler out of the manual createWindow closure
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;

        if (!token) {
            console.log("No Token provided");
            return win.loadFile("./pages/login.html");
        }

        const verifyToken = myJwt.verifyToken(token);
        if (!verifyToken) {
            console.log("Invalid token");
            return win.loadFile("./pages/login.html");
        }

        win.loadFile(page);
    });

}
