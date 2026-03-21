import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import fixPath from 'fix-path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerTerminalIPC } from './ipc/terminal'
import { registerFilesystemIPC } from './ipc/filesystem'
import { registerProjectIPC } from './ipc/project'
import { registerGitIPC } from './ipc/git'
import { registerStoreIPC } from './ipc/store'
import { registerSSHIPC } from './ipc/ssh'
import { registerPortsIPC, stopAllForwards } from './ipc/ports'
import { registerFileWatcherIPC, stopAllWatchers } from './ipc/filewatcher'
import { killAll } from './services/pty-manager'
import { disconnectAll } from './services/ssh-manager'

function createWindow(): void {
  const isLinux = process.platform === 'linux'

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundMaterial: 'acrylic',
    ...(isLinux ? { transparent: false, backgroundColor: '#0a0a0a' } : {}),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  fixPath()
  electronApp.setAppUserModelId('com.devlaunch.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerTerminalIPC()
  registerFilesystemIPC()
  registerProjectIPC()
  registerGitIPC()
  registerStoreIPC()
  registerSSHIPC()
  registerPortsIPC()
  registerFileWatcherIPC()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  killAll()
  disconnectAll()
  stopAllForwards()
  stopAllWatchers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
