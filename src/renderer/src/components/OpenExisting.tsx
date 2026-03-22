import { useState, useEffect } from 'react'
import { Monitor, Server, FolderOpen, ArrowLeft, Wifi, Trash2 } from 'lucide-react'
import { ipc } from '../lib/ipc'
import { SSHConfig, SavedSSHConnection, ConnectionMode } from '../lib/types'
import Button from './shared/Button'
import RemoteFolderPicker from './RemoteFolderPicker'
import SSHDialog from './ProjectWizard/SSHDialog'

interface OpenExistingProps {
  onOpen: (name: string, path: string, mode: ConnectionMode, sshConfig?: SSHConfig) => void
  onCancel: () => void
}

type Step = 'choose-mode' | 'ssh-connect' | 'ssh-browse'

export default function OpenExisting({ onOpen, onCancel }: OpenExistingProps): JSX.Element {
  const [step, setStep] = useState<Step>('choose-mode')
  const [savedConnections, setSavedConnections] = useState<SavedSSHConnection[]>([])
  const [sshConfig, setSSHConfig] = useState<SSHConfig | null>(null)

  useEffect(() => {
    ipc.getSavedConnections().then(setSavedConnections)
  }, [])

  async function handleOpenLocal(): Promise<void> {
    const selected = await ipc.selectFolder()
    if (!selected) return
    const name = selected.split('/').pop() || selected.split('\\').pop() || 'project'
    onOpen(name, selected, 'local')
  }

  function handleSSHConnected(config: SSHConfig): void {
    setSSHConfig(config)
    setStep('ssh-browse')
  }

  async function handleQuickConnect(conn: SavedSSHConnection): Promise<void> {
    // We have saved connection but need password/key — show SSH dialog pre-filled
    setSSHConfig({
      id: conn.id,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      authType: conn.authType,
      name: conn.name
    })
    setStep('ssh-connect')
  }

  function handleRemoteFolderSelected(path: string): void {
    if (!sshConfig) return
    const name = path.split('/').pop() || 'remote-project'

    // Save to recent with SSH info
    ipc.addRecentProject({
      name,
      path,
      createdAt: new Date().toISOString(),
      template: 'existing',
      isSSH: true,
      sshConfigId: sshConfig.id
    })

    onOpen(name, path, 'ssh', sshConfig)
  }

  async function handleDeleteConnection(id: string): Promise<void> {
    await ipc.removeConnection(id)
    const updated = await ipc.getSavedConnections()
    setSavedConnections(updated)
  }

  if (step === 'ssh-connect') {
    return (
      <div className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--dl-bg)' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--dl-dot-color) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            opacity: 'var(--dl-dot-opacity)'
          }}
        />
        <div className="relative z-10 w-full max-w-lg mx-auto px-6">
          <div className="rounded-lg border p-6"
            style={{ background: 'var(--dl-card-bg)', borderColor: 'var(--dl-card-border)' }}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
                SSH Connection
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
                Connect to browse remote folders.
              </p>
            </div>
            <SSHDialog
              onConnect={handleSSHConnected}
              onCancel={() => setStep('choose-mode')}
            />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'ssh-browse' && sshConfig) {
    return (
      <div className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--dl-bg)' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--dl-dot-color) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            opacity: 'var(--dl-dot-opacity)'
          }}
        />
        <div className="relative z-10 w-full max-w-lg mx-auto px-6">
          <div className="rounded-lg border p-6"
            style={{ background: 'var(--dl-card-bg)', borderColor: 'var(--dl-card-border)' }}>
            <RemoteFolderPicker
              sshConfig={sshConfig}
              onSelect={handleRemoteFolderSelected}
              onCancel={() => setStep('choose-mode')}
            />
          </div>
        </div>
      </div>
    )
  }

  // Default: choose-mode
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--dl-bg)' }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--dl-dot-color) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
          opacity: 'var(--dl-dot-opacity)'
        }}
      />
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <div className="rounded-lg border p-6"
          style={{ background: 'var(--dl-card-bg)', borderColor: 'var(--dl-card-border)' }}>
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
                Open Existing Project
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
                Open a project from your local machine or a remote server.
              </p>
            </div>

            {/* Local */}
            <button
              onClick={handleOpenLocal}
              className="group flex items-center gap-4 p-4 rounded-md border transition-all duration-150 text-left
                hover:border-orange-500/30 hover:bg-orange-500/5"
              style={{ borderColor: 'var(--dl-border)', background: 'var(--dl-bg-raised)' }}
            >
              <Monitor className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--dl-text)' }}>
                  Local Folder
                </div>
                <div className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>
                  Open a project on this machine
                </div>
              </div>
              <FolderOpen className="w-4 h-4" style={{ color: 'var(--dl-text-muted)' }} />
            </button>

            {/* SSH — saved connections */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider mb-2 block"
                style={{ color: 'var(--dl-text-muted)' }}>
                Remote (SSH)
              </label>

              {savedConnections.length > 0 ? (
                <div className="flex flex-col gap-1 mb-3">
                  {savedConnections.map((conn) => (
                    <div key={conn.id}
                      className="group flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                        hover:bg-[var(--dl-bg-hover)]"
                    >
                      <button
                        onClick={() => handleQuickConnect(conn)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Wifi className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono" style={{ color: 'var(--dl-text-secondary)' }}>
                            {conn.name}
                          </div>
                          <div className="text-[11px] font-mono" style={{ color: 'var(--dl-text-muted)' }}>
                            {conn.username}@{conn.host}:{conn.port}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all
                          hover:bg-[var(--dl-bg-hover)]"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: 'var(--dl-text-muted)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setStep('ssh-connect')}
              >
                <Server className="w-4 h-4" />
                {savedConnections.length > 0 ? 'New SSH Connection' : 'Connect via SSH'}
              </Button>
            </div>

            <div className="flex justify-start pt-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
