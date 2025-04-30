const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');

const Store = require('electron-store').default;

const store = new Store();

// Require the database module
const storeManager = require('./DB/storeManager.js');

// Require the jwt module
const jwt = require('./jwt/jwt.js');

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { 
                label: 'View sales',
                click: () => {
                    const salesWindow = new BrowserWindow({
                        width: 800,
                        height: 600,
                        webPreferences: {
                            nodeIntegration: true,
                            preload: path.join(__dirname, 'preload.js'),
                        }
                    });

                    salesWindow.webContents.openDevTools();
                    
                    salesWindow.loadFile('./pages/sales.html')
                }
            },
            {
                type:'separator'
            },
            {
                label: 'Quit',
                accelerator: 'CmdOrCtrl+Q',
                click: () => app.quit()
            }
        ],
    },
];

const menu = Menu.buildFromTemplate(menuTemplate);
// Menu.setApplicationMenu(null);

// Function to create a window
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        }
    });

    win.maximize();
    
    // Load the file
    win.loadFile('./pages/signin.html');

    // Handle page redirecting
    ipcMain.on('redirect', (event, page) => {
        // Check if user is logged in
        const token = store.get('authToken');

        if (!token) {
            console.log('No Token provided');
            return win.loadFile('./pages/signin.html');
        }

        // Verify the token
        const verifyToken = jwt.verifyToken(token);
        if (!verifyToken) {
            console.log('Invalid token');
            return win.loadFile('./pages/signin.html')
        }
        win.loadFile(page);
    });
}

// Create the window when the app is ready
app.whenReady().then(() => {
    createWindow();

    // Create the window, if there's  no running window(For MAC OS)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.handle('show-warning-dialog', (event, title, message) => {
    // dialog.showErrorBox(title, message);
    dialog.showMessageBox({
        type: "warning",
        title: title,
        message: message,
        buttons: ["OK"]
    });
});

ipcMain.handle('show-error-dialog', (event, title, message) => {
    // dialog.showErrorBox(title, message);
    dialog.showMessageBox({
        type: "error",
        title: title,
        message: message,
        buttons: ["OK"]
    });
});

// Handle login
ipcMain.handle('login', async (event, username, password, role) => {
    try {
        const checkUser = await storeManager.checkUser(username, password, role);
        console.log('CheckUser: ', checkUser);

        if (checkUser.length < 1) {
            console.log('Invalid Login Details');
            
            return { success: false, message: 'Invalid Login Details' };
        }

        // Generate the jwt
        const generateToken = jwt.generateToken(checkUser[0].user_id, checkUser[0].role);
        console.log(generateToken);
        
        // Store the token in the Electron store
        store.set('authToken', generateToken);

        return { success: true, message: 'Login successful' }
    } catch (error) {
        return error;        
    }
});

// Verify user
ipcMain.handle('verify-user', async () => {
    const token = store.get('authToken');

    if (!token) {
        console.log('No Token provided');
        return { success: false, message: "Not authenticated" };
    }

    // Verify the token
    const verifyToken = jwt.verifyToken(token);
    let decoded = verifyToken;
    console.log('Decoded: ', decoded);

    return { success: true, decoded };
});

// Logout
ipcMain.handle("logout", () => {
    store.delete("authToken");
    return { success: true, message: "Logged out" };
});

ipcMain.on('print-image', (event, dataUrl) => {
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
  
    // Optional: close window after short delay
    printWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        printWindow.close();
      }, 1000); // adjust if needed
    });
  });


// Quit the app if all windows were closed(For non MAC OS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});