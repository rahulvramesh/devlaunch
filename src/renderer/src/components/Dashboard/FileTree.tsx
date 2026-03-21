import { memo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, RefreshCw } from 'lucide-react'
import { useFileTree } from '../../hooks/useFileTree'
import { FileEntry, SSHConfig, ConnectionMode } from '../../lib/types'
import { getFileIconColor } from '../../lib/file-icons'

interface FileTreeProps {
  rootPath: string
  connectionMode?: ConnectionMode
  sshConfig?: SSHConfig
}

interface TreeNodeProps {
  entry: FileEntry
  depth: number
  children: Map<string, FileEntry[]>
  expandedPaths: Set<string>
  toggleDirectory: (path: string) => void
}

const TreeNode = memo(function TreeNode({ entry, depth, children, expandedPaths, toggleDirectory }: TreeNodeProps): JSX.Element {
  const isExpanded = expandedPaths.has(entry.path)
  const childEntries = children.get(entry.path) || []

  return (
    <div>
      <button
        onClick={() => entry.isDirectory && toggleDirectory(entry.path)}
        className="flex items-center gap-1.5 w-full py-[3px] text-left text-[12px] transition-colors
          hover:bg-[var(--dl-bg-hover)]"
        style={{
          paddingLeft: `${depth * 14 + 10}px`,
          paddingRight: '8px',
          color: entry.isDirectory ? 'var(--dl-text-secondary)' : 'var(--dl-text-muted)',
          cursor: entry.isDirectory ? 'pointer' : 'default'
        }}
      >
        {entry.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--dl-text-muted)' }} />
            ) : (
              <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--dl-text-muted)' }} />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File className={`w-3.5 h-3.5 shrink-0 ${getFileIconColor(entry.name)}`} />
          </>
        )}
        <span className="truncate font-mono">{entry.name}</span>
      </button>
      {entry.isDirectory && isExpanded && (
        <div>
          {childEntries.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1}
              children={children} expandedPaths={expandedPaths} toggleDirectory={toggleDirectory} />
          ))}
        </div>
      )}
    </div>
  )
})

export default function FileTree({ rootPath, connectionMode, sshConfig }: FileTreeProps): JSX.Element {
  const { children, expandedPaths, isLoading, toggleDirectory, refresh } = useFileTree(rootPath, connectionMode, sshConfig)
  const rootEntries = children.get(rootPath) || []

  return (
    <div className="h-full flex flex-col dl-glass-panel"
      style={{ borderRight: '1px solid var(--dl-border-subtle)' }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--dl-border-subtle)' }}>
        <span className="text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'var(--dl-text-muted)' }}>Explorer</span>
        <button onClick={refresh}
          className="p-1 rounded transition-colors hover:bg-[var(--dl-bg-hover)]" title="Refresh">
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
            style={{ color: 'var(--dl-text-muted)' }} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootEntries.length === 0 && !isLoading && (
          <p className="text-[11px] px-3 py-4 text-center" style={{ color: 'var(--dl-text-muted)' }}>
            No files yet
          </p>
        )}
        {rootEntries.map((entry) => (
          <TreeNode key={entry.path} entry={entry} depth={0}
            children={children} expandedPaths={expandedPaths} toggleDirectory={toggleDirectory} />
        ))}
      </div>
    </div>
  )
}
