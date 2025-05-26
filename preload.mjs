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
    activateSoftware: (activationKey, branchName) => ipcRenderer.invoke('activate-software', activationKey, branchName)
});

contextBridge.exposeInMainWorld('functions', {
    handleDBError: handleDatabaseError,
    testFunction: () => ipcRenderer.invoke('test')
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