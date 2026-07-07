import { app, BrowserWindow, dialog, globalShortcut, ipcMain } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

let win: BrowserWindow | null = null;
let ghostMode = false;

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * Ghost Mode is owned by the main process: it flips click-through on the
 * window and broadcasts the new state to the renderer so the UI stays in sync
 * whether the toggle came from the toolbar or the global shortcut.
 */
function applyGhostMode(ghost: boolean): void {
  if (!win) return;
  ghostMode = ghost;
  // forward: true keeps mousemove events flowing to the renderer while the
  // window is click-through, so the renderer can re-enable clicks when the
  // cursor is over the toolbar.
  win.setIgnoreMouseEvents(ghost, { forward: true });
  win.webContents.send('ghost-mode-changed', ghost);
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 360,
    minHeight: 280,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 'screen-saver' level keeps the overlay above normal always-on-top windows.
  win.setAlwaysOnTop(true, 'screen-saver');

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Escape hatch: Ghost Mode makes the window click-through, so the toggle
  // must also work without clicking the window.
  globalShortcut.register('Control+Alt+G', () => applyGhostMode(!ghostMode));

  ipcMain.handle('set-ghost-mode', (_event, ghost: boolean) => {
    applyGhostMode(ghost);
  });

  // While in Ghost Mode, the renderer asks to temporarily receive mouse
  // events when the cursor hovers the toolbar (and to give them up again
  // when it leaves). Ignored outside Ghost Mode.
  ipcMain.on('set-ignore-mouse', (_event, ignore: boolean) => {
    if (!win || !ghostMode) return;
    win.setIgnoreMouseEvents(ignore, { forward: true });
  });

  ipcMain.handle('import-image', async (): Promise<string | null> => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Import image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()];
    if (!mime) return null;
    const data = await fs.readFile(filePath);
    return `data:${mime};base64,${data.toString('base64')}`;
  });

  ipcMain.handle('save-project', async (_event, json: string): Promise<boolean> => {
    if (!win) return false;
    const result = await dialog.showSaveDialog(win, {
      title: 'Save project',
      defaultPath: 'untitled.tracelayer.json',
      filters: [{ name: 'TraceLayer project', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.writeFile(result.filePath, json, 'utf-8');
    return true;
  });

  ipcMain.handle('load-project', async (): Promise<string | null> => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Load project',
      properties: ['openFile'],
      filters: [{ name: 'TraceLayer project', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return fs.readFile(result.filePaths[0], 'utf-8');
  });

  ipcMain.on('close-app', () => {
    app.quit();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
