import Store from 'electron-store'

interface RecentProject {
  name: string
  path: string
  createdAt: string
  template: string
  isSSH?: boolean
  sshConfigId?: string
}

interface SavedSSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
}

interface TmuxSessionMeta {
  sessionName: string
  projectName: string
  projectPath: string
  connectionMode: 'local' | 'ssh'
  sshConfigId?: string
  windowNames: string[]
  lastAttached: string
}

interface StoreSchema {
  recentProjects: RecentProject[]
  savedConnections: SavedSSHConnection[]
  tmuxSessions: TmuxSessionMeta[]
}

const store = new Store<StoreSchema>({
  defaults: {
    recentProjects: [],
    savedConnections: [],
    tmuxSessions: []
  }
})

const MAX_RECENT = 10

export function getRecentProjects(): RecentProject[] {
  return store.get('recentProjects')
}

export function addRecentProject(project: RecentProject): void {
  const projects = store.get('recentProjects')
  const filtered = projects.filter((p) => p.path !== project.path)
  filtered.unshift(project)
  store.set('recentProjects', filtered.slice(0, MAX_RECENT))
}

export function removeRecentProject(path: string): void {
  const projects = store.get('recentProjects')
  store.set(
    'recentProjects',
    projects.filter((p) => p.path !== path)
  )
}

export function getSavedConnections(): SavedSSHConnection[] {
  return store.get('savedConnections')
}

export function saveConnection(conn: SavedSSHConnection): void {
  const connections = store.get('savedConnections')
  const filtered = connections.filter((c) => c.id !== conn.id)
  filtered.push(conn)
  store.set('savedConnections', filtered)
}

export function removeConnection(id: string): void {
  const connections = store.get('savedConnections')
  store.set(
    'savedConnections',
    connections.filter((c) => c.id !== id)
  )
}

// tmux session persistence
export function getTmuxSessions(): TmuxSessionMeta[] {
  return store.get('tmuxSessions')
}

export function saveTmuxSession(meta: TmuxSessionMeta): void {
  const sessions = store.get('tmuxSessions')
  const filtered = sessions.filter((s) => s.sessionName !== meta.sessionName)
  filtered.push(meta)
  store.set('tmuxSessions', filtered)
}

export function removeTmuxSession(sessionName: string): void {
  const sessions = store.get('tmuxSessions')
  store.set(
    'tmuxSessions',
    sessions.filter((s) => s.sessionName !== sessionName)
  )
}

export function updateTmuxSessionTimestamp(sessionName: string): void {
  const sessions = store.get('tmuxSessions')
  store.set(
    'tmuxSessions',
    sessions.map((s) =>
      s.sessionName === sessionName ? { ...s, lastAttached: new Date().toISOString() } : s
    )
  )
}
