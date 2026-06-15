// Pont sécurisé entre le processus principal et le renderer (contextIsolation)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eco', {
  onMenu: (cb) => ipcRenderer.on('menu', (_e, action, arg) => cb(action, arg)),
  onOpenTab: (cb) => ipcRenderer.on('open-tab', (_e, url) => cb(url)),
});
