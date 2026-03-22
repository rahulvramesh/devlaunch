import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
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
import { registerTmuxIPC, detachAllTmuxSessions } from './ipc/tmux'
import { killAll } from './services/pty-manager'
import { disconnectAll } from './services/ssh-manager'

let mainWindow: BrowserWindow | null = null

function sendToRenderer(channel: string, ...args: unknown[]): void {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args)
    }
  } catch {
    // Window gone
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
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

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('updater:status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('updater:status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('updater:status', { status: 'up-to-date' })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('updater:status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('updater:status', {
      status: 'ready',
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    sendToRenderer('updater:status', {
      status: 'error',
      error: err.message
    })
  })

  // IPC handlers for renderer to control updates
  ipcMain.handle('updater:check', async () => {
    return autoUpdater.checkForUpdates()
  })

  ipcMain.handle('updater:download', async () => {
    return autoUpdater.downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  ipcMain.handle('updater:getVersion', () => {
    return app.getVersion()
  })

  // Check on startup
  autoUpdater.checkForUpdates()
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
  registerTmuxIPC()

  createWindow()

  if (!is.dev) {
    setupAutoUpdater()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  detachAllTmuxSessions()
  killAll()
  disconnectAll()
  stopAllForwards()
  stopAllWatchers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
