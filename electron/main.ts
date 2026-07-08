import { app, BrowserWindow, desktopCapturer, dialog, globalShortcut, ipcMain, screen } from 'electron';
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
  // Always start centered at a fixed 800×500 (no persisted bounds — a
  // predictable overlay position beats restoring wherever it was left).
  // minWidth 760 is a hard floor: the full-width bottom control bar is
  // designed to fit all controls in one row at 760px window width, so the
  // bar can never be clipped no matter how small the window is resized.
  win = new BrowserWindow({
    width: 800,
    height: 500,
    center: true,
    minWidth: 760,
    minHeight: 320,
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

  // Failsafe: re-assert the click-through state whenever the window gains
  // focus or is restored, so a missed/raced setIgnoreMouseEvents call can
  // never leave Edit Mode stuck ignoring the mouse.
  const reassertMouseState = () => {
    win?.setIgnoreMouseEvents(ghostMode, { forward: true });
  };
  win.on('focus', reassertMouseState);
  win.on('restore', reassertMouseState);
  win.on('show', reassertMouseState);

  win.on('closed', () => {
    win = null;
  });
}

// Two overlapping transparent overlays are indistinguishable on screen and
// input lands unpredictably — enforce a single instance.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

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

  // Snapshot: capture the screen area under the overlay and hand it to the
  // renderer as an image. The overlay is made fully transparent for a moment
  // so it does not appear in its own capture. Local only — nothing leaves
  // the machine.
  ipcMain.handle(
    'capture-under',
    async (): Promise<{ dataUrl: string; scaleFactor: number } | null> => {
      if (!win) return null;
      const bounds = win.getBounds();
      const display = screen.getDisplayMatching(bounds);
      const scaleFactor = display.scaleFactor;
      win.setOpacity(0);
      try {
        // Give the compositor a frame to actually drop the overlay.
        await new Promise((resolve) => setTimeout(resolve, 150));
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width: Math.round(display.size.width * scaleFactor),
            height: Math.round(display.size.height * scaleFactor),
          },
        });
        const source =
          sources.find((s) => s.display_id === String(display.id)) ?? sources[0];
        if (!source || source.thumbnail.isEmpty()) return null;
        const cropped = source.thumbnail.crop({
          x: Math.round((bounds.x - display.bounds.x) * scaleFactor),
          y: Math.round((bounds.y - display.bounds.y) * scaleFactor),
          width: Math.round(bounds.width * scaleFactor),
          height: Math.round(bounds.height * scaleFactor),
        });
        return { dataUrl: cropped.toDataURL(), scaleFactor };
      } catch {
        return null;
      } finally {
        win?.setOpacity(1);
      }
    },
  );

  // Resize to a project's saved sheet size (load-project flow). Clamped to
  // the window minimums and the current display's work area; keeps position.
  ipcMain.on('set-window-size', (_event, width: number, height: number) => {
    if (!win || !Number.isFinite(width) || !Number.isFinite(height)) return;
    const area = screen.getDisplayMatching(win.getBounds()).workAreaSize;
    const [minW, minH] = win.getMinimumSize();
    win.setSize(
      Math.round(Math.min(Math.max(width, minW), area.width)),
      Math.round(Math.min(Math.max(height, minH), area.height)),
    );
  });

  // Hide = minimize. The overlay leaves the screen but the app keeps
  // running; restore from the taskbar. Deliberately not app.quit().
  ipcMain.on('hide-window', () => {
    win?.minimize();
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
