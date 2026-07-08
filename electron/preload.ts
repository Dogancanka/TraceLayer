import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

const api = {
  /** Enable/disable Ghost Mode. Main process confirms via onGhostModeChanged. */
  setGhostMode: (ghost: boolean): Promise<void> =>
    ipcRenderer.invoke('set-ghost-mode', ghost),

  /** Subscribe to Ghost Mode changes (toolbar or global shortcut). Returns an unsubscribe fn. */
  onGhostModeChanged: (callback: (ghost: boolean) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, ghost: boolean) => callback(ghost);
    ipcRenderer.on('ghost-mode-changed', listener);
    return () => ipcRenderer.removeListener('ghost-mode-changed', listener);
  },

  /** While in Ghost Mode: false = window receives clicks (cursor over toolbar). */
  setIgnoreMouse: (ignore: boolean): void => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },

  /** Open a file dialog for PNG/JPG. Resolves to a data URL, or null if cancelled. */
  importImage: (): Promise<string | null> => ipcRenderer.invoke('import-image'),

  /**
   * Capture the screen under the overlay (overlay hidden for a moment) as a
   * data URL cropped to the window bounds, plus the display scale factor so
   * the renderer can place it 1:1 with the screen.
   */
  captureUnder: (): Promise<{ dataUrl: string; scaleFactor: number } | null> =>
    ipcRenderer.invoke('capture-under'),

  /** Open a save dialog and write the project JSON. Resolves true on success. */
  saveProject: (json: string): Promise<boolean> =>
    ipcRenderer.invoke('save-project', json),

  /** Open a file dialog and read a project JSON. Resolves to the raw text, or null. */
  loadProject: (): Promise<string | null> => ipcRenderer.invoke('load-project'),

  /**
   * Resize the window (e.g. to the sheet size a project was saved with, so
   * window-center-relative content lines up with the paper edges again).
   * Main clamps to the window's minimum size.
   */
  setWindowSize: (width: number, height: number): void => {
    ipcRenderer.send('set-window-size', width, height);
  },

  /** Minimize the overlay to the taskbar without quitting. */
  hideWindow: (): void => {
    ipcRenderer.send('hide-window');
  },

  /** Quit the app (frameless window has no OS close button). */
  closeApp: (): void => {
    ipcRenderer.send('close-app');
  },
};

export type TraceLayerApi = typeof api;

contextBridge.exposeInMainWorld('traceLayer', api);
