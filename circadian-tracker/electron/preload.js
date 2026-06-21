const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setAutoStart: (enable) => ipcRenderer.send('set-auto-start', enable),
  getSystemTheme: () => ipcRenderer.sendSync('get-theme'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
  testReminder: (type) => ipcRenderer.invoke('test-reminder', type),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', (e, route) => callback(route)),
  onExportPdf: (callback) => ipcRenderer.on('export-pdf', () => callback()),
  onThemeChange: (callback) => {
    ipcRenderer.on('native-theme-updated', () => callback())
  }
})
