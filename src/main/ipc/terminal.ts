import { ipcMain, BrowserWindow } from 'electron'
import { createPty, writeToPty, resizePty, killPty } from '../services/pty-manager'

function safeSend(window: BrowserWindow | null, channel: string, ...args: unknown[]): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, ...args)
    }
  } catch {
    // Window was destroyed between check and send
  }
}

export function registerTerminalIPC(): void {
  ipcMain.handle(
    'terminal:spawn',
    async (event, terminalId: string, cols: number, rows: number, cwd?: string) => {
      const term = createPty(terminalId, cols, rows, cwd)
      const window = BrowserWindow.fromWebContents(event.sender)

      term.onData((data) => {
        safeSend(window, 'terminal:output', terminalId, data)
      })

      term.onExit(({ exitCode }) => {
        safeSend(window, 'terminal:exit', terminalId, exitCode)
      })
    }
  )

  ipcMain.on('terminal:data', (_event, terminalId: string, data: string) => {
    writeToPty(terminalId, data)
  })

  ipcMain.on('terminal:resize', (_event, terminalId: string, cols: number, rows: number) => {
    resizePty(terminalId, cols, rows)
  })

  ipcMain.on('terminal:kill', (_event, terminalId: string) => {
    killPty(terminalId)
  })
}
