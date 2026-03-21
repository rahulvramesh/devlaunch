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
          <h2 className="text-lg font-semibold text-white tracking-tight">SSH Connection</h2>
          <p className="text-sm text-neutral-500 mt-1">Configure your remote server.</p>
        </div>
        <SSHDialog onConnect={handleSSHConnected} onCancel={() => setShowSSHDialog(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">Choose location</h2>
        <p className="text-sm text-neutral-500 mt-1">Where should your project live?</p>
      </div>

      {/* Environment toggle */}
      <div>
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 block">
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
                ${mode === id
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/30'
                }`}
            >
              <Icon className={`w-4 h-4 ${mode === id ? 'text-orange-500' : 'text-neutral-500'}`} />
              <div>
                <div className={`text-sm font-medium ${mode === id ? 'text-white' : 'text-neutral-400'}`}>
                  {label}
                </div>
                <div className="text-[11px] text-neutral-600">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Location input */}
      {mode === 'local' ? (
        <div>
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 block">
            Project Folder
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border border-neutral-700/50 bg-neutral-900 text-sm text-neutral-400 truncate">
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
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 block">
              SSH Connection
            </label>
            {sshConfig ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-green-500/20 bg-green-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm text-green-400 flex-1 font-mono">
                  {sshConfig.username}@{sshConfig.host}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowSSHDialog(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setShowSSHDialog(true)} className="w-full">
                <Server className="w-4 h-4" />
                Configure SSH
              </Button>
            )}
          </div>
          {sshConfig && (
            <Input
              label="Remote Directory"
              value={remoteDir}
              onChange={(e) => setRemoteDir(e.target.value)}
              placeholder="/var/www or /home/user/projects"
            />
          )}
        </div>
      )}

      {fullPath && (
        <div className="px-3 py-2 rounded-md bg-neutral-900/50 border border-neutral-800/50">
          <span className="text-xs text-neutral-500">Project path: </span>
          <span className="text-xs text-neutral-300 font-mono">{fullPath}</span>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button
          onClick={handleCreate}
          disabled={
            isCreating ||
            (mode === 'local' && !directory) ||
            (mode === 'ssh' && (!sshConfig || !remoteDir))
          }
        >
          {isCreating ? 'Creating...' : 'Create Project'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
