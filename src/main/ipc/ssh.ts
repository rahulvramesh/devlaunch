import { ipcMain, BrowserWindow } from 'electron'
import { ClientChannel } from 'ssh2'
import {
  SSHConnectionConfig,
  testConnection,
  connect,
  disconnect,
  createShellStream,
  getSFTP
} from '../services/ssh-manager'

let activeShellStream: ClientChannel | null = null

function safeSend(window: BrowserWindow | null, channel: string, data: unknown): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  } catch {
    // Window was destroyed between check and send
  }
}

export function registerSSHIPC(): void {
  ipcMain.handle('ssh:test', async (_event, config: SSHConnectionConfig) => {
    return testConnection(config)
  })

  ipcMain.handle('ssh:connect', async (_event, config: SSHConnectionConfig) => {
    try {
      await connect(config)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('ssh:disconnect', async (_event, id: string) => {
    disconnect(id)
  })

  ipcMain.handle(
    'ssh:shell:spawn',
    async (event, config: SSHConnectionConfig, cols: number, rows: number) => {
      const window = BrowserWindow.fromWebContents(event.sender)

      try {
        // Kill any existing shell stream
        if (activeShellStream) {
          activeShellStream.close()
          activeShellStream = null
        }

        const client = await connect(config)
        const stream = await createShellStream(client, cols, rows)
        activeShellStream = stream as ClientChannel

        stream.on('data', (data: Buffer) => {
          safeSend(window, 'terminal:output', data.toString())
        })

        stream.on('close', () => {
          activeShellStream = null
          safeSend(window, 'terminal:exit', 0)
        })

        stream.on('error', () => {
          activeShellStream = null
        })

        stream.stderr.on('data', (data: Buffer) => {
          safeSend(window, 'terminal:output', data.toString())
        })

        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.on('ssh:shell:data', (_event, data: string) => {
    if (activeShellStream) {
      activeShellStream.write(data)
    }
  })

  ipcMain.on('ssh:shell:resize', (_event, cols: number, rows: number) => {
    if (activeShellStream) {
      activeShellStream.setWindow(rows, cols, 0, 0)
    }
  })

  ipcMain.on('ssh:shell:kill', () => {
    if (activeShellStream) {
      activeShellStream.close()
      activeShellStream = null
    }
  })

  // SFTP operations with timeout protection
  ipcMain.handle('ssh:readdir', async (_event, config: SSHConnectionConfig, dirPath: string) => {
    try {
      const client = await connect(config)
      const sftp = await getSFTP(client)

      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SFTP readdir timed out')), 15000)

        sftp.readdir(dirPath, (err, list) => {
          clearTimeout(timeout)
          if (err) {
            reject(err)
            return
          }

          const entries = list
            .filter((item) => !item.filename.startsWith('.'))
            .map((item) => ({
              name: item.filename,
              path: dirPath === '/' ? `/${item.filename}` : `${dirPath}/${item.filename}`,
              isDirectory: (item.attrs.mode! & 0o40000) !== 0,
              isFile: (item.attrs.mode! & 0o100000) !== 0
            }))
            .sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1
              if (!a.isDirectory && b.isDirectory) return 1
              return a.name.localeCompare(b.name)
            })

          resolve(entries)
        })
      })
    } catch (err) {
      throw new Error(`SFTP readdir failed: ${err}`)
    }
  })

  ipcMain.handle('ssh:mkdir', async (_event, config: SSHConnectionConfig, dirPath: string) => {
    try {
      const client = await connect(config)
      const sftp = await getSFTP(client)

      return await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SFTP mkdir timed out')), 15000)
        sftp.mkdir(dirPath, (err) => {
          clearTimeout(timeout)
          if (err) reject(err)
          else resolve()
        })
      })
    } catch (err) {
      throw new Error(`SFTP mkdir failed: ${err}`)
    }
  })

  ipcMain.handle('ssh:stat', async (_event, config: SSHConnectionConfig, remotePath: string) => {
    try {
      const client = await connect(config)
      const sftp = await getSFTP(client)

      return await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 10000)
        sftp.stat(remotePath, (err, stats) => {
          clearTimeout(timeout)
          if (err) resolve(null)
          else resolve({ isDirectory: stats.isDirectory() })
        })
      })
    } catch {
      return null
    }
  })
}
