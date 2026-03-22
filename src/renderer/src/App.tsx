import { useState, useEffect } from 'react'
import { ipc } from './lib/ipc'
import { AppView, RecentProject, SSHConfig, ConnectionMode } from './lib/types'
import { useToast } from './components/shared/Toast'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Welcome from './components/Welcome'
import ProjectWizard from './components/ProjectWizard'
import OpenExisting from './components/OpenExisting'
import DashboardLayout from './components/Dashboard/Layout'

function App(): JSX.Element {
  const [view, setView] = useState<AppView>('welcome')
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [scaffoldCommand, setScaffoldCommand] = useState<string | undefined>()
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('local')
  const [sshConfig, setSSHConfig] = useState<SSHConfig | undefined>()
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
        if (view === 'wizard' || view === 'open-existing') setView('welcome')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view])

  function handleOpenProject(project: RecentProject): void {
    setProjectName(project.name)
    setProjectPath(project.path)
    setScaffoldCommand(undefined)
    setConnectionMode(project.isSSH ? 'ssh' : 'local')
    // For SSH projects from recent, user needs to reconnect via Open Existing
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
    <>
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
    </>
  )
}

export default App
