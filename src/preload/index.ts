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
  terminalSpawn: (terminalId: string, cols: number, rows: number, cwd?: string): Promise<void> =>
    ipcRenderer.invoke('terminal:spawn', terminalId, cols, rows, cwd),
  terminalWrite: (terminalId: string, data: string): void => {
    ipcRenderer.send('terminal:data', terminalId, data)
  },
  terminalResize: (terminalId: string, cols: number, rows: number): void => {
    ipcRenderer.send('terminal:resize', terminalId, cols, rows)
  },
  terminalKill: (terminalId: string): void => {
    ipcRenderer.send('terminal:kill', terminalId)
  },
  onTerminalOutput: (callback: (terminalId: string, data: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, terminalId: string, data: string): void => callback(terminalId, data)
    ipcRenderer.on('terminal:output', handler)
    return () => {
      ipcRenderer.removeListener('terminal:output', handler)
    }
  },
  onTerminalExit: (callback: (terminalId: string, code: number) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, terminalId: string, code: number): void => callback(terminalId, code)
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
  sshShellSpawn: (terminalId: string, config: SSHConfig, cols: number, rows: number): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('ssh:shell:spawn', terminalId, config, cols, rows),
  sshShellWrite: (terminalId: string, data: string): void => {
    ipcRenderer.send('ssh:shell:data', terminalId, data)
  },
  sshShellResize: (terminalId: string, cols: number, rows: number): void => {
    ipcRenderer.send('ssh:shell:resize', terminalId, cols, rows)
  },
  sshShellKill: (terminalId: string): void => {
    ipcRenderer.send('ssh:shell:kill', terminalId)
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
  },

  // Auto-updater
  updaterCheck: (): Promise<void> => ipcRenderer.invoke('updater:check'),
  updaterDownload: (): Promise<void> => ipcRenderer.invoke('updater:download'),
  updaterInstall: (): Promise<void> => ipcRenderer.invoke('updater:install'),
  updaterGetVersion: (): Promise<string> => ipcRenderer.invoke('updater:getVersion'),
  onUpdaterStatus: (callback: (data: any) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: any): void => callback(data)
    ipcRenderer.on('updater:status', handler)
    return () => { ipcRenderer.removeListener('updater:status', handler) }
  }
}

export type DevLaunchAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
