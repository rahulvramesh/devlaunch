import { useState } from 'react'
import { ChevronDown, ChevronRight, Globe, ExternalLink, ArrowRightLeft, X } from 'lucide-react'
import { ConnectionMode } from '../../lib/types'

interface DetectedPort {
  port: number
  pid?: number
  process?: string
}

interface PortsPanelProps {
  ports: DetectedPort[]
  connectionMode: ConnectionMode
  forwardedPorts: { remotePort: number; localPort: number }[]
  onForward: (port: number) => void
  onUnforward: (port: number) => void
  onOpen: (port: number) => void
}

export default function PortsPanel({
  ports,
  connectionMode,
  forwardedPorts,
  onForward,
  onUnforward,
  onOpen
}: PortsPanelProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const forwardedSet = new Map(forwardedPorts.map((f) => [f.remotePort, f.localPort]))

  return (
    <div style={{ borderBottom: '1px solid var(--dl-border-subtle)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-left transition-colors hover:bg-[var(--dl-bg-hover)]"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--dl-text-muted)' }} />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--dl-text-muted)' }} />
        )}
        <span
          className="text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'var(--dl-text-muted)' }}
        >
          Ports
        </span>
        {ports.length > 0 && (
          <span
            className="ml-auto text-[10px] font-mono px-1.5 rounded-full"
            style={{ background: 'var(--dl-bg-hover)', color: 'var(--dl-text-muted)' }}
          >
            {ports.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="pb-1">
          {ports.length === 0 ? (
            <p
              className="text-[11px] px-3 py-3 text-center"
              style={{ color: 'var(--dl-text-muted)' }}
            >
              No ports detected
            </p>
          ) : (
            ports.map((p) => {
              const isForwarded = forwardedSet.has(p.port)
              const localPort = forwardedSet.get(p.port)

              return (
                <div
                  key={p.port}
                  className="flex items-center gap-1.5 px-3 py-[4px] text-[12px] group transition-colors hover:bg-[var(--dl-bg-hover)]"
                >
                  <Globe
                    className={`w-3 h-3 shrink-0 ${isForwarded ? 'text-blue-400' : 'text-green-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono" style={{ color: 'var(--dl-text)' }}>
                      :{p.port}
                    </span>
                    {isForwarded && localPort !== p.port && (
                      <span
                        className="text-[10px] font-mono ml-1"
                        style={{ color: 'var(--dl-text-muted)' }}
                      >
                        → :{localPort}
                      </span>
                    )}
                    {isForwarded && (
                      <span className="text-[10px] ml-1 text-blue-400">forwarded</span>
                    )}
                    {p.process && (
                      <span
                        className="text-[10px] font-mono ml-1.5 truncate"
                        style={{ color: 'var(--dl-text-muted)' }}
                      >
                        {p.process}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {connectionMode === 'ssh' && !isForwarded && (
                      <button
                        onClick={() => onForward(p.port)}
                        className="p-0.5 rounded text-blue-400 transition-colors hover:bg-[var(--dl-bg-hover)]"
                        title="Forward port"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                    )}
                    {connectionMode === 'ssh' && isForwarded && (
                      <button
                        onClick={() => onUnforward(p.port)}
                        className="p-0.5 rounded transition-colors hover:bg-[var(--dl-bg-hover)]"
                        style={{ color: 'var(--dl-text-muted)' }}
                        title="Stop forwarding"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        onOpen(isForwarded && localPort !== undefined ? localPort : p.port)
                      }
                      className="p-0.5 rounded text-green-400 transition-colors hover:bg-[var(--dl-bg-hover)]"
                      title={`Open localhost:${isForwarded && localPort !== undefined ? localPort : p.port}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
