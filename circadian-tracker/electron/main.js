const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeTheme, Notification } = require('electron')
const path = require('path')

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    transparent: false,
    backgroundColor: '#f0f5fa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主界面', click: () => { if (mainWindow) mainWindow.show() } },
    { label: '录入今日作息', click: () => { if (mainWindow) { mainWindow.show(), mainWindow.webContents.send('navigate-to', '/input') } } },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true, app.quit() } }
  ])
  tray.setToolTip('作息节律追踪')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { if (mainWindow) mainWindow.show() })
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) { mainWindow.show(), mainWindow.webContents.send('navigate-to', '/input') }
  })
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow) { mainWindow.show(), mainWindow.webContents.send('navigate-to', '/') }
  })
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) { mainWindow.show(), mainWindow.webContents.send('navigate-to', '/calendar') }
  })
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) { mainWindow.show(), mainWindow.webContents.send('navigate-to', '/sleep') }
  })
  globalShortcut.register('CommandOrControl+Shift+E', () => {
    if (mainWindow) mainWindow.webContents.send('export-pdf')
  })
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    if (mainWindow) mainWindow.close()
  })
}

function checkAbnormalSchedule() {
  const now = new Date()
  const hour = now.getHours()
  if (hour >= 1 && hour <= 4) {
    new Notification({
      title: '作息异常提醒',
      body: '当前已过凌晨1点，您仍未休息，请注意作息健康！',
      icon: path.join(__dirname, 'icon.png')
    }).show()
  }
  if (hour >= 23) {
    new Notification({
      title: '就寝提醒',
      body: '已到晚间11点，建议您尽快准备休息。',
      icon: path.join(__dirname, 'icon.png')
    }).show()
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerShortcuts()

  setInterval(checkAbnormalSchedule, 3600000)
  setTimeout(checkAbnormalSchedule, 5000)

  app.setLoginItemSettings({ openAtLogin: true })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize() })
ipcMain.on('window-maximize', () => { if (mainWindow) { mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize() } })
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close() })
ipcMain.on('set-auto-start', (e, enable) => { app.setLoginItemSettings({ openAtLogin: enable }) })
ipcMain.on('get-theme', (e) => { e.returnValue = nativeTheme.shouldUseDarkColors ? 'dark' : 'light' })
ipcMain.on('show-notification', (e, title, body) => {
  new Notification({ title, body, icon: path.join(__dirname, 'icon.png') }).show()
})
