import { useState, useCallback } from 'react'
import { ArrowLeft, Server, Sun, Moon } from 'lucide-react'
import { useGitStatus } from '../../hooks/useGitStatus'
import { usePorts } from '../../hooks/usePorts'
import { useTheme } from '../../lib/theme'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import TerminalPanel from './TerminalPanel'
import FileTree from './FileTree'
import StatusBar from './StatusBar'
import PortsPanel from './PortsPanel'
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
  const { ports, forwardedPorts, forwardPort, unforwardPort, openInBrowser } = usePorts(connectionMode, sshConfig?.id)
  const { theme, toggle } = useTheme()
  const [sidebarWidth, setSidebarWidth] = useState(240)

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, prev + delta)))
  }, [])

  const handleForwardPort = useCallback(
    async (port: number) => {
      if (connectionMode === 'ssh') {
        await forwardPort(port)
      }
    },
    [connectionMode, forwardPort]
  )

  const handleOpenPort = useCallback(
    (port: number) => { openInBrowser(port) },
    [openInBrowser]
  )

  return (
    <div className="flex-1 flex flex-col select-none relative"
      style={{ background: 'var(--dl-bg)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 h-10 shrink-0"
        style={{ background: 'var(--dl-bg-panel)', borderBottom: '1px solid var(--dl-border-subtle)' }}>
        <button onClick={onBack}
          className="p-1 rounded transition-colors hover:bg-[var(--dl-bg-hover)]" title="Back">
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
          className="p-1.5 rounded transition-colors hover:bg-[var(--dl-bg-hover)]"
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
        <div style={{ width: sidebarWidth, background: 'var(--dl-bg-panel)', borderRight: '1px solid var(--dl-border-subtle)' }}
          className="shrink-0 flex flex-col min-h-0">
          <PortsPanel
            ports={ports}
            connectionMode={connectionMode}
            forwardedPorts={forwardedPorts}
            onForward={handleForwardPort}
            onUnforward={unforwardPort}
            onOpen={handleOpenPort}
          />
          <div className="flex-1 min-h-0 overflow-hidden">
            <FileTree rootPath={projectPath} connectionMode={connectionMode} sshConfig={sshConfig} />
          </div>
        </div>
        <ResizeHandle direction="horizontal" onResize={handleResize} />
        <div className="flex-1 min-w-0">
          <TerminalPanel cwd={projectPath} scaffoldCommand={scaffoldCommand}
            connectionMode={connectionMode} sshConfig={sshConfig} />
        </div>
      </div>

      <StatusBar projectPath={projectPath}
        gitStatus={connectionMode === 'local' ? gitStatus : null}
        connectionMode={connectionMode} sshHost={sshConfig?.host} />
    </div>
  )
}
