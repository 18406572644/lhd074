const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeTheme, Notification } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let tray = null

const DEFAULT_SETTINGS = {
  bedtimeReminder: {
    enabled: true,
    time: '23:00'
  },
  lateNightReminder: {
    enabled: true,
    startTime: '01:00'
  },
  wakeUpReminder: {
    enabled: false,
    time: '07:00'
  },
  dailyEntryReminder: {
    enabled: true,
    time: '22:30'
  },
  autoStart: true
}

let settings = deepClone(DEFAULT_SETTINGS)
const triggeredReminders = new Set()

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function isValidTimeFormat(str) {
  if (typeof str !== 'string') return false
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str)
}

function validateSettings(input) {
  const errors = []
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['设置数据格式错误'] }
  }

  const checkReminder = (key, timeField) => {
    if (input[key] !== undefined) {
      const r = input[key]
      if (typeof r !== 'object') {
        errors.push(`${key} 格式错误`)
        return
      }
      if (r.enabled !== undefined && typeof r.enabled !== 'boolean') {
        errors.push(`${key}.enabled 必须是布尔值`)
      }
      if (r.enabled && r[timeField] !== undefined && !isValidTimeFormat(r[timeField])) {
        errors.push(`${key}.${timeField} 格式错误，应为 HH:mm`)
      }
    }
  }

  checkReminder('bedtimeReminder', 'time')
  checkReminder('lateNightReminder', 'startTime')
  checkReminder('wakeUpReminder', 'time')
  checkReminder('dailyEntryReminder', 'time')

  if (input.autoStart !== undefined && typeof input.autoStart !== 'boolean') {
    errors.push('autoStart 必须是布尔值')
  }

  return { valid: errors.length === 0, errors }
}

function mergeSettings(current, input) {
  const merged = deepClone(current)

  const mergeReminder = (key, timeField) => {
    if (input[key] && typeof input[key] === 'object') {
      merged[key] = { ...merged[key] }
      if (input[key].enabled !== undefined) merged[key].enabled = Boolean(input[key].enabled)
      if (input[key][timeField] !== undefined && isValidTimeFormat(input[key][timeField])) {
        merged[key][timeField] = input[key][timeField]
      }
    }
  }

  mergeReminder('bedtimeReminder', 'time')
  mergeReminder('lateNightReminder', 'startTime')
  mergeReminder('wakeUpReminder', 'time')
  mergeReminder('dailyEntryReminder', 'time')

  if (input.autoStart !== undefined) {
    merged.autoStart = Boolean(input.autoStart)
  }

  return merged
}

function loadSettings() {
  try {
    const settingsPath = getSettingsPath()
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      const parsed = JSON.parse(raw)
      settings = mergeSettings(DEFAULT_SETTINGS, parsed)
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
    settings = deepClone(DEFAULT_SETTINGS)
  }
}

function saveSettingsToDisk() {
  try {
    const settingsPath = getSettingsPath()
    ensureDirExists(settingsPath)
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save settings:', err)
    return false
  }
}

function parseTime(timeStr) {
  if (!isValidTimeFormat(timeStr)) {
    return { hour: -1, minute: -1, valid: false }
  }
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h, minute: m, valid: true }
}

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

