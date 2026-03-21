import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import { SSHConfig, ConnectionMode } from '../../lib/types'

interface TerminalProps {
  terminalId: string
  cwd: string
  scaffoldCommand?: string
  connectionMode: ConnectionMode
  sshConfig?: SSHConfig
}

export default function Terminal({
  terminalId,
  cwd,
  scaffoldCommand,
  connectionMode,
  sshConfig
}: TerminalProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  useTerminal(containerRef, terminalId, cwd, scaffoldCommand, connectionMode, sshConfig)

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-1"
      style={{ background: 'var(--dl-terminal-bg, #09090b)', minHeight: 0 }}
    />
  )
}
