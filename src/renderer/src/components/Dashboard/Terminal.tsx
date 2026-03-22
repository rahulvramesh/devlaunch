import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import { SSHConfig, ConnectionMode, TerminalBackend } from '../../lib/types'

interface TerminalProps {
  terminalId: string
  cwd: string
  scaffoldCommand?: string
  connectionMode: ConnectionMode
  sshConfig?: SSHConfig
  terminalBackend?: TerminalBackend
  tmuxSessionName?: string
}

export default function Terminal({
  terminalId,
  cwd,
  scaffoldCommand,
  connectionMode,
  sshConfig,
  terminalBackend = 'raw',
  tmuxSessionName
}: TerminalProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  useTerminal(containerRef, terminalId, cwd, scaffoldCommand, connectionMode, sshConfig, terminalBackend, tmuxSessionName)

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-1"
      style={{ background: 'var(--dl-terminal-bg, #09090b)', minHeight: 0 }}
    />
  )
}
