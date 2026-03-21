import { ipcMain, BrowserWindow } from 'electron'
import { createPty, writeToPty, resizePty, killPty } from '../services/pty-manager'

const DEFAULT_PTY_ID = 'default'

function safeSend(window: BrowserWindow | null, channel: string, data: any): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  } catch {
    // Window was destroyed between check and send
  }
}

export function registerTerminalIPC(): void {
  ipcMain.handle('terminal:spawn', async (event, cols: number, rows: number, cwd?: string) => {
    // Kill existing PTY first (cleans up old listeners)
    killPty(DEFAULT_PTY_ID)

    const term = createPty(DEFAULT_PTY_ID, cols, rows, cwd)
    const window = BrowserWindow.fromWebContents(event.sender)

    term.onData((data) => {
      safeSend(window, 'terminal:output', data)
    })

    term.onExit(({ exitCode }) => {
      safeSend(window, 'terminal:exit', exitCode)
    })
  })

  ipcMain.on('terminal:data', (_event, data: string) => {
    writeToPty(DEFAULT_PTY_ID, data)
  })

  ipcMain.on('terminal:resize', (_event, cols: number, rows: number) => {
    resizePty(DEFAULT_PTY_ID, cols, rows)
  })

  ipcMain.on('terminal:kill', () => {
    killPty(DEFAULT_PTY_ID)
  })
}
