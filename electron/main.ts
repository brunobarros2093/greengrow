import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';
import { registerIpcHandlers } from './ipc/handlers';
import { getDb } from './db/database';

app.setName('GreenGrow');

const isDev = !app.isPackaged;
const iconPath = path.join(__dirname, '..', 'build-resources', 'icon.ico');

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/app/browser/index.html'));
  }
}

app.whenReady().then(() => {
  getDb();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
