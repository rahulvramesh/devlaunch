import { useState, useCallback } from 'react'
import { ArrowLeft, Server } from 'lucide-react'
import { useGitStatus } from '../../hooks/useGitStatus'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import Terminal from './Terminal'
import FileTree from './FileTree'
import StatusBar from './StatusBar'
import ResizeHandle from '../shared/ResizeHandle'

interface DashboardLayoutProps {
  projectName: string
  projectPath: string
  scaffoldCommand?: string
  connectionMode: ConnectionMode
  sshConfig?: SSHConfig
  onBack: () => void
}

const MIN_SIDEBAR = 150
const MAX_SIDEBAR = 500

export default function DashboardLayout({
  projectName,
  projectPath,
  scaffoldCommand,
  connectionMode,
  sshConfig,
  onBack
}: DashboardLayoutProps): JSX.Element {
  const { gitStatus } = useGitStatus(projectPath)
  const [sidebarWidth, setSidebarWidth] = useState(240)

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, prev + delta)))
  }, [])

  return (
    <div className="h-screen flex flex-col bg-zinc-950 select-none">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 h-10 border-b border-zinc-800 shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-zinc-800 transition-colors"
          title="Back to Welcome"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500" />
        </button>
        <span className="text-sm font-medium text-zinc-300">{projectName}</span>
        <span className="text-xs text-zinc-600">|</span>
        <span className="text-xs text-zinc-500 truncate">{projectPath}</span>
        {connectionMode === 'ssh' && sshConfig && (
          <>
            <span className="text-xs text-zinc-600">|</span>
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">
                {sshConfig.username}@{sshConfig.host}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* File tree sidebar */}
        <div style={{ width: sidebarWidth }} className="shrink-0">
          <FileTree
            rootPath={projectPath}
            connectionMode={connectionMode}
            sshConfig={sshConfig}
          />
        </div>

        <ResizeHandle direction="horizontal" onResize={handleResize} />

        {/* Terminal area */}
        <div className="flex-1 min-w-0">
          <Terminal
            cwd={projectPath}
            scaffoldCommand={scaffoldCommand}
            connectionMode={connectionMode}
            sshConfig={sshConfig}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        projectPath={projectPath}
        gitStatus={connectionMode === 'local' ? gitStatus : null}
        connectionMode={connectionMode}
        sshHost={sshConfig?.host}
      />
    </div>
  )
}
