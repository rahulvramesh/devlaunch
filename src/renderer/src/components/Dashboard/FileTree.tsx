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
        className={`flex items-center gap-1.5 w-full py-[3px] text-left text-[12px] transition-colors
          hover:bg-neutral-800/40
          ${entry.isDirectory ? 'text-neutral-300' : 'text-neutral-500 cursor-default'}`}
        style={{ paddingLeft: `${depth * 14 + 10}px`, paddingRight: '8px' }}
      >
        {entry.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-neutral-600 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
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
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              children={children}
              expandedPaths={expandedPaths}
              toggleDirectory={toggleDirectory}
            />
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
    <div className="h-full flex flex-col bg-[#0e0e0e] border-r border-neutral-800/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/50">
        <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">Explorer</span>
        <button
          onClick={refresh}
          className="p-1 rounded hover:bg-neutral-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 text-neutral-600 hover:text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootEntries.length === 0 && !isLoading && (
          <p className="text-[11px] text-neutral-700 px-3 py-4 text-center">No files yet</p>
        )}
        {rootEntries.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            children={children}
            expandedPaths={expandedPaths}
            toggleDirectory={toggleDirectory}
          />
        ))}
      </div>
    </div>
  )
}
