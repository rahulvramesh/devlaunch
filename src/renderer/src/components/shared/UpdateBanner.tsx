import { useState, useEffect } from 'react'
import { Download, RefreshCw, CheckCircle, X, ArrowDownToLine } from 'lucide-react'
import { ipc } from '../../lib/ipc'

interface UpdateStatus {
  status: 'checking' | 'available' | 'up-to-date' | 'downloading' | 'ready' | 'error'
  version?: string
  percent?: number
  error?: string
}

export default function UpdateBanner(): JSX.Element | null {
  const [update, setUpdate] = useState<UpdateStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const unsub = ipc.onUpdaterStatus((data: UpdateStatus) => {
      setUpdate(data)
      if (data.status === 'available' || data.status === 'ready') {
        setDismissed(false)
      }
    })
    return unsub
  }, [])

  if (!update || dismissed) return null
  if (update.status === 'checking' || update.status === 'up-to-date') return null

  if (update.status === 'error') return null

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-xs shrink-0"
      style={{
        background: update.status === 'ready' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(249, 115, 22, 0.08)',
        borderBottom: `1px solid ${update.status === 'ready' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)'}`
      }}
    >
      {/* Icon */}
      {update.status === 'available' && (
        <ArrowDownToLine className="w-3.5 h-3.5 text-orange-400 shrink-0" />
      )}
      {update.status === 'downloading' && (
        <Download className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-bounce" />
      )}
      {update.status === 'ready' && (
        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
      )}

      {/* Message */}
      <span className="flex-1" style={{ color: 'var(--dl-text-secondary)' }}>
        {update.status === 'available' && (
          <>Version <strong className="text-orange-400">{update.version}</strong> is available</>
        )}
        {update.status === 'downloading' && (
          <>Downloading update... <strong className="text-orange-400">{update.percent}%</strong></>
        )}
        {update.status === 'ready' && (
          <>Version <strong className="text-green-400">{update.version}</strong> ready to install</>
        )}
      </span>

      {/* Progress bar for downloading */}
      {update.status === 'downloading' && (
        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dl-border)' }}>
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${update.percent || 0}%` }}
          />
        </div>
      )}

      {/* Actions */}
      {update.status === 'available' && (
        <button
          onClick={() => ipc.updaterDownload()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
            bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
      )}

      {update.status === 'ready' && (
        <button
          onClick={() => ipc.updaterInstall()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
            bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Restart & Update
        </button>
      )}

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 rounded transition-colors hover:bg-[var(--dl-bg-hover)]"
        style={{ color: 'var(--dl-text-muted)' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
