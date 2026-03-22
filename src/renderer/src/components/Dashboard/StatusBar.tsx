import { Folder, GitBranch } from 'lucide-react'
import { GitStatus, ConnectionMode } from '../../lib/types'

interface StatusBarProps {
  projectPath: string
  gitStatus: GitStatus | null
  connectionMode: ConnectionMode
  sshHost?: string
  tmuxSession?: string
}

export default function StatusBar({
  projectPath,
  gitStatus,
  connectionMode,
  sshHost,
  tmuxSession
}: StatusBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-between px-3 h-7 text-[11px] shrink-0"
      style={{ background: 'var(--dl-bg-panel)', borderTop: '1px solid var(--dl-border-subtle)', color: 'var(--dl-text-muted)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3 h-3" style={{ color: 'var(--dl-text-muted)' }} />
          <span className="truncate max-w-xs font-mono">{projectPath}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {gitStatus && (
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            <span className="font-mono">{gitStatus.branch}</span>
            {gitStatus.changedFiles > 0 && (
              <span className="text-orange-400">+{gitStatus.changedFiles}</span>
            )}
          </div>
        )}

        {tmuxSession && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-emerald-400">tmux: {tmuxSession}</span>
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
              <span>Local</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
