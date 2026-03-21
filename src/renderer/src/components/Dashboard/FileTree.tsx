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
        className={`flex items-center gap-1.5 w-full px-2 py-1 text-left text-xs hover:bg-zinc-800/50 transition-colors
          ${entry.isDirectory ? 'text-zinc-300' : 'text-zinc-500 cursor-default'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {entry.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File className={`w-3.5 h-3.5 shrink-0 ${getFileIconColor(entry.name)}`} />
          </>
        )}
        <span className="truncate">{entry.name}</span>
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
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Files</span>
        <button
          onClick={refresh}
          className="p-1 rounded hover:bg-zinc-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootEntries.length === 0 && !isLoading && (
          <p className="text-xs text-zinc-600 px-3 py-2">No files yet</p>
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
