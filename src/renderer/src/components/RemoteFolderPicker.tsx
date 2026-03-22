import { useState, useEffect } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown, ArrowUp } from 'lucide-react'
import { ipc } from '../lib/ipc'
import { SSHConfig, FileEntry } from '../lib/types'
import Button from './shared/Button'

interface RemoteFolderPickerProps {
  sshConfig: SSHConfig
  onSelect: (path: string) => void
  onCancel: () => void
}

export default function RemoteFolderPicker({
  sshConfig,
  onSelect,
  onCancel
}: RemoteFolderPickerProps): JSX.Element {
  const [currentPath, setCurrentPath] = useState('/home')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [pathInput, setPathInput] = useState('/home')

  async function loadDir(dirPath: string): Promise<void> {
    setLoading(true)
    try {
      const items = await ipc.sshReadDirectory(sshConfig, dirPath)
      setEntries(items.filter((e) => e.isDirectory))
      setCurrentPath(dirPath)
      setPathInput(dirPath)
      setSelectedPath(null)
    } catch {
      // Directory might not exist or be unreadable
      setEntries([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDir(currentPath)
  }, [])

  function goUp(): void {
    const parent = currentPath === '/' ? '/' : currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
    loadDir(parent)
  }

  function handleGoToPath(): void {
    if (pathInput.startsWith('/')) {
      loadDir(pathInput)
    }
  }

  function handleSelect(entry: FileEntry): void {
    setSelectedPath(entry.path)
  }

  function handleOpen(entry: FileEntry): void {
    loadDir(entry.path)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--dl-text)' }}>
          Browse Remote: <span className="text-orange-400 font-mono">{sshConfig.username}@{sshConfig.host}</span>
        </h3>
      </div>

      {/* Path bar */}
      <div className="flex gap-2">
        <button onClick={goUp}
          className="p-2 rounded-md border transition-colors hover:bg-[var(--dl-bg-hover)]"
          style={{ borderColor: 'var(--dl-border)' }}
          disabled={currentPath === '/'}
        >
          <ArrowUp className="w-4 h-4" style={{ color: 'var(--dl-text-muted)' }} />
        </button>
        <input
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGoToPath()}
          className="flex-1 px-3 py-1.5 rounded-md border text-xs font-mono"
          style={{
            background: 'var(--dl-input-bg)',
            borderColor: 'var(--dl-input-border)',
            color: 'var(--dl-text)'
          }}
        />
      </div>

      {/* Directory listing */}
      <div
        className="rounded-md border overflow-y-auto"
        style={{
          borderColor: 'var(--dl-border)',
          background: 'var(--dl-input-bg)',
          height: '220px'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>Loading...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>No subdirectories</span>
          </div>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => handleSelect(entry)}
              onDoubleClick={() => handleOpen(entry)}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors
                ${selectedPath === entry.path ? 'bg-orange-500/10' : 'hover:bg-[var(--dl-bg-hover)]'}`}
              style={{ color: 'var(--dl-text-secondary)' }}
            >
              <Folder className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
              <span className="font-mono truncate">{entry.name}</span>
            </button>
          ))
        )}
      </div>

      <div className="text-xs font-mono px-1" style={{ color: 'var(--dl-text-muted)' }}>
        Selected: {selectedPath || currentPath}
      </div>

      <div className="flex justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onSelect(currentPath)}>
            Use Current Folder
          </Button>
          {selectedPath && (
            <Button size="sm" onClick={() => onSelect(selectedPath)}>
              Select Folder
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
