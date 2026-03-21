import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import { SSHConfig, ConnectionMode } from '../../lib/types'

interface TerminalProps {
  cwd: string
  scaffoldCommand?: string
  connectionMode: ConnectionMode
  sshConfig?: SSHConfig
}

export default function Terminal({
  cwd,
  scaffoldCommand,
  connectionMode,
  sshConfig
}: TerminalProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  useTerminal(containerRef, cwd, scaffoldCommand, connectionMode, sshConfig)

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#09090b] p-1"
      style={{ minHeight: 0 }}
    />
  )
}