function checkReminders() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const todayKey = getTodayKey()

  if (settings.bedtimeReminder.enabled) {
    const t = parseTime(settings.bedtimeReminder.time)
    if (t.valid) {
      const key = `bedtime-${todayKey}`
      if (currentHour === t.hour && currentMinute >= t.minute && currentMinute < t.minute + 5 && !triggeredReminders.has(key)) {
        new Notification({
          title: '就寝提醒',
          body: `已到${settings.bedtimeReminder.time}，建议您尽快准备休息。`,
          icon: path.join(__dirname, 'icon.png')
        }).show()
        triggeredReminders.add(key)
      }
    }
  }

  if (settings.lateNightReminder.enabled) {
    const t = parseTime(settings.lateNightReminder.startTime)
    if (t.valid) {
      const endHour = 5
      if (currentHour >= t.hour && currentHour < endHour) {
        const key = `latenight-${todayKey}-${currentHour}`
        if (!triggeredReminders.has(key)) {
          new Notification({
            title: '作息异常提醒',
            body: `当前已过凌晨${t.hour}点，您仍未休息，请注意作息健康！`,
            icon: path.join(__dirname, 'icon.png')
          }).show()
          triggeredReminders.add(key)
        }
      }
    }
  }

  if (settings.wakeUpReminder.enabled) {
    const t = parseTime(settings.wakeUpReminder.time)
    if (t.valid) {
      const key = `wakeup-${todayKey}`
      if (currentHour === t.hour && currentMinute >= t.minute && currentMinute < t.minute + 5 && !triggeredReminders.has(key)) {
        new Notification({
          title: '起床打卡提醒',
          body: `已到目标起床时间${settings.wakeUpReminder.time}，新的一天开始啦！记得完成作息打卡哦。`,
          icon: path.join(__dirname, 'icon.png')
        }).show()
        triggeredReminders.add(key)
      }
    }
  }

  if (settings.dailyEntryReminder.enabled) {
    const t = parseTime(settings.dailyEntryReminder.time)
    if (t.valid) {
      const key = `dailyentry-${todayKey}`
      if (currentHour === t.hour && currentMinute >= t.minute && currentMinute < t.minute + 5 && !triggeredReminders.has(key)) {
        new Notification({
          title: '每日录入提醒',
          body: `已到${settings.dailyEntryReminder.time}，请记得完成今日作息数据录入。`,
          icon: path.join(__dirname, 'icon.png')
        }).show()
        triggeredReminders.add(key)
      }
    }
  }

  if (now.getHours() === 0 && now.getMinutes() < 5) {
    triggeredReminders.clear()
  }
}

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

app.whenReady().then(() => {
  loadSettings()
  createWindow()
  createTray()
  registerShortcuts()

  setInterval(checkReminders, 60000)
  setTimeout(checkReminders, 5000)

  app.setLoginItemSettings({ openAtLogin: settings.autoStart })
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
ipcMain.handle('get-settings', () => {
  return deepClone(settings)
})
ipcMain.handle('set-settings', async (_e, newSettings) => {
  const validation = validateSettings(newSettings)
  if (!validation.valid) {
    return { success: false, message: '校验失败：' + validation.errors.join('；') }
  }
  try {
    settings = mergeSettings(settings, newSettings)
    const saved = saveSettingsToDisk()
    if (!saved) {
      return { success: false, message: '写入配置文件失败' }
    }
    app.setLoginItemSettings({ openAtLogin: settings.autoStart })
    return { success: true, data: deepClone(settings) }
  } catch (err) {
    console.error('set-settings error:', err)
    return { success: false, message: err.message || '未知错误' }
  }
})
ipcMain.handle('test-reminder', async (_e, reminderType) => {
  const icon = path.join(__dirname, 'icon.png')
  const map = {
    bedtime: { title: '就寝提醒', body: `已到${settings.bedtimeReminder.time}，建议您尽快准备休息。` },
    lateNight: { title: '作息异常提醒', body: `当前已过凌晨，您仍未休息，请注意作息健康！` },
    wakeUp: { title: '起床打卡提醒', body: `已到目标起床时间${settings.wakeUpReminder.time}，新的一天开始啦！记得完成作息打卡哦。` },
    dailyEntry: { title: '每日录入提醒', body: `已到${settings.dailyEntryReminder.time}，请记得完成今日作息数据录入。` }
  }
  const n = map[reminderType]
  if (n) {
    new Notification({ title: n.title, body: n.body, icon }).show()
    return { success: true }
  }
  return { success: false, message: '未知提醒类型' }
})
