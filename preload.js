const { contextBridge, ipcRenderer } = require('electron');
const html2canvas = require('html2canvas');

const storeManager = require('./DB/storeManager.js');
const databaseErrorHandler = require('./functions/DBErrorHandler.js');

contextBridge.exposeInMainWorld('sqlite', {
    storeManager
});

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node
});

contextBridge.exposeInMainWorld('electronAPI', {
    html2canvas: html2canvas,
    warningDialog: (title, message) => ipcRenderer.invoke('show-warning-dialog', title, message),
    errorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),
    printImage: (dataUrl) => ipcRenderer.send('print-image', dataUrl),
});

contextBridge.exposeInMainWorld('functions', {
    handleDBError: databaseErrorHandler
});

contextBridge.exposeInMainWorld('electronStore', {
    login: async (username, password, role) => await ipcRenderer.invoke('login', username, password, role),
    getProtectedData: async () => await ipcRenderer.invoke('verify-user'),
    logout: async () => await ipcRenderer.invoke('logout'),
    manualSet: async () => await ipcRenderer.invoke('manual-set'),
});

contextBridge.exposeInMainWorld('pageRedirect', {
    redirect: (page, role) => ipcRenderer.send('redirect', page),
});