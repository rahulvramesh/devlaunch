import { useState, useEffect } from 'react'
import { ipc } from './lib/ipc'
import { AppView, RecentProject, SSHConfig, SavedSSHConnection, ConnectionMode } from './lib/types'
import { useToast } from './components/shared/Toast'
import ErrorBoundary from './components/shared/ErrorBoundary'
import UpdateBanner from './components/shared/UpdateBanner'
import Welcome from './components/Welcome'
import ProjectWizard from './components/ProjectWizard'
import OpenExisting from './components/OpenExisting'
import DashboardLayout from './components/Dashboard/Layout'
import SSHDialog from './components/ProjectWizard/SSHDialog'

type ExtendedView = AppView | 'ssh-reconnect'

function App(): JSX.Element {
  const [view, setView] = useState<ExtendedView>('welcome')
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [scaffoldCommand, setScaffoldCommand] = useState<string | undefined>()
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('local')
  const [sshConfig, setSSHConfig] = useState<SSHConfig | undefined>()
  const [pendingSSHProject, setPendingSSHProject] = useState<RecentProject | null>(null)
  const [prefillSSHConfig, setPrefillSSHConfig] = useState<Partial<SSHConfig> | undefined>()
  const { toast } = useToast()

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (view === 'welcome') setView('wizard')
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        if (view === 'welcome') setView('open-existing')
      }
      if (e.key === 'Escape') {
        if (view === 'wizard' || view === 'open-existing' || view === 'ssh-reconnect') setView('welcome')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view])

  async function handleOpenProject(project: RecentProject): Promise<void> {
    setProjectName(project.name)
    setProjectPath(project.path)
    setScaffoldCommand(undefined)

    if (project.isSSH && project.sshConfigId) {
      // Look up saved SSH connection and route through reconnect flow
      try {
        const savedConns = await ipc.getSavedConnections()
        const saved = savedConns.find((c) => c.id === project.sshConfigId)
        if (saved) {
          // Pre-fill SSH config (password/key will be prompted via SSHDialog)
          setPendingSSHProject(project)
          setPrefillSSHConfig({
            id: saved.id,
            host: saved.host,
            port: saved.port,
            username: saved.username,
            authType: saved.authType,
            name: saved.name
          })
          setView('ssh-reconnect')
          return
        }
      } catch { /* fall through to local */ }
      // If saved connection not found, open locally as fallback
      toast('SSH connection not found. Opening locally.', 'info')
      setConnectionMode('local')
    } else {
      setConnectionMode(project.isSSH ? 'ssh' : 'local')
    }
    setView('dashboard')
  }

  function handleOpenExistingProject(
    name: string,
    path: string,
    mode: ConnectionMode,
    sshCfg?: SSHConfig
  ): void {
    setProjectName(name)
    setProjectPath(path)
    setScaffoldCommand(undefined)
    setConnectionMode(mode)
    setSSHConfig(sshCfg)

    // Save to recent
    ipc.addRecentProject({
      name,
      path,
      createdAt: new Date().toISOString(),
      template: 'existing',
      isSSH: mode === 'ssh',
      sshConfigId: sshCfg?.id
    })

    setView('dashboard')
  }

  async function handleProjectCreated(
    name: string,
    path: string,
    mode: ConnectionMode,
    sshCfg?: SSHConfig
  ): Promise<void> {
    try {
      const parentDir = path.substring(0, path.lastIndexOf('/'))
      const result = await ipc.createProject({
        name,
        template: 'nextjs',
        directory: parentDir,
        isSSH: mode === 'ssh',
        sshConfig: sshCfg
      })

      setProjectName(name)
      setProjectPath(path)
      setConnectionMode(mode)
      setSSHConfig(sshCfg)

      if (result.success) {
        setScaffoldCommand(result.scaffoldCommand)
        toast('Project created successfully', 'success')
      } else {
        toast(result.error || 'Failed to create project', 'error')
      }

      setView('dashboard')
    } catch (err) {
      toast(`Error: ${err}`, 'error')
    }
  }

  function handleBack(): void {
    setScaffoldCommand(undefined)
    setSSHConfig(undefined)
    setConnectionMode('local')
    setView('welcome')
  }

  return (
    <div className="h-screen flex flex-col">
      <UpdateBanner />
      {view === 'welcome' && (
        <Welcome
          onCreateProject={() => setView('wizard')}
          onOpenExisting={() => setView('open-existing')}
          onOpenProject={handleOpenProject}
        />
      )}
      {view === 'wizard' && (
        <ProjectWizard
          onCancel={() => setView('welcome')}
          onCreated={handleProjectCreated}
        />
      )}
      {view === 'open-existing' && (
        <OpenExisting
          onOpen={handleOpenExistingProject}
          onCancel={() => setView('welcome')}
        />
      )}
      {view === 'ssh-reconnect' && pendingSSHProject && (
        <div className="flex-1 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'var(--dl-bg)' }}>
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, var(--dl-dot-color) 1px, transparent 0)',
              backgroundSize: '32px 32px',
              opacity: 'var(--dl-dot-opacity)'
            }} />
          <div className="relative z-10 w-full max-w-lg mx-auto px-6">
            <div className="rounded-lg border p-6"
              style={{ background: 'var(--dl-card-bg)', borderColor: 'var(--dl-card-border)' }}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
                  Reconnect to Server
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
                  Authenticate to open <span className="font-mono text-orange-400">{pendingSSHProject.name}</span> on the remote server.
                </p>
              </div>
              <SSHDialog
                initialConfig={prefillSSHConfig}
                onConnect={(config) => {
                  setSSHConfig(config)
                  setConnectionMode('ssh')
                  setPendingSSHProject(null)
                  setPrefillSSHConfig(undefined)
                  setView('dashboard')
                }}
                onCancel={() => {
                  setPendingSSHProject(null)
                  setPrefillSSHConfig(undefined)
                  setView('welcome')
                }}
              />
            </div>
          </div>
        </div>
      )}
      {view === 'dashboard' && (
        <ErrorBoundary>
          <DashboardLayout
            projectName={projectName}
            projectPath={projectPath}
            scaffoldCommand={scaffoldCommand}
            connectionMode={connectionMode}
            sshConfig={sshConfig}
            onBack={handleBack}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}

export default App
