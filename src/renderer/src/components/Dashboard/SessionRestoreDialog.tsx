import { RotateCcw, Trash2 } from 'lucide-react'

interface SessionRestoreDialogProps {
  sessionName: string
  windowCount: number
  onRestore: () => void
  onStartFresh: () => void
  onDismiss: () => void
}

export default function SessionRestoreDialog({
  sessionName,
  windowCount,
  onRestore,
  onStartFresh,
  onDismiss
}: SessionRestoreDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        style={{ background: 'var(--dl-bg-panel)', border: '1px solid var(--dl-border)' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--dl-text)' }}>
          Previous Session Found
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--dl-text-muted)' }}>
          A tmux session <span className="font-mono text-emerald-400">{sessionName}</span> with{' '}
          {windowCount} terminal{windowCount !== 1 ? 's' : ''} is still running.
          Would you like to restore it?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onStartFresh}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors"
            style={{
              background: 'var(--dl-bg-hover)',
              color: 'var(--dl-text-muted)',
              border: '1px solid var(--dl-border)'
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Start Fresh
          </button>
          <button
            onClick={onRestore}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Session
          </button>
        </div>
      </div>
    </div>
  )
}
