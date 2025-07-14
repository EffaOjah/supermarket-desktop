import { app, Menu } from "electron";

const isMac = process.platform === 'darwin';

const template = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'Open file',
                click: async () => {
                    doOpenFile();
                }
            }
        ]

    }
]