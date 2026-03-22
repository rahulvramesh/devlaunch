import { useState, useRef, useEffect } from 'react'
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react'
import { TerminalTab } from '../../hooks/useTerminalTabs'

interface TerminalTabsProps {
  tabs: TerminalTab[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onCloseTab: (id: string) => void
  onRenameTab: (id: string, name: string) => void
  onCloseOtherTabs: (keepId: string) => void
}

export default function TerminalTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onCloseOtherTabs
}: TerminalTabsProps): JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = (): void => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu])

  function handleStartRename(id: string, currentName: string): void {
    setEditingId(id)
    setEditValue(currentName)
    setContextMenu(null)
  }

  function handleFinishRename(): void {
    if (editingId && editValue.trim()) {
      onRenameTab(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  function handleContextMenu(e: React.MouseEvent, id: string): void {
    e.preventDefault()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="flex items-center h-8 shrink-0 overflow-x-auto"
      style={{ background: 'var(--dl-bg-panel)', borderBottom: '1px solid var(--dl-border-subtle)' }}>
      {/* Tabs */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
          onDoubleClick={() => handleStartRename(tab.id, tab.name)}
          className={`group flex items-center gap-1.5 px-3 h-full text-[11px] font-medium
            border-r transition-colors shrink-0 relative
            ${tab.id === activeTabId
              ? 'text-orange-400'
              : 'hover:bg-[var(--dl-bg-hover)]'
            }`}
          style={{
            borderRightColor: 'var(--dl-border-subtle)',
            color: tab.id === activeTabId ? undefined : 'var(--dl-text-muted)',
            background: tab.id === activeTabId ? 'var(--dl-bg)' : undefined
          }}
        >
          <TerminalIcon className="w-3 h-3 shrink-0" />
          {tab.tmuxPaneId && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="tmux session (persistent)" />
          )}

          {editingId === tab.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename()
                if (e.key === 'Escape') setEditingId(null)
              }}
              className="w-20 bg-transparent border-none outline-none text-[11px] px-0"
              style={{ color: 'var(--dl-text)' }}
            />
          ) : (
            <span className="truncate max-w-[100px]">{tab.name}</span>
          )}

          {tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.id)
              }}
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-[var(--dl-bg-hover)]"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}

          {/* Active tab indicator */}
          {tab.id === activeTabId && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />
          )}
        </button>
      ))}

      {/* Add tab button */}
      <button
        onClick={onAddTab}
        className="flex items-center justify-center w-8 h-full shrink-0 transition-colors
          hover:bg-[var(--dl-bg-hover)]"
        style={{ color: 'var(--dl-text-muted)' }}
        title="New Terminal (Ctrl+T)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-md border shadow-lg py-1 min-w-[140px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--dl-card-bg, var(--dl-bg-raised))',
            borderColor: 'var(--dl-border)'
          }}
        >
          <button
            onClick={() => handleStartRename(contextMenu.id, tabs.find((t) => t.id === contextMenu.id)?.name || '')}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--dl-bg-hover)] transition-colors"
            style={{ color: 'var(--dl-text-secondary)' }}
          >
            Rename
          </button>
          <button
            onClick={() => { onCloseTab(contextMenu.id); setContextMenu(null) }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--dl-bg-hover)] transition-colors"
            style={{ color: 'var(--dl-text-secondary)' }}
          >
            Close
          </button>
          {tabs.length > 1 && (
            <button
              onClick={() => { onCloseOtherTabs(contextMenu.id); setContextMenu(null) }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--dl-bg-hover)] transition-colors"
              style={{ color: 'var(--dl-text-secondary)' }}
            >
              Close Others
            </button>
          )}
        </div>
      )}
    </div>
  )
}
