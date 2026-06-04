require('dotenv').config();
const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow = null;
let tray = null;
let isVisible = true;

// ─── Window Factory ────────────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 460,
    height: 700,
    x: width - 480,
    y: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../assets/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  // Use a plain 16x16 PNG as fallback tray icon
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) throw new Error('empty');
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Universal AI Agent');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show / Hide', click: toggleWindow },
    { label: 'Analyze Screen (Ctrl+Shift+A)', click: () => triggerAnalyze() },
    { type: 'separator' },
    { label: 'Settings', click: () => mainWindow?.webContents.send('open-settings') },
    { label: 'Clear History', click: clearHistory },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', toggleWindow);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function toggleWindow() {
  if (!mainWindow) return;
  isVisible = !isVisible;
  isVisible ? mainWindow.show() : mainWindow.hide();
}

async function triggerAnalyze() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.webContents.send('trigger-analyze');
}

function clearHistory() {
  const db = require('../memory/db');
  db.clearHistory();
  mainWindow?.webContents.send('history-cleared');
}

// ─── Global Shortcuts ──────────────────────────────────────────────────────────
function registerShortcuts() {
  const shortcuts = {
    [process.env.HOTKEY_ANALYZE || 'CommandOrControl+Shift+A']: triggerAnalyze,
    [process.env.HOTKEY_HIDE || 'CommandOrControl+Shift+H']: toggleWindow,
    [process.env.HOTKEY_CAPTURE || 'CommandOrControl+Shift+C']: () =>
      mainWindow?.webContents.send('trigger-capture'),
    [process.env.HOTKEY_REFRESH || 'CommandOrControl+Shift+R']: () =>
      mainWindow?.webContents.send('trigger-refresh'),
  };

  for (const [key, fn] of Object.entries(shortcuts)) {
    try {
      globalShortcut.register(key, fn);
    } catch (e) {
      console.warn(`Could not register shortcut ${key}:`, e.message);
    }
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────
function setupIPC() {
  const capture = require('../capture/capture');
  const ocr = require('../ocr/ocr');
  const llm = require('../agent/llm');
  const db = require('../memory/db');
  const windowDetector = require('../context/windowDetector');

  ipcMain.handle('get-context', async () => {
    try {
      const windowInfo = await windowDetector.getActiveWindow();
      return windowInfo;
    } catch (e) {
      return { app: 'Unknown', title: 'Unknown', timestamp: Date.now() };
    }
  });

  ipcMain.handle('capture-screen', async (_, mode = 'fullscreen') => {
    try {
      const imgPath = await capture.captureScreen(mode);
      return { success: true, path: imgPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('run-ocr', async (_, imgPath) => {
    try {
      const text = await ocr.extractText(imgPath);
      return { success: true, text };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('ask-llm', async (_, { context, mode, userPrompt }) => {
    try {
      const response = await llm.query({ context, mode, userPrompt });
      db.saveHistory({ context, mode, userPrompt, response });
      return { success: true, response };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('get-history', async (_, limit = 20) => {
    return db.getHistory(limit);
  });

  ipcMain.handle('get-store', (_, key) => store.get(key));
  ipcMain.handle('set-store', (_, key, value) => {
    store.set(key, value);
    return true;
  });

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-hide', () => { isVisible = false; mainWindow?.hide(); });
  ipcMain.on('window-close', () => app.quit());
  ipcMain.on('window-drag', (_, { deltaX, deltaY }) => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  });
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Init DB
  const db = require('../memory/db');
  await db.init();

  createWindow();
  createTray();
  registerShortcuts();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep alive in tray on all platforms
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
