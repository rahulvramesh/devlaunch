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
    <div className="absolute bottom-8 right-4 flex flex-col gap-2 z-40 max-w-sm">
      {newPorts.map((port) => (
        <div
          key={port.port}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900 border border-green-500/30 shadow-lg text-sm"
        >
          <Globe className="w-4 h-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-zinc-200">
              Port <span className="font-mono text-green-400">{port.port}</span> detected
            </div>
            {port.process && (
              <div className="text-xs text-zinc-500 truncate">{port.process}</div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {connectionMode === 'ssh' && (
              <button
                onClick={() => onForward(port.port)}
                className="p-1.5 rounded hover:bg-zinc-800 text-blue-400 transition-colors"
                title="Forward port locally"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onOpen(port.port)}
              className="p-1.5 rounded hover:bg-zinc-800 text-green-400 transition-colors"
              title="Open in browser"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDismiss(port.port)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
