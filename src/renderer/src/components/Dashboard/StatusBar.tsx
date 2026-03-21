import { Folder, GitBranch, Globe, ExternalLink } from 'lucide-react'
import { GitStatus, ConnectionMode } from '../../lib/types'

interface PortInfo {
  port: number
  process?: string
}

interface StatusBarProps {
  projectPath: string
  gitStatus: GitStatus | null
  connectionMode: ConnectionMode
  sshHost?: string
  ports?: PortInfo[]
  onOpenPort?: (port: number) => void
}

export default function StatusBar({
  projectPath,
  gitStatus,
  connectionMode,
  sshHost,
  ports = [],
  onOpenPort
}: StatusBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-3 h-7 bg-[#0e0e0e] border-t border-neutral-800/50 text-[11px] text-neutral-500 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3 h-3 text-neutral-600" />
          <span className="truncate max-w-xs font-mono text-neutral-500">{projectPath}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {ports.length > 0 && (
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-green-500" />
            {ports.map((p) => (
              <button
                key={p.port}
                onClick={() => onOpenPort?.(p.port)}
                className="flex items-center gap-0.5 text-green-500 hover:text-green-400 transition-colors font-mono"
                title={`Open localhost:${p.port}`}
              >
                :{p.port}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        )}

        {gitStatus && (
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-neutral-600" />
            <span className="font-mono">{gitStatus.branch}</span>
            {gitStatus.changedFiles > 0 && (
              <span className="text-orange-400">+{gitStatus.changedFiles}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {connectionMode === 'ssh' ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-blue-400 font-mono">{sshHost}</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-neutral-500">Local</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
