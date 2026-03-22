import { useState, useEffect, useRef, useCallback } from 'react'
import { ipc } from '../lib/ipc'
import { ConnectionMode } from '../lib/types'

interface DetectedPort {
  port: number
  pid?: number
  process?: string
}

interface ForwardedPort {
  remotePort: number
  localPort: number
}

export function usePorts(connectionMode: ConnectionMode, sshConnectionId?: string) {
  const [ports, setPorts] = useState<DetectedPort[]>([])
  const [newPorts, setNewPorts] = useState<DetectedPort[]>([])
  const [forwardedPorts, setForwardedPorts] = useState<ForwardedPort[]>([])
  const dismissedRef = useRef(new Set<number>())

  useEffect(() => {
    const unsub = ipc.onPortsChanged((data) => {
      setPorts(data.ports)
      // Only show notification for ports not yet dismissed
      const genuinelyNew = data.newPorts.filter(
        (p: DetectedPort) => !dismissedRef.current.has(p.port)
      )
      if (genuinelyNew.length > 0) {
        setNewPorts(genuinelyNew)
      }
    })

    ipc.startPortScanning({
      isSSH: connectionMode === 'ssh',
      sshConnectionId,
      interval: 3
    })

    return () => {
      unsub()
      ipc.stopPortScanning()
    }
  }, [connectionMode, sshConnectionId])

  const forwardPort = useCallback(
    async (remotePort: number) => {
      if (!sshConnectionId) return
      const result = await ipc.forwardPort(sshConnectionId, remotePort)
      if (result.success && result.localPort) {
        setForwardedPorts((prev) => [
          ...prev,
          { remotePort, localPort: result.localPort! }
        ])
      }
      return result
    },
    [sshConnectionId]
  )

  const openInBrowser = useCallback((port: number) => {
    ipc.openInBrowser(port)
  }, [])

  const unforwardPort = useCallback(async (remotePort: number) => {
    await ipc.unforwardPort(remotePort)
    setForwardedPorts((prev) => prev.filter((f) => f.remotePort !== remotePort))
  }, [])

  const dismissPort = useCallback((port: number) => {
    dismissedRef.current.add(port)
    setNewPorts((prev) => prev.filter((p) => p.port !== port))
  }, [])

  return { ports, newPorts, forwardedPorts, forwardPort, unforwardPort, openInBrowser, dismissPort }
}
