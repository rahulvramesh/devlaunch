import { useState, useCallback } from 'react'
import { ArrowLeft, Server } from 'lucide-react'
import { useGitStatus } from '../../hooks/useGitStatus'
import { usePorts } from '../../hooks/usePorts'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import Terminal from './Terminal'
import FileTree from './FileTree'
import StatusBar from './StatusBar'
import PortNotification from './PortNotification'
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
  const { ports, newPorts, forwardPort, openInBrowser, dismissPort } = usePorts(
    connectionMode,
    sshConfig?.id
  )
  const [sidebarWidth, setSidebarWidth] = useState(240)

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, prev + delta)))
  }, [])

  const handleForwardAndOpen = useCallback(
    async (port: number) => {
      if (connectionMode === 'ssh') {
        const result = await forwardPort(port)
        if (result?.success && result.localPort) {
          openInBrowser(result.localPort)
        }
      }
      dismissPort(port)
    },
    [connectionMode, forwardPort, openInBrowser, dismissPort]
  )

  const handleOpenPort = useCallback(
    (port: number) => {
      openInBrowser(port)
    },
    [openInBrowser]
  )

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] select-none relative">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 h-10 border-b border-neutral-800/50 bg-[#0e0e0e] shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-neutral-800 transition-colors"
          title="Back to Welcome"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-500 hover:text-neutral-300" />
        </button>
        <div className="w-px h-4 bg-neutral-800" />
        <span className="text-sm font-medium text-neutral-200">{projectName}</span>
        <span className="text-xs text-neutral-600 font-mono truncate">{projectPath}</span>
        {connectionMode === 'ssh' && sshConfig && (
          <>
            <div className="w-px h-4 bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400 font-mono">
                {sshConfig.username}@{sshConfig.host}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <div style={{ width: sidebarWidth }} className="shrink-0">
          <FileTree
            rootPath={projectPath}
            connectionMode={connectionMode}
            sshConfig={sshConfig}
          />
        </div>

        <ResizeHandle direction="horizontal" onResize={handleResize} />

        <div className="flex-1 min-w-0">
          <Terminal
            cwd={projectPath}
            scaffoldCommand={scaffoldCommand}
            connectionMode={connectionMode}
            sshConfig={sshConfig}
          />
        </div>
      </div>

      <PortNotification
        newPorts={newPorts}
        connectionMode={connectionMode}
        onOpen={handleOpenPort}
        onForward={handleForwardAndOpen}
        onDismiss={dismissPort}
      />

      <StatusBar
        projectPath={projectPath}
        gitStatus={connectionMode === 'local' ? gitStatus : null}
        connectionMode={connectionMode}
        sshHost={sshConfig?.host}
        ports={ports}
        onOpenPort={handleOpenPort}
      />
    </div>
  )
}
