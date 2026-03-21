import { ipcMain, BrowserWindow } from 'electron'
import { watchLocal, watchRemote, stopAllWatchers } from '../services/file-watcher'
import { getConnection } from '../services/ssh-manager'

function safeSend(window: BrowserWindow | null, channel: string, data: unknown): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  } catch {
    // Window destroyed
  }
}

export function registerFileWatcherIPC(): void {
  ipcMain.handle(
    'filewatcher:start',
    async (
      event,
      options: { rootPath: string; isSSH: boolean; sshConnectionId?: string; interval?: number }
    ) => {
      const window = BrowserWindow.fromWebContents(event.sender)

      if (options.isSSH && options.sshConnectionId) {
        const client = getConnection(options.sshConnectionId)
        if (!client) return

        watchRemote(client, options.rootPath, (options.interval || 5) * 1000, () => {
          safeSend(window, 'filewatcher:changed', { rootPath: options.rootPath })
        })
      } else {
        watchLocal(options.rootPath, (eventType, path) => {
          safeSend(window, 'filewatcher:changed', { event: eventType, path, rootPath: options.rootPath })
        })
      }
    }
  )

  ipcMain.handle('filewatcher:stop', async () => {
    stopAllWatchers()
  })
}

export { stopAllWatchers }
