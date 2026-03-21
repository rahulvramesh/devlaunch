import { contextBridge, ipcRenderer } from 'electron'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

export interface RecentProject {
  name: string
  path: string
  createdAt: string
  template: string
  isSSH?: boolean
  sshConfigId?: string
}

export interface ProjectConfig {
  name: string
  template: string
  directory: string
  isSSH?: boolean
  sshConfig?: SSHConfig
}

export interface GitStatus {
  branch: string
  changedFiles: number
  isRepo: boolean
}

export interface SSHConfig {
  id: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  privateKeyPath?: string
  passphrase?: string
  name?: string
}

export interface SavedSSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
}

const api = {
  // Terminal (local)
  terminalSpawn: (cols: number, rows: number, cwd?: string): Promise<void> =>
    ipcRenderer.invoke('terminal:spawn', cols, rows, cwd),
  terminalWrite: (data: string): void => {
    ipcRenderer.send('terminal:data', data)
  },
  terminalResize: (cols: number, rows: number): void => {
    ipcRenderer.send('terminal:resize', cols, rows)
  },
  terminalKill: (): void => {
    ipcRenderer.send('terminal:kill')
  },
  onTerminalOutput: (callback: (data: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: string): void => callback(data)
    ipcRenderer.on('terminal:output', handler)
    return () => {
      ipcRenderer.removeListener('terminal:output', handler)
    }
  },
  onTerminalExit: (callback: (code: number) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, code: number): void => callback(code)
    ipcRenderer.on('terminal:exit', handler)
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  // SSH
  sshTest: (config: SSHConfig): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('ssh:test', config),
  sshConnect: (config: SSHConfig): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('ssh:connect', config),
  sshDisconnect: (id: string): Promise<void> =>
    ipcRenderer.invoke('ssh:disconnect', id),
  sshShellSpawn: (config: SSHConfig, cols: number, rows: number): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('ssh:shell:spawn', config, cols, rows),
  sshShellWrite: (data: string): void => {
    ipcRenderer.send('ssh:shell:data', data)
  },
  sshShellResize: (cols: number, rows: number): void => {
    ipcRenderer.send('ssh:shell:resize', cols, rows)
  },
  sshShellKill: (): void => {
    ipcRenderer.send('ssh:shell:kill')
  },
  sshReadDirectory: (config: SSHConfig, dirPath: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke('ssh:readdir', config, dirPath),
  sshMkdir: (config: SSHConfig, dirPath: string): Promise<void> =>
    ipcRenderer.invoke('ssh:mkdir', config, dirPath),
  sshStat: (config: SSHConfig, remotePath: string): Promise<{ isDirectory: boolean } | null> =>
    ipcRenderer.invoke('ssh:stat', config, remotePath),

  // Filesystem (local)
  readDirectory: (dirPath: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke('fs:readdir', dirPath),
  createDirectory: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('fs:mkdir', dirPath),

  // Project
  createProject: (config: ProjectConfig): Promise<{ success: boolean; error?: string; projectPath?: string; scaffoldCommand?: string }> =>
    ipcRenderer.invoke('project:create', config),
  onProjectStatus: (callback: (message: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, message: string): void => callback(message)
    ipcRenderer.on('project:create:status', handler)
    return () => {
      ipcRenderer.removeListener('project:create:status', handler)
    }
  },

  // Git
  getGitStatus: (dirPath: string): Promise<GitStatus | null> =>
    ipcRenderer.invoke('git:status', dirPath),

  // Dialog
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectFolder'),
  selectFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectFile', filters),

  // Config/Store
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke('store:getRecentProjects'),
  addRecentProject: (project: RecentProject): Promise<void> =>
    ipcRenderer.invoke('store:addRecentProject', project),
  getSavedConnections: (): Promise<SavedSSHConnection[]> =>
    ipcRenderer.invoke('store:getSavedConnections'),
  saveConnection: (conn: SavedSSHConnection): Promise<void> =>
    ipcRenderer.invoke('store:saveConnection', conn),
  removeConnection: (id: string): Promise<void> =>
    ipcRenderer.invoke('store:removeConnection', id),

  // Port forwarding
  startPortScanning: (options: { isSSH: boolean; sshConnectionId?: string; interval?: number }): Promise<void> =>
    ipcRenderer.invoke('ports:startScanning', options),
  stopPortScanning: (): Promise<void> =>
    ipcRenderer.invoke('ports:stopScanning'),
  forwardPort: (sshConnectionId: string, remotePort: number): Promise<{ success: boolean; localPort?: number; error?: string }> =>
    ipcRenderer.invoke('ports:forward', sshConnectionId, remotePort),
  unforwardPort: (remotePort: number): Promise<void> =>
    ipcRenderer.invoke('ports:unforward', remotePort),
  getForwardedPorts: (): Promise<{ remotePort: number; localPort: number }[]> =>
    ipcRenderer.invoke('ports:getForwarded'),
  openInBrowser: (port: number): Promise<void> =>
    ipcRenderer.invoke('ports:openInBrowser', port),
  onPortsChanged: (callback: (data: { ports: any[]; newPorts: any[]; closedPorts: number[] }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: any): void => callback(data)
    ipcRenderer.on('ports:changed', handler)
    return () => { ipcRenderer.removeListener('ports:changed', handler) }
  },

  // File watcher
  startFileWatcher: (options: { rootPath: string; isSSH: boolean; sshConnectionId?: string; interval?: number }): Promise<void> =>
    ipcRenderer.invoke('filewatcher:start', options),
  stopFileWatcher: (): Promise<void> =>
    ipcRenderer.invoke('filewatcher:stop'),
  onFileChanged: (callback: (data: { event?: string; path?: string; rootPath: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: any): void => callback(data)
    ipcRenderer.on('filewatcher:changed', handler)
    return () => { ipcRenderer.removeListener('filewatcher:changed', handler) }
  }
}

export type DevLaunchAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
