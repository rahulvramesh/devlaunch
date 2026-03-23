import { useEffect, useRef, useCallback, RefObject } from 'react'
import '@xterm/xterm/css/xterm.css'
import { ipc } from '../lib/ipc'
import { SSHConfig, ConnectionMode, TerminalBackend } from '../lib/types'

export function useTerminal(
  containerRef: RefObject<HTMLDivElement | null>,
  terminalId: string,
  cwd: string,
  initialCommand?: string,
  connectionMode: ConnectionMode = 'local',
  sshConfig?: SSHConfig,
  terminalBackend: TerminalBackend = 'raw',
  tmuxSessionName?: string
): { resize: (cols: number, rows: number) => void } {
  const terminalRef = useRef<any>(null)
  const fitAddonRef = useRef<any>(null)
  const isInitialized = useRef(false)
  const modeRef = useRef(connectionMode)
  modeRef.current = connectionMode
  const backendRef = useRef(terminalBackend)
  backendRef.current = terminalBackend
  const sessionRef = useRef(tmuxSessionName)
  sessionRef.current = tmuxSessionName
  const idRef = useRef(terminalId)
  idRef.current = terminalId

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
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
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
        const isTmux = terminalBackend === 'tmux' && tmuxSessionName

        // User types -> main process (routed by terminal ID)
        term.onData((data: string) => {
          if (isTmux) {
            ipc.tmuxWrite(sessionRef.current!, idRef.current, data)
          } else if (isSSH) {
            ipc.sshShellWrite(terminalId, data)
          } else {
            ipc.terminalWrite(terminalId, data)
          }
        })

        // Main process -> terminal display (filtered by terminal ID)
        unsubOutput = ipc.onTerminalOutput((id: string, data: string) => {
          if (!disposed && id === idRef.current) {
            term.write(data)
          }
        })

        unsubExit = ipc.onTerminalExit((id: string, code: number) => {
          if (!disposed && id === idRef.current) {
            term.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`)
          }
        })

        // Spawn terminal
        if (isTmux) {
          const result = await ipc.tmuxSpawn({
            terminalId,
            sessionName: tmuxSessionName!,
            projectPath: cwd,
            transport: isSSH ? 'ssh' : 'local',
            sshConfig: isSSH ? sshConfig : undefined
          })
          if (!result.success) {
            term.write(`\x1b[31mtmux session failed: ${result.error}\x1b[0m\r\n`)
          }
        } else if (isSSH) {
          const result = await ipc.sshShellSpawn(terminalId, sshConfig!, cols, rows, cwd)
          if (!result.success) {
            term.write(`\x1b[31mSSH connection failed: ${result.error}\x1b[0m\r\n`)
          }
        } else {
          const sep = cwd.includes('\\') ? '\\' : '/'
          const spawnCwd = initialCommand ? cwd.substring(0, cwd.lastIndexOf(sep)) || cwd : cwd
          await ipc.terminalSpawn(terminalId, cols, rows, spawnCwd)
        }

        isInitialized.current = true

        // Run scaffold command after shell init
        if (initialCommand) {
          setTimeout(() => {
            if (!disposed) {
              if (isSSH) {
                ipc.sshShellWrite(terminalId, `${initialCommand}\r`)
              } else {
                ipc.terminalWrite(terminalId, initialCommand + '\r')
              }
            }
          }, 500)
        }

        // Resize observer
        const observer = new ResizeObserver(() => {
          try {
            fitAddon.fit()
            if (term.cols && term.rows) {
              if (backendRef.current === 'tmux' && sessionRef.current) {
                ipc.tmuxResize(sessionRef.current, idRef.current, term.cols, term.rows)
              } else if (modeRef.current === 'ssh') {
                ipc.sshShellResize(idRef.current, term.cols, term.rows)
              } else {
                ipc.terminalResize(idRef.current, term.cols, term.rows)
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

      if (backendRef.current === 'tmux' && sessionRef.current) {
        ipc.tmuxKillWindow(sessionRef.current, terminalId)
      } else if (connectionMode === 'ssh') {
        ipc.sshShellKill(terminalId)
      } else {
        ipc.terminalKill(terminalId)
      }

      if (containerRef.current) {
        const observer = (containerRef.current as any).__resizeObserver
        if (observer) observer.disconnect()
      }

      terminalRef.current?.dispose?.()
      terminalRef.current = null
    }
  }, [terminalId])

  const resize = useCallback((cols: number, rows: number) => {
    terminalRef.current?.resize?.(cols, rows)
    if (backendRef.current === 'tmux' && sessionRef.current) {
      ipc.tmuxResize(sessionRef.current, idRef.current, cols, rows)
    } else if (modeRef.current === 'ssh') {
      ipc.sshShellResize(idRef.current, cols, rows)
    } else {
      ipc.terminalResize(idRef.current, cols, rows)
    }
  }, [])

  return { resize }
}
