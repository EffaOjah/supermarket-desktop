import { contextBridge, ipcRenderer } from 'electron';
import html2canvas from 'html2canvas';

// import storeManager from './DB/storeManager.js';
import handleDatabaseError from './functions/DBErrorHandler.js';

// contextBridge.exposeInMainWorld('sqlite', {
//     storeManager: () => ipcRenderer.invoke('storeManager'),
// });

contextBridge.exposeInMainWorld('sqlite', {
    storeManager: (method, ...args) => ipcRenderer.invoke('storeManager', method, ...args)
});

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node
});

contextBridge.exposeInMainWorld('electronAPI', {
    html2canvas: html2canvas,
    warningDialog: (title, message) => ipcRenderer.invoke('show-warning-dialog', title, message),
    errorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),
    printImage: (dataUrl) => ipcRenderer.send('print-image', dataUrl),
    getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
    activateSoftware: (activationKey, branchName) => ipcRenderer.invoke('activate-software', activationKey, branchName),
    getSoftwareDetails: () => ipcRenderer.invoke('get-software-details'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    syncProducts: (lastSyncedDate) => ipcRenderer.invoke('sync-products', lastSyncedDate),
    getAllProducts: () => ipcRenderer.invoke('get-all-products'),
    stockProducts: () => ipcRenderer.invoke('stock-products'),
    syncSales: (data) => ipcRenderer.invoke('sync-sales', data),
    updateProgress: (percent) => ipcRenderer.send('update-progress', percent),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, value) => callback(value)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, value) => callback(value)),
    checkForUpdates: () => ipcRenderer.send('check-for-updates')
});

contextBridge.exposeInMainWorld('functions', {
    handleDBError: handleDatabaseError,
    testFunction: () => ipcRenderer.invoke('test')
});

contextBridge.exposeInMainWorld('electronStore', {
    login: async (username, password) => await ipcRenderer.invoke('login', username, password),
    getProtectedData: async () => await ipcRenderer.invoke('verify-user'),
    logout: async () => await ipcRenderer.invoke('logout'),
    manualSet: async () => await ipcRenderer.invoke('manual-set'),
});

contextBridge.exposeInMainWorld('pageRedirect', {
    redirect: (page, role) => ipcRenderer.send('redirect', page),
});