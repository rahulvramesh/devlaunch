import { useState, useCallback } from 'react'
import { ArrowLeft, Server, Sun, Moon } from 'lucide-react'
import { useGitStatus } from '../../hooks/useGitStatus'
import { usePorts } from '../../hooks/usePorts'
import { useTheme } from '../../lib/theme'
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
  const { ports, newPorts, forwardPort, openInBrowser, dismissPort } = usePorts(connectionMode, sshConfig?.id)
  const { theme, toggle } = useTheme()
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
    (port: number) => { openInBrowser(port) },
    [openInBrowser]
  )

  return (
    <div className="h-screen flex flex-col select-none relative dl-glass">
      {/* Top bar (also drag region) */}
      <div className="flex items-center gap-3 px-3 h-10 shrink-0 dl-drag-region dl-glass-panel"
        style={{ borderBottom: '1px solid var(--dl-border-subtle)' }}>
        <button onClick={onBack}
          className="p-1 rounded transition-colors hover:bg-[var(--dl-bg-hover)] dl-no-drag" title="Back">
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--dl-text-muted)' }} />
        </button>
        <div className="w-px h-4" style={{ background: 'var(--dl-border)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--dl-text)' }}>{projectName}</span>
        <span className="text-xs font-mono truncate" style={{ color: 'var(--dl-text-muted)' }}>
          {projectPath}
        </span>
        {connectionMode === 'ssh' && sshConfig && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--dl-border)' }} />
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400 font-mono">
                {sshConfig.username}@{sshConfig.host}
              </span>
            </div>
          </>
        )}
        <div className="flex-1" />
        <button onClick={toggle}
          className="p-1.5 rounded transition-colors hover:bg-[var(--dl-bg-hover)] dl-no-drag"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5" style={{ color: 'var(--dl-text-muted)' }} />
          ) : (
            <Moon className="w-3.5 h-3.5" style={{ color: 'var(--dl-text-muted)' }} />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <div style={{ width: sidebarWidth }} className="shrink-0">
          <FileTree rootPath={projectPath} connectionMode={connectionMode} sshConfig={sshConfig} />
        </div>
        <ResizeHandle direction="horizontal" onResize={handleResize} />
        <div className="flex-1 min-w-0">
          <Terminal cwd={projectPath} scaffoldCommand={scaffoldCommand}
            connectionMode={connectionMode} sshConfig={sshConfig} />
        </div>
      </div>

      <PortNotification newPorts={newPorts} connectionMode={connectionMode}
        onOpen={handleOpenPort} onForward={handleForwardAndOpen} onDismiss={dismissPort} />

      <StatusBar projectPath={projectPath}
        gitStatus={connectionMode === 'local' ? gitStatus : null}
        connectionMode={connectionMode} sshHost={sshConfig?.host}
        ports={ports} onOpenPort={handleOpenPort} />
    </div>
  )
}
