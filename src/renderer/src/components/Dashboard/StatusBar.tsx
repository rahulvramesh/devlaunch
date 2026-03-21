import { Folder, GitBranch, Monitor, Server } from 'lucide-react'
import { GitStatus, ConnectionMode } from '../../lib/types'

interface StatusBarProps {
  projectPath: string
  gitStatus: GitStatus | null
  connectionMode: ConnectionMode
  sshHost?: string
}

export default function StatusBar({ projectPath, gitStatus, connectionMode, sshHost }: StatusBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-3 h-7 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-500 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3 h-3" />
          <span className="truncate max-w-xs">{projectPath}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {gitStatus && (
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            <span>{gitStatus.branch}</span>
            {gitStatus.changedFiles > 0 && (
              <span className="text-yellow-500">+{gitStatus.changedFiles}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {connectionMode === 'ssh' ? (
            <>
              <Server className="w-3 h-3" />
              <span className="text-blue-400">SSH: {sshHost}</span>
            </>
          ) : (
            <>
              <Monitor className="w-3 h-3" />
              <span className="text-green-500">Local</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
