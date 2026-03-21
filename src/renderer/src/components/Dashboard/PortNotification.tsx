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
        <div
          key={port.port}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 shadow-xl text-sm"
        >
          <Globe className="w-4 h-4 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-neutral-200 text-xs">
              Port <span className="font-mono text-green-400">{port.port}</span>
            </div>
            {port.process && (
              <div className="text-[10px] text-neutral-600 font-mono truncate">{port.process}</div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {connectionMode === 'ssh' && (
              <button
                onClick={() => onForward(port.port)}
                className="p-1 rounded hover:bg-neutral-800 text-blue-400 transition-colors"
                title="Forward"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => onOpen(port.port)}
              className="p-1 rounded hover:bg-neutral-800 text-green-400 transition-colors"
              title="Open"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDismiss(port.port)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
