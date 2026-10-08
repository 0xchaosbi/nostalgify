// Narrow bridge between the sandboxed page and the main process.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nostalgify", {
  debug: Boolean(process.env.NOSTALGIFY_SELFTEST),
  getState: () => ipcRenderer.invoke("spotify:state"),
  command: (cmd, arg) => ipcRenderer.invoke("spotify:command", cmd, arg),
  initSkins: () => ipcRenderer.invoke("skins:init"),
  skinChosen: (url) => ipcRenderer.invoke("skins:chosen", url),
  onSetSkin: (cb) => ipcRenderer.on("skin:set", (_e, url) => cb(url)),
  onSkinsChanged: (cb) => ipcRenderer.on("skins:changed", (_e, skins) => cb(skins)),
  layout: (w, h) => ipcRenderer.invoke("layout", w, h),
  resizeStart: (edge) => ipcRenderer.invoke("resize:start", edge),
  resizeEnd: () => ipcRenderer.invoke("resize:end"),
  loadShelf: () => ipcRenderer.invoke("shelf:load"),
  saveShelf: (list) => ipcRenderer.invoke("shelf:save", list),
  resolveLinks: (text) => ipcRenderer.invoke("links:resolve", text),
  readClipboard: () => ipcRenderer.invoke("clipboard:read"),
  loadUiPrefs: () => ipcRenderer.invoke("ui:load"),
  saveUiPrefs: (ui) => ipcRenderer.invoke("ui:save", ui),
  close: () => ipcRenderer.invoke("window:close"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
});
