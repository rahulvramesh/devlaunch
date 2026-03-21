import { Globe, ExternalLink, X, ArrowRightLeft } from 'lucide-react'
import { ConnectionMode } from '../../lib/types'

interface DetectedPort {
  port: number
  process?: string
}

interface PortNotificationProps {
  newPorts: DetectedPort[]
  connectionMode: ConnectionMode
  onOpen: (port: number) => void
  onForward: (port: number) => void
  onDismiss: (port: number) => void
}

export default function PortNotification({
  newPorts,
  connectionMode,
  onOpen,
  onForward,
  onDismiss
}: PortNotificationProps): JSX.Element | null {
  if (newPorts.length === 0) return null

  return (
    <div className="absolute bottom-8 right-4 flex flex-col gap-2 z-40 max-w-xs">
      {newPorts.map((port) => (
        <div key={port.port}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md border shadow-xl text-sm"
          style={{ background: 'var(--dl-card-bg)', borderColor: 'var(--dl-border)' }}>
          <Globe className="w-4 h-4 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs" style={{ color: 'var(--dl-text)' }}>
              Port <span className="font-mono text-green-400">{port.port}</span>
            </div>
            {port.process && (
              <div className="text-[10px] font-mono truncate" style={{ color: 'var(--dl-text-muted)' }}>
                {port.process}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {connectionMode === 'ssh' && (
              <button onClick={() => onForward(port.port)}
                className="p-1 rounded text-blue-400 transition-colors hover:bg-[var(--dl-bg-hover)]" title="Forward">
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            )}
            <button onClick={() => onOpen(port.port)}
              className="p-1 rounded text-green-400 transition-colors hover:bg-[var(--dl-bg-hover)]" title="Open">
              <ExternalLink className="w-3 h-3" />
            </button>
            <button onClick={() => onDismiss(port.port)}
              className="p-1 rounded transition-colors hover:bg-[var(--dl-bg-hover)]"
              style={{ color: 'var(--dl-text-muted)' }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
