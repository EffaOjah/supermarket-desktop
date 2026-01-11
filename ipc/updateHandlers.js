import { BrowserWindow, dialog, Notification, ipcMain, autoUpdater } from "electron";
import path from "path";

let updateWindow = null;

export function initAutoUpdater(mainWindow, feedUrl) {
    if (!feedUrl) return;

    // Set the feed URL for the native autoUpdater
    try {
        autoUpdater.setFeedURL({ url: feedUrl });
    } catch (err) {
        console.error("Failed to set feed URL:", err);
        return;
    }

    autoUpdater.on("update-available", () => {
        console.log("Update available...");

        // Notify user via OS notification
        new Notification({
            title: 'Update Available',
            body: 'A new version is being prepared for installation.'
        }).show();

        // Create the update progress window as a status indicator
        if (!updateWindow) {
            updateWindow = new BrowserWindow({
                width: 400,
                height: 300,
                frame: false,
                resizable: false,
                alwaysOnTop: true,
                webPreferences: {
                    preload: path.join(path.resolve(), "preload.mjs"),
                    contextIsolation: true,
                    nodeIntegration: false
                }
            });

            updateWindow.loadFile(path.join("pages", "update-progress.html"));

            updateWindow.on('closed', () => {
                updateWindow = null;
            });
        }
    });

    autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
        console.log("Update downloaded:", releaseName);

        if (updateWindow) {
            updateWindow.webContents.send("update-downloaded");
            // Auto close after 2 seconds
            setTimeout(() => {
                updateWindow.close();
            }, 2000);
        }

        if (mainWindow) {
            mainWindow.setProgressBar(-1);
        }

        dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready',
            message: `A new version (${releaseName || 'latest'}) has been downloaded. Restart now?`,
            buttons: ['Yes', 'Later'],
        }).then(result => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on("error", (error) => {
        console.error("Update error:", error);
        if (updateWindow) {
            updateWindow.close();
        }
    });

    // Handle other native events
    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for updates...");
    });

    autoUpdater.on("update-not-available", () => {
        console.log("No updates available.");
    });

    // Check for updates on init
    autoUpdater.checkForUpdates();

    // Manual check trigger from UI
    ipcMain.on('check-for-updates', () => {
        console.log("Manual update check triggered...");
        try {
            autoUpdater.checkForUpdates();
        } catch (err) {
            console.error("Manual check error:", err);
        }
    });
}
