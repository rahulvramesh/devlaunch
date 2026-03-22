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

export type AppView = 'welcome' | 'wizard' | 'open-existing' | 'dashboard'

export type ConnectionMode = 'local' | 'ssh'
