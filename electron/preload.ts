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

  /** Open a save dialog and write the project JSON. Resolves true on success. */
  saveProject: (json: string): Promise<boolean> =>
    ipcRenderer.invoke('save-project', json),

  /** Open a file dialog and read a project JSON. Resolves to the raw text, or null. */
  loadProject: (): Promise<string | null> => ipcRenderer.invoke('load-project'),

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
