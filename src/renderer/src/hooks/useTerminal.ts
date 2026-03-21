import { useEffect, useRef, useCallback, RefObject } from 'react'
import '@xterm/xterm/css/xterm.css'
import { ipc } from '../lib/ipc'
import { SSHConfig, ConnectionMode } from '../lib/types'

export function useTerminal(
  containerRef: RefObject<HTMLDivElement | null>,
  cwd: string,
  initialCommand?: string,
  connectionMode: ConnectionMode = 'local',
  sshConfig?: SSHConfig
): { resize: (cols: number, rows: number) => void } {
  const terminalRef = useRef<any>(null)
  const fitAddonRef = useRef<any>(null)
  const isInitialized = useRef(false)
  const modeRef = useRef(connectionMode)
  modeRef.current = connectionMode

  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return

    let unsubOutput: (() => void) | undefined
    let unsubExit: (() => void) | undefined
    let disposed = false

    async function setup(): Promise<void> {
      try {
        const { Terminal } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')

        if (disposed || !containerRef.current) return

        const fitAddon = new FitAddon()
        fitAddonRef.current = fitAddon

        const term = new Terminal({
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          theme: {
            background: '#09090b',
            foreground: '#e4e4e7',
            cursor: '#e4e4e7',
            selectionBackground: '#3f3f46',
            black: '#18181b',
            red: '#ef4444',
            green: '#22c55e',
            yellow: '#eab308',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#e4e4e7',
            brightBlack: '#52525b',
            brightRed: '#f87171',
            brightGreen: '#4ade80',
            brightYellow: '#facc15',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#fafafa'
          },
          cursorBlink: true,
          scrollback: 5000,
          allowProposedApi: true
        })

        term.loadAddon(fitAddon)
        term.open(containerRef.current!)
        terminalRef.current = term

        try {
          fitAddon.fit()
        } catch {
          // Container may not be visible yet
        }

        const cols = term.cols
        const rows = term.rows

        const isSSH = connectionMode === 'ssh' && sshConfig

        // User types -> main process
        term.onData((data: string) => {
          if (isSSH) {
            ipc.sshShellWrite(data)
          } else {
            ipc.terminalWrite(data)
          }
        })

        // Main process -> terminal display (same channel for both modes)
        unsubOutput = ipc.onTerminalOutput((data: string) => {
          if (!disposed) {
            term.write(data)
          }
        })

        unsubExit = ipc.onTerminalExit((code: number) => {
          if (!disposed) {
            term.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`)
          }
        })

        // Spawn terminal
        if (isSSH) {
          const result = await ipc.sshShellSpawn(sshConfig!, cols, rows)
          if (!result.success) {
            term.write(`\x1b[31mSSH connection failed: ${result.error}\x1b[0m\r\n`)
          }
        } else {
          const spawnCwd = initialCommand ? cwd.substring(0, cwd.lastIndexOf('/')) || cwd : cwd
          await ipc.terminalSpawn(cols, rows, spawnCwd)
        }

        isInitialized.current = true

        // Run scaffold command after shell init
        if (initialCommand) {
          setTimeout(() => {
            if (!disposed) {
              if (isSSH) {
                // For SSH, cd to parent dir then run command
                const parentDir = cwd.substring(0, cwd.lastIndexOf('/')) || cwd
                ipc.sshShellWrite(`cd ${parentDir} && ${initialCommand}\r`)
              } else {
                ipc.terminalWrite(initialCommand + '\r')
              }
            }
          }, 500)
        }

        // Resize observer
        const observer = new ResizeObserver(() => {
          try {
            fitAddon.fit()
            if (term.cols && term.rows) {
              if (modeRef.current === 'ssh') {
                ipc.sshShellResize(term.cols, term.rows)
              } else {
                ipc.terminalResize(term.cols, term.rows)
              }
            }
          } catch {
            // ignore resize errors during transitions
          }
        })
        observer.observe(containerRef.current!)
        ;(containerRef.current as any).__resizeObserver = observer
      } catch (err) {
        console.error('Failed to initialize terminal:', err)
      }
    }

    setup()

    return () => {
      disposed = true
      isInitialized.current = false
      unsubOutput?.()
      unsubExit?.()

      if (connectionMode === 'ssh') {
        ipc.sshShellKill()
      } else {
        ipc.terminalKill()
      }

      if (containerRef.current) {
        const observer = (containerRef.current as any).__resizeObserver
        if (observer) observer.disconnect()
      }

      terminalRef.current?.dispose?.()
      terminalRef.current = null
    }
  }, [cwd, initialCommand, connectionMode])

  const resize = useCallback((cols: number, rows: number) => {
    terminalRef.current?.resize?.(cols, rows)
    if (modeRef.current === 'ssh') {
      ipc.sshShellResize(cols, rows)
    } else {
      ipc.terminalResize(cols, rows)
    }
  }, [])

  return { resize }
}
