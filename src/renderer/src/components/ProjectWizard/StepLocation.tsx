import { useState } from 'react'
import { Monitor, Server, FolderOpen, ArrowLeft, ArrowRight } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import Button from '../shared/Button'
import SSHDialog from './SSHDialog'
import Input from '../shared/Input'

interface StepLocationProps {
  projectName: string
  initialDirectory: string
  onBack: () => void
  onCreate: (directory: string, mode: ConnectionMode, sshConfig?: SSHConfig) => void
}

export default function StepLocation({
  projectName,
  initialDirectory,
  onBack,
  onCreate
}: StepLocationProps): JSX.Element {
  const [mode, setMode] = useState<ConnectionMode>('local')
  const [directory, setDirectory] = useState(initialDirectory)
  const [remoteDir, setRemoteDir] = useState('/home')
  const [sshConfig, setSSHConfig] = useState<SSHConfig | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showSSHDialog, setShowSSHDialog] = useState(false)

  async function handleBrowse(): Promise<void> {
    const selected = await ipc.selectFolder()
    if (selected) setDirectory(selected)
  }

  function handleSSHConnected(config: SSHConfig): void {
    setSSHConfig(config)
    setShowSSHDialog(false)
  }

  function handleCreate(): void {
    if (mode === 'local' && !directory) return
    if (mode === 'ssh' && (!sshConfig || !remoteDir)) return
    setIsCreating(true)
    const dir = mode === 'local' ? directory : remoteDir
    onCreate(dir, mode, sshConfig || undefined)
  }

  const effectiveDir = mode === 'local' ? directory : remoteDir
  const fullPath = effectiveDir ? `${effectiveDir}/${projectName}` : ''

  if (showSSHDialog) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
            SSH Connection
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
            Configure your remote server.
          </p>
        </div>
        <SSHDialog onConnect={handleSSHConnected} onCancel={() => setShowSSHDialog(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
          Choose location
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
          Where should your project live?
        </p>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider mb-2 block"
          style={{ color: 'var(--dl-text-muted)' }}>
          Environment
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'local' as const, icon: Monitor, label: 'Local', desc: 'This machine' },
            { id: 'ssh' as const, icon: Server, label: 'Remote', desc: 'SSH server' }
          ].map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-3 p-3 rounded-md border transition-all duration-150 text-left
                ${mode === id ? 'border-orange-500/30 bg-orange-500/5' : ''}`}
              style={mode !== id ? { borderColor: 'var(--dl-border)', background: 'var(--dl-bg-raised)' } : undefined}
            >
              <Icon className={`w-4 h-4 ${mode === id ? 'text-orange-500' : ''}`}
                style={mode !== id ? { color: 'var(--dl-text-muted)' } : undefined} />
              <div>
                <div className={`text-sm font-medium ${mode === id ? '' : ''}`}
                  style={{ color: mode === id ? 'var(--dl-text)' : 'var(--dl-text-secondary)' }}>
                  {label}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--dl-text-muted)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {mode === 'local' ? (
        <div>
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--dl-text-muted)' }}>
            Project Folder
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border text-sm truncate"
              style={{
                background: 'var(--dl-input-bg)',
                borderColor: 'var(--dl-input-border)',
                color: 'var(--dl-text-secondary)'
              }}>
              {directory || 'No folder selected'}
            </div>
            <Button variant="secondary" onClick={handleBrowse}>
              <FolderOpen className="w-4 h-4" />
              Browse
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--dl-text-muted)' }}>
              SSH Connection
            </label>
            {sshConfig ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-green-500/20 bg-green-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm text-green-400 flex-1 font-mono">
                  {sshConfig.username}@{sshConfig.host}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowSSHDialog(true)}>Change</Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setShowSSHDialog(true)} className="w-full">
                <Server className="w-4 h-4" />
                Configure SSH
              </Button>
            )}
          </div>
          {sshConfig && (
            <Input label="Remote Directory" value={remoteDir}
              onChange={(e) => setRemoteDir(e.target.value)} placeholder="/var/www" />
          )}
        </div>
      )}

      {fullPath && (
        <div className="px-3 py-2 rounded-md border"
          style={{ background: 'var(--dl-bg-raised)', borderColor: 'var(--dl-border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>Path: </span>
          <span className="text-xs font-mono" style={{ color: 'var(--dl-text-secondary)' }}>{fullPath}</span>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button onClick={handleCreate}
          disabled={isCreating || (mode === 'local' && !directory) || (mode === 'ssh' && (!sshConfig || !remoteDir))}>
          {isCreating ? 'Creating...' : 'Create Project'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
