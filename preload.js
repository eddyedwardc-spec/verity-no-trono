// Small, explicit bridge between the game page and the desktop window.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  isApp: true,
  toggleFullScreen: () => ipcRenderer.invoke('fs:toggle'),
  setFullScreen: v => ipcRenderer.invoke('fs:set', !!v),
  onFullScreen: cb => ipcRenderer.on('fs:changed', (_e, v) => cb(!!v)),
  quit: () => ipcRenderer.invoke('app:quit'),
  version: () => ipcRenderer.invoke('app:version'),
  updateState: () => ipcRenderer.invoke('upd:get'),
  waitUpdateCheck: () => ipcRenderer.invoke('upd:wait'),
  installUpdate: () => ipcRenderer.invoke('upd:install'),
  onUpdate: cb => ipcRenderer.on('upd:status', (_e, s) => cb(s))
});
