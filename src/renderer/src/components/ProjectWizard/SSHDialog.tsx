import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Key, Lock, Trash2, Save } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { SSHConfig, SavedSSHConnection } from '../../lib/types'
import Button from '../shared/Button'
import Input from '../shared/Input'

interface SSHDialogProps {
  onConnect: (config: SSHConfig) => void
  onCancel: () => void
  initialConfig?: Partial<SSHConfig>
}

export default function SSHDialog({ onConnect, onCancel, initialConfig }: SSHDialogProps): JSX.Element {
  const [host, setHost] = useState(initialConfig?.host || '')
  const [port, setPort] = useState(String(initialConfig?.port || 22))
  const [username, setUsername] = useState(initialConfig?.username || '')
  const [authType, setAuthType] = useState<'password' | 'key'>(initialConfig?.authType || 'password')
  const [password, setPassword] = useState('')
  const [keyPath, setKeyPath] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [connectionName, setConnectionName] = useState(initialConfig?.name || '')

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [savedConnections, setSavedConnections] = useState<SavedSSHConnection[]>([])

  useEffect(() => {
    ipc.getSavedConnections().then(setSavedConnections)
  }, [])

  function buildConfig(): SSHConfig {
    return {
      id: `ssh-${host}-${username}`,
      host,
      port: parseInt(port) || 22,
      username,
      authType,
      password: authType === 'password' ? password : undefined,
      privateKeyPath: authType === 'key' ? keyPath : undefined,
      passphrase: authType === 'key' ? passphrase : undefined,
      name: connectionName || `${username}@${host}`
    }
  }

  async function handleTest(): Promise<void> {
    setTesting(true)
    setTestResult(null)
    const result = await ipc.sshTest(buildConfig())
    setTestResult(result)
    setTesting(false)
  }

  function handleConnect(): void {
    onConnect(buildConfig())
  }

  async function handleSave(): Promise<void> {
    const conn: SavedSSHConnection = {
      id: `ssh-${host}-${username}`,
      name: connectionName || `${username}@${host}`,
      host,
      port: parseInt(port) || 22,
      username,
      authType
    }
    await ipc.saveConnection(conn)
    const updated = await ipc.getSavedConnections()
    setSavedConnections(updated)
  }

  function loadSaved(conn: SavedSSHConnection): void {
    setHost(conn.host)
    setPort(String(conn.port))
    setUsername(conn.username)
    setAuthType(conn.authType)
    setConnectionName(conn.name)
    setPassword('')
    setKeyPath('')
    setPassphrase('')
    setTestResult(null)
  }

  async function handleDeleteSaved(id: string): Promise<void> {
    await ipc.removeConnection(id)
    const updated = await ipc.getSavedConnections()
    setSavedConnections(updated)
  }

  async function handleBrowseKey(): Promise<void> {
    const path = await ipc.selectFile([
      { name: 'SSH Keys', extensions: ['pem', 'key', 'pub', '*'] }
    ])
    if (path) setKeyPath(path)
  }

  const canTest = host && username && (authType === 'password' ? password : keyPath)

  return (
    <div className="flex flex-col gap-6">
      {/* Saved connections */}
      {savedConnections.length > 0 && (
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            Saved Connections
          </label>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {savedConnections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800/50 group"
              >
                <button
                  onClick={() => loadSaved(conn)}
                  className="flex-1 text-left text-sm text-zinc-300 truncate"
                >
                  {conn.name}
                  <span className="text-zinc-600 ml-2 text-xs">
                    {conn.host}:{conn.port}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteSaved(conn.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="10.0.0.5 or hostname" />
        </div>
        <Input label="Port" value={port} onChange={(e) => setPort(e.target.value)} placeholder="22" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="deploy" />
        <Input
          label="Connection Name (optional)"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder="My Server"
        />
      </div>

      {/* Auth type */}
      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 block">Authentication</label>
        <div className="flex gap-3">
          <button
            onClick={() => setAuthType('password')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              authType === 'password'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            Password
          </button>
          <button
            onClick={() => setAuthType('key')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              authType === 'key'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Key className="w-4 h-4" />
            SSH Key
          </button>
        </div>
      </div>

      {authType === 'password' ? (
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Private Key</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 truncate">
                {keyPath || 'No key selected'}
              </div>
              <Button variant="secondary" onClick={handleBrowseKey}>
                Browse
              </Button>
            </div>
          </div>
          <Input
            label="Passphrase (optional)"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Key passphrase"
          />
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            testResult.success
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {testResult.success ? (
            <Wifi className="w-4 h-4 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 shrink-0" />
          )}
          {testResult.success ? 'Connected successfully' : testResult.error || 'Connection failed'}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {host && username && (
            <Button variant="ghost" onClick={handleSave} title="Save connection">
              <Save className="w-4 h-4 mr-1.5" />
              Save
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleTest} disabled={!canTest || testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={handleConnect} disabled={!testResult?.success}>
            Connect & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
