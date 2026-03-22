import { ipcMain, BrowserWindow } from 'electron'
import {
  isTmuxAvailable,
  listSessions,
  createSession,
  createWindow,
  sendKeys,
  resizePane,
  killWindow,
  killSession,
  detachSession,
  detachAllSessions,
  capturePane,
  mapTerminalToWindow
} from '../services/tmux-manager'
import { SSHConnectionConfig } from '../services/ssh-manager'

function safeSend(window: BrowserWindow | null, channel: string, ...args: unknown[]): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, ...args)
    }
  } catch {
    // Window was destroyed between check and send
  }
}

export function registerTmuxIPC(): void {
  // Check if tmux is available
  ipcMain.handle(
    'tmux:available',
    async (_event, transport: 'local' | 'ssh', sshConfig?: SSHConnectionConfig) => {
      return isTmuxAvailable(transport, sshConfig)
    }
  )

  // List existing DevLaunch tmux sessions
  ipcMain.handle(
    'tmux:list-sessions',
    async (_event, transport: 'local' | 'ssh', sshConfig?: SSHConnectionConfig) => {
      return listSessions(transport, sshConfig)
    }
  )

  // Create or attach to a tmux session
  ipcMain.handle(
    'tmux:spawn',
    async (
      event,
      opts: {
        terminalId: string
        sessionName: string
        projectPath: string
        transport: 'local' | 'ssh'
        sshConfig?: SSHConnectionConfig
        windowName?: string
        attachExisting?: boolean
      }
    ) => {
      const window = BrowserWindow.fromWebContents(event.sender)

      return createSession({
        sessionName: opts.sessionName,
        projectPath: opts.projectPath,
        transport: opts.transport,
        sshConfig: opts.sshConfig,
        initialTerminalId: opts.terminalId,
        onOutput: (terminalId, data) => {
          safeSend(window, 'terminal:output', terminalId, data)
        },
        onWindowAdd: (windowId) => {
          safeSend(window, 'tmux:window-event', {
            type: 'add',
            sessionName: opts.sessionName,
            windowId
          })
        },
        onWindowClose: (windowId) => {
          safeSend(window, 'tmux:window-event', {
            type: 'close',
            sessionName: opts.sessionName,
            windowId
          })
        },
        onWindowRenamed: (windowId, name) => {
          safeSend(window, 'tmux:window-event', {
            type: 'renamed',
            sessionName: opts.sessionName,
            windowId,
            name
          })
        },
        onExit: (reason) => {
          safeSend(window, 'tmux:session-error', {
            sessionName: opts.sessionName,
            reason
          })
        }
      })
    }
  )

  // Create a new window in an existing session (new tab)
  ipcMain.handle(
    'tmux:new-window',
    async (_event, sessionName: string, terminalId: string, windowName?: string) => {
      return createWindow(sessionName, terminalId, windowName)
    }
  )

  // Map a terminalId to an existing tmux pane (for session restore)
  ipcMain.on('tmux:map-terminal', (_event, sessionName: string, terminalId: string, paneId: string) => {
    mapTerminalToWindow(sessionName, terminalId, paneId)
  })

  // User keystroke input
  ipcMain.on('tmux:data', (_event, sessionName: string, terminalId: string, data: string) => {
    sendKeys(sessionName, terminalId, data)
  })

  // Resize terminal
  ipcMain.on('tmux:resize', (_event, sessionName: string, terminalId: string, cols: number, rows: number) => {
    resizePane(sessionName, terminalId, cols, rows)
  })

  // Kill a window (permanent close)
  ipcMain.on('tmux:kill-window', (_event, sessionName: string, terminalId: string) => {
    killWindow(sessionName, terminalId)
  })

  // Detach session (keep alive for restore)
  ipcMain.handle('tmux:detach-session', async (_event, sessionName: string) => {
    detachSession(sessionName)
  })

  // Kill entire session
  ipcMain.handle('tmux:kill-session', async (_event, sessionName: string) => {
    await killSession(sessionName)
  })

  // Capture pane scrollback
  ipcMain.handle(
    'tmux:capture-pane',
    async (_event, sessionName: string, terminalId: string, lines?: number) => {
      return capturePane(sessionName, terminalId, lines)
    }
  )
}

export { detachAllSessions as detachAllTmuxSessions }
