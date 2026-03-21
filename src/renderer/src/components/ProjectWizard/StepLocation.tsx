import { useState } from 'react'
import { Monitor, Server, FolderOpen } from 'lucide-react'
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
    if (selected) {
      setDirectory(selected)
    }
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
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">SSH Connection</h2>
          <p className="text-sm text-zinc-500">Configure your remote server connection.</p>
        </div>
        <SSHDialog
          onConnect={handleSSHConnected}
          onCancel={() => setShowSSHDialog(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Choose location</h2>
        <p className="text-sm text-zinc-500">Where should your project be created?</p>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 block">
          Development Environment
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('local')}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
              mode === 'local'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Monitor className={`w-5 h-5 ${mode === 'local' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className={`text-sm font-medium ${mode === 'local' ? 'text-zinc-100' : 'text-zinc-400'}`}>
              Local Machine
            </span>
          </button>
          <button
            onClick={() => setMode('ssh')}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
              mode === 'ssh'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Server className={`w-5 h-5 ${mode === 'ssh' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className={`text-sm font-medium ${mode === 'ssh' ? 'text-zinc-100' : 'text-zinc-400'}`}>
              Remote (SSH)
            </span>
          </button>
        </div>
      </div>

      {mode === 'local' ? (
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Project Folder</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 truncate">
              {directory || 'No folder selected'}
            </div>
            <Button variant="secondary" onClick={handleBrowse}>
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Browse
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* SSH Connection status */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">SSH Connection</label>
            {sshConfig ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-green-500/30 bg-green-500/10">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400 flex-1">
                  {sshConfig.name || `${sshConfig.username}@${sshConfig.host}`}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowSSHDialog(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setShowSSHDialog(true)}>
                <Server className="w-4 h-4 mr-1.5" />
                Configure SSH Connection
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
        <p className="text-xs text-zinc-500">
          Project will be created at: <span className="text-zinc-400">{fullPath}</span>
          {mode === 'ssh' && sshConfig && (
            <span className="text-zinc-600">
              {' '}on {sshConfig.host}
            </span>
          )}
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
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
        </Button>
      </div>
    </div>
  )
}
