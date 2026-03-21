import { ipcMain, BrowserWindow, shell } from 'electron'
import { scanLocalPorts, scanRemotePorts, createLocalForward, DetectedPort } from '../services/port-scanner'
import { getConnection } from '../services/ssh-manager'

interface ForwardedPort {
  remotePort: number
  localPort: number
  close: () => void
}

const forwardedPorts = new Map<number, ForwardedPort>()
let scanInterval: ReturnType<typeof setInterval> | null = null
let lastKnownPorts = new Set<number>()

function safeSend(window: BrowserWindow | null, channel: string, data: unknown): void {
  try {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  } catch {
    // Window destroyed
  }
}

export function registerPortsIPC(): void {
  // Start scanning for ports
  ipcMain.handle(
    'ports:startScanning',
    async (event, options: { isSSH: boolean; sshConnectionId?: string; interval?: number }) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      const intervalMs = (options.interval || 3) * 1000

      // Stop any existing scan
      if (scanInterval) {
        clearInterval(scanInterval)
      }

      lastKnownPorts = new Set<number>()

      async function scan(): Promise<void> {
        let ports: DetectedPort[]

        if (options.isSSH && options.sshConnectionId) {
          const client = getConnection(options.sshConnectionId)
          if (!client) return
          ports = await scanRemotePorts(client)
        } else {
          ports = scanLocalPorts()
        }

        const currentPorts = new Set(ports.map((p) => p.port))

        // Find newly opened ports
        const newPorts = ports.filter((p) => !lastKnownPorts.has(p.port))

        // Find closed ports
        const closedPorts = [...lastKnownPorts].filter((p) => !currentPorts.has(p))

        if (newPorts.length > 0 || closedPorts.length > 0) {
          safeSend(window, 'ports:changed', {
            ports,
            newPorts,
            closedPorts
          })
        }

        lastKnownPorts = currentPorts
      }

      // Initial scan
      await scan()

      // Periodic scan
      scanInterval = setInterval(scan, intervalMs)
    }
  )

  ipcMain.handle('ports:stopScanning', async () => {
    if (scanInterval) {
      clearInterval(scanInterval)
      scanInterval = null
    }
  })

  // Forward a remote port locally (SSH only)
  ipcMain.handle(
    'ports:forward',
    async (_event, sshConnectionId: string, remotePort: number) => {
      // Check if already forwarded
      if (forwardedPorts.has(remotePort)) {
        return { success: true, localPort: forwardedPorts.get(remotePort)!.localPort }
      }

      const client = getConnection(sshConnectionId)
      if (!client) {
        return { success: false, error: 'SSH connection not found' }
      }

      try {
        const { localPort, close } = await createLocalForward(client, remotePort)
        forwardedPorts.set(remotePort, { remotePort, localPort, close })
        return { success: true, localPort }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  // Stop forwarding a port
  ipcMain.handle('ports:unforward', async (_event, remotePort: number) => {
    const fwd = forwardedPorts.get(remotePort)
    if (fwd) {
      fwd.close()
      forwardedPorts.delete(remotePort)
    }
  })

  // Get all forwarded ports
  ipcMain.handle('ports:getForwarded', async () => {
    return [...forwardedPorts.values()].map((f) => ({
      remotePort: f.remotePort,
      localPort: f.localPort
    }))
  })

  // Open a port in the default browser
  ipcMain.handle('ports:openInBrowser', async (_event, port: number) => {
    shell.openExternal(`http://localhost:${port}`)
  })
}

export function stopAllForwards(): void {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  for (const [, fwd] of forwardedPorts) {
    fwd.close()
  }
  forwardedPorts.clear()
}
