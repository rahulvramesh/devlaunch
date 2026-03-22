import * as pty from 'node-pty'
import { Client } from 'ssh2'
import { execSync } from 'child_process'
import { connect, execCommand, SSHConnectionConfig } from './ssh-manager'

// --- Types ---

export interface TmuxWindow {
  windowId: string    // tmux @N
  paneId: string      // tmux %N
  terminalId: string  // DevLaunch tab ID
  name: string
}

export interface TmuxSessionInfo {
  sessionName: string
  windowCount: number
  attached: boolean
}

export type TmuxEvent =
  | { type: 'output'; paneId: string; data: string }
  | { type: 'begin'; time: number; cmdNum: number; flags: number }
  | { type: 'end'; time: number; cmdNum: number; flags: number }
  | { type: 'error'; time: number; cmdNum: number; flags: number }
  | { type: 'session-changed'; sessionId: string; name: string }
  | { type: 'window-add'; windowId: string }
  | { type: 'window-close'; windowId: string }
  | { type: 'window-renamed'; windowId: string; name: string }
  | { type: 'exit'; reason?: string }
  | { type: 'unknown'; raw: string }

// --- Transport Abstraction ---

interface TmuxTransport {
  write(data: string): void
  onData(cb: (data: string) => void): void
  onClose(cb: () => void): void
  close(): void
}

class PtyTransport implements TmuxTransport {
  private ptyProcess: pty.IPty

  constructor(sessionName: string, cwd: string) {
    this.ptyProcess = pty.spawn('tmux', ['-CC', 'new-session', '-A', '-s', sessionName], {
      name: 'xterm-256color',
      cwd,
      env: process.env as Record<string, string>
    })
  }

  write(data: string): void {
    this.ptyProcess.write(data)
  }

  onData(cb: (data: string) => void): void {
    this.ptyProcess.onData(cb)
  }

  onClose(cb: () => void): void {
    this.ptyProcess.onExit(cb)
  }

  close(): void {
    this.ptyProcess.kill()
  }
}

class SshTransport implements TmuxTransport {
  private stream: any
  private dataCallbacks: Array<(data: string) => void> = []
  private closeCallbacks: Array<() => void> = []

  constructor(
    private client: Client,
    sessionName: string,
    cwd: string
  ) {
    this.stream = null
    this.init(sessionName, cwd)
  }

  private init(sessionName: string, cwd: string): void {
    this.client.exec(
      `cd ${cwd} && tmux -CC new-session -A -s ${sessionName}`,
      { pty: { term: 'xterm-256color', cols: 80, rows: 24, width: 0, height: 0 } },
      (err, stream) => {
        if (err) {
          this.closeCallbacks.forEach((cb) => cb())
          return
        }
        this.stream = stream
        stream.on('data', (data: Buffer) => {
          this.dataCallbacks.forEach((cb) => cb(data.toString()))
        })
        stream.on('close', () => {
          this.closeCallbacks.forEach((cb) => cb())
        })
        stream.stderr.on('data', (data: Buffer) => {
          this.dataCallbacks.forEach((cb) => cb(data.toString()))
        })
      }
    )
  }

  write(data: string): void {
    if (this.stream) {
      this.stream.write(data)
    }
  }

  onData(cb: (data: string) => void): void {
    this.dataCallbacks.push(cb)
  }

  onClose(cb: () => void): void {
    this.closeCallbacks.push(cb)
  }

  close(): void {
    if (this.stream) {
      this.stream.close()
    }
  }
}

// --- Protocol Parser ---

interface PendingCommand {
  cmdNum: number
  resolve: (result: string) => void
  reject: (error: Error) => void
  output: string
}

export class TmuxControlModeParser {
  private lineBuffer = ''
  private pendingCommands = new Map<number, PendingCommand>()
  private cmdCounter = 0
  private activeCmdNum: number | null = null
  private activeCmdOutput = ''

  feed(rawData: string): TmuxEvent[] {
    this.lineBuffer += rawData
    const events: TmuxEvent[] = []
    const lines = this.lineBuffer.split('\n')

    // Keep the last incomplete line in the buffer
    this.lineBuffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '')
      const event = this.parseLine(trimmed)
      if (event) {
        events.push(event)
      }
    }

    return events
  }

  private parseLine(line: string): TmuxEvent | null {
    // %output %<paneId> <data>
    if (line.startsWith('%output ')) {
      const match = line.match(/^%output %([\d]+) (.*)$/)
      if (match) {
        return {
          type: 'output',
          paneId: `%${match[1]}`,
          data: TmuxControlModeParser.decodeOutput(match[2])
        }
      }
    }

    // %begin <time> <cmdNum> <flags>
    if (line.startsWith('%begin ')) {
      const parts = line.split(' ')
      const time = parseInt(parts[1], 10)
      const cmdNum = parseInt(parts[2], 10)
      const flags = parseInt(parts[3], 10)
      this.activeCmdNum = cmdNum
      this.activeCmdOutput = ''
      return { type: 'begin', time, cmdNum, flags }
    }

    // %end <time> <cmdNum> <flags>
    if (line.startsWith('%end ')) {
      const parts = line.split(' ')
      const time = parseInt(parts[1], 10)
      const cmdNum = parseInt(parts[2], 10)
      const flags = parseInt(parts[3], 10)
      this.activeCmdNum = null
      const pending = this.pendingCommands.get(cmdNum)
      if (pending) {
        pending.resolve(this.activeCmdOutput.trim())
        this.pendingCommands.delete(cmdNum)
      }
      this.activeCmdOutput = ''
      return { type: 'end', time, cmdNum, flags }
    }

    // %error <time> <cmdNum> <flags>
    if (line.startsWith('%error ')) {
      const parts = line.split(' ')
      const time = parseInt(parts[1], 10)
      const cmdNum = parseInt(parts[2], 10)
      const flags = parseInt(parts[3], 10)
      this.activeCmdNum = null
      const pending = this.pendingCommands.get(cmdNum)
      if (pending) {
        pending.reject(new Error(this.activeCmdOutput.trim() || 'tmux command error'))
        this.pendingCommands.delete(cmdNum)
      }
      this.activeCmdOutput = ''
      return { type: 'error', time, cmdNum, flags }
    }

    // %session-changed $<id> <name>
    if (line.startsWith('%session-changed ')) {
      const match = line.match(/^%session-changed \$(\d+) (.+)$/)
      if (match) {
        return { type: 'session-changed', sessionId: `$${match[1]}`, name: match[2] }
      }
    }

    // %window-add @<id>
    if (line.startsWith('%window-add ')) {
      const match = line.match(/^%window-add @(\d+)$/)
      if (match) {
        return { type: 'window-add', windowId: `@${match[1]}` }
      }
    }

    // %window-close @<id>
    if (line.startsWith('%window-close ')) {
      const match = line.match(/^%window-close @(\d+)$/)
      if (match) {
        return { type: 'window-close', windowId: `@${match[1]}` }
      }
    }

    // %window-renamed @<id> <name>
    if (line.startsWith('%window-renamed ')) {
      const match = line.match(/^%window-renamed @(\d+) (.+)$/)
      if (match) {
        return { type: 'window-renamed', windowId: `@${match[1]}`, name: match[2] }
      }
    }

    // %exit [reason]
    if (line.startsWith('%exit')) {
      const reason = line.length > 5 ? line.substring(6).trim() : undefined
      return { type: 'exit', reason }
    }

    // Inside a command block — accumulate output
    if (this.activeCmdNum !== null) {
      this.activeCmdOutput += line + '\n'
      return null
    }

    // Ignore empty lines and unknown protocol messages
    if (line.trim() === '') return null

    return { type: 'unknown', raw: line }
  }

  sendCommand(writeFn: (data: string) => void, command: string): Promise<string> {
    const cmdNum = this.cmdCounter++
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(cmdNum)
        reject(new Error(`tmux command timed out: ${command}`))
      }, 10000)

      this.pendingCommands.set(cmdNum, {
        cmdNum,
        resolve: (result) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (err) => {
          clearTimeout(timeout)
          reject(err)
        },
        output: ''
      })

      writeFn(command + '\n')
    })
  }

  static decodeOutput(encoded: string): string {
    return encoded.replace(/\\(\d{3})|\\(.)/g, (_match, octal, char) => {
      if (octal) {
        return String.fromCharCode(parseInt(octal, 8))
      }
      switch (char) {
        case 'n': return '\n'
        case 'r': return '\r'
        case 't': return '\t'
        case '\\': return '\\'
        default: return '\\' + char
      }
    })
  }

  cleanup(): void {
    for (const [, pending] of this.pendingCommands) {
      pending.reject(new Error('Parser cleaned up'))
    }
    this.pendingCommands.clear()
  }
}

// --- Session Manager ---

interface ManagedSession {
  sessionName: string
  transport: TmuxTransport
  parser: TmuxControlModeParser
  windows: Map<string, TmuxWindow>  // keyed by paneId
  projectPath: string
  onOutput: (terminalId: string, data: string) => void
  onWindowAdd: (windowId: string) => void
  onWindowClose: (windowId: string) => void
  onWindowRenamed: (windowId: string, name: string) => void
  onExit: (reason?: string) => void
}

const activeSessions = new Map<string, ManagedSession>()

export async function isTmuxAvailable(
  transport: 'local' | 'ssh',
  sshConfig?: SSHConnectionConfig
): Promise<{ available: boolean; version?: string }> {
  try {
    if (transport === 'local') {
      if (process.platform === 'win32') {
        return { available: false }
      }
      const version = execSync('tmux -V 2>/dev/null', { encoding: 'utf-8' }).trim()
      return { available: true, version }
    } else if (sshConfig) {
      const client = await connect(sshConfig)
      const result = await execCommand(client, 'tmux -V 2>/dev/null')
      if (result.code === 0 && result.stdout.trim()) {
        return { available: true, version: result.stdout.trim() }
      }
      return { available: false }
    }
    return { available: false }
  } catch {
    return { available: false }
  }
}

export async function listSessions(
  transport: 'local' | 'ssh',
  sshConfig?: SSHConnectionConfig
): Promise<TmuxSessionInfo[]> {
  try {
    const cmd = "tmux list-sessions -F '#{session_name} #{session_windows} #{session_attached}' 2>/dev/null"
    let output: string

    if (transport === 'local') {
      output = execSync(cmd, { encoding: 'utf-8' })
    } else if (sshConfig) {
      const client = await connect(sshConfig)
      const result = await execCommand(client, cmd)
      if (result.code !== 0) return []
      output = result.stdout
    } else {
      return []
    }

    return output
      .trim()
      .split('\n')
      .filter((line) => line.startsWith('dl-'))
      .map((line) => {
        const parts = line.split(' ')
        return {
          sessionName: parts[0],
          windowCount: parseInt(parts[1], 10) || 1,
          attached: parts[2] === '1'
        }
      })
  } catch {
    return []
  }
}

interface CreateSessionOpts {
  sessionName: string
  projectPath: string
  transport: 'local' | 'ssh'
  sshConfig?: SSHConnectionConfig
  initialTerminalId: string
  onOutput: (terminalId: string, data: string) => void
  onWindowAdd: (windowId: string) => void
  onWindowClose: (windowId: string) => void
  onWindowRenamed: (windowId: string, name: string) => void
  onExit: (reason?: string) => void
}

export async function createSession(opts: CreateSessionOpts): Promise<{
  success: boolean
  error?: string
  windows?: Array<{ windowId: string; paneId: string; name: string }>
}> {
  try {
    // Kill existing managed session with same name
    const existing = activeSessions.get(opts.sessionName)
    if (existing) {
      existing.parser.cleanup()
      existing.transport.close()
      activeSessions.delete(opts.sessionName)
    }

    let transport: TmuxTransport

    if (opts.transport === 'ssh' && opts.sshConfig) {
      const client = await connect(opts.sshConfig)
      transport = new SshTransport(client, opts.sessionName, opts.projectPath)
    } else {
      transport = new PtyTransport(opts.sessionName, opts.projectPath)
    }

    const parser = new TmuxControlModeParser()
    const session: ManagedSession = {
      sessionName: opts.sessionName,
      transport,
      parser,
      windows: new Map(),
      projectPath: opts.projectPath,
      onOutput: opts.onOutput,
      onWindowAdd: opts.onWindowAdd,
      onWindowClose: opts.onWindowClose,
      onWindowRenamed: opts.onWindowRenamed,
      onExit: opts.onExit
    }

    activeSessions.set(opts.sessionName, session)

    // Process transport data through parser
    transport.onData((data) => {
      const events = parser.feed(data)
      for (const event of events) {
        handleEvent(session, event)
      }
    })

    transport.onClose(() => {
      session.onExit('transport closed')
      activeSessions.delete(opts.sessionName)
    })

    // Wait for initial session setup — tmux -CC emits events on connect
    // Give it a moment to stabilize, then query windows
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Query existing windows
    const windows = await queryWindows(session, opts.initialTerminalId)

    return { success: true, windows }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

async function queryWindows(
  session: ManagedSession,
  initialTerminalId: string
): Promise<Array<{ windowId: string; paneId: string; name: string }>> {
  try {
    const result = await session.parser.sendCommand(
      (data) => session.transport.write(data),
      "list-windows -F '#{window_id} #{pane_id} #{window_name}'"
    )

    const windows: Array<{ windowId: string; paneId: string; name: string }> = []
    const lines = result.trim().split('\n').filter(Boolean)

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(' ')
      const windowId = parts[0]
      const paneId = parts[1]
      const name = parts.slice(2).join(' ') || `Terminal ${i + 1}`

      // First window maps to the initial terminal ID
      const terminalId = i === 0 ? initialTerminalId : `tmux-restore-${Date.now()}-${i}`

      session.windows.set(paneId, {
        windowId,
        paneId,
        terminalId,
        name
      })

      windows.push({ windowId, paneId, name })
    }

    return windows
  } catch {
    // If query fails, assume one default window
    return []
  }
}

function handleEvent(session: ManagedSession, event: TmuxEvent): void {
  switch (event.type) {
    case 'output': {
      const window = session.windows.get(event.paneId)
      if (window) {
        session.onOutput(window.terminalId, event.data)
      }
      break
    }
    case 'window-add':
      session.onWindowAdd(event.windowId)
      break
    case 'window-close': {
      // Find and remove the window
      for (const [paneId, win] of session.windows) {
        if (win.windowId === event.windowId) {
          session.windows.delete(paneId)
          break
        }
      }
      session.onWindowClose(event.windowId)
      break
    }
    case 'window-renamed':
      session.onWindowRenamed(event.windowId, event.name)
      break
    case 'exit':
      session.onExit(event.reason)
      activeSessions.delete(session.sessionName)
      break
  }
}

export async function createWindow(
  sessionName: string,
  terminalId: string,
  windowName?: string
): Promise<{ success: boolean; windowId?: string; paneId?: string; error?: string }> {
  const session = activeSessions.get(sessionName)
  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  try {
    const nameArg = windowName ? `-n '${windowName}'` : ''
    const result = await session.parser.sendCommand(
      (data) => session.transport.write(data),
      `new-window ${nameArg} -P -F '#{window_id} #{pane_id}'`
    )

    const parts = result.trim().split(' ')
    const windowId = parts[0]
    const paneId = parts[1]

    session.windows.set(paneId, {
      windowId,
      paneId,
      terminalId,
      name: windowName || 'Terminal'
    })

    return { success: true, windowId, paneId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export function sendKeys(sessionName: string, terminalId: string, data: string): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  // Find pane by terminalId
  let targetPaneId: string | undefined
  for (const [, win] of session.windows) {
    if (win.terminalId === terminalId) {
      targetPaneId = win.paneId
      break
    }
  }

  if (!targetPaneId) return

  // Use hex encoding for binary safety
  const hexBytes = Buffer.from(data, 'utf-8')
  const hexParts: string[] = []
  for (let i = 0; i < hexBytes.length; i++) {
    hexParts.push(hexBytes[i].toString(16).padStart(2, '0'))
  }
  const hex = hexParts.join(' ')

  session.transport.write(`send-keys -t ${targetPaneId} -H ${hex}\n`)
}

export function resizePane(sessionName: string, terminalId: string, cols: number, rows: number): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  let targetPaneId: string | undefined
  for (const [, win] of session.windows) {
    if (win.terminalId === terminalId) {
      targetPaneId = win.paneId
      break
    }
  }

  if (!targetPaneId) return

  session.transport.write(`resize-pane -t ${targetPaneId} -x ${cols} -y ${rows}\n`)
}

export function killWindow(sessionName: string, terminalId: string): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  for (const [paneId, win] of session.windows) {
    if (win.terminalId === terminalId) {
      session.transport.write(`kill-window -t ${win.windowId}\n`)
      session.windows.delete(paneId)
      break
    }
  }
}

export function renameWindow(sessionName: string, terminalId: string, newName: string): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  for (const [, win] of session.windows) {
    if (win.terminalId === terminalId) {
      session.transport.write(`rename-window -t ${win.windowId} '${newName}'\n`)
      win.name = newName
      break
    }
  }
}

export async function capturePane(
  sessionName: string,
  terminalId: string,
  lines: number = 1000
): Promise<string> {
  const session = activeSessions.get(sessionName)
  if (!session) return ''

  let targetPaneId: string | undefined
  for (const [, win] of session.windows) {
    if (win.terminalId === terminalId) {
      targetPaneId = win.paneId
      break
    }
  }

  if (!targetPaneId) return ''

  try {
    return await session.parser.sendCommand(
      (data) => session.transport.write(data),
      `capture-pane -t ${targetPaneId} -p -S -${lines}`
    )
  } catch {
    return ''
  }
}

export function detachSession(sessionName: string): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  session.transport.write('detach-client\n')
  session.parser.cleanup()
  session.transport.close()
  activeSessions.delete(sessionName)
}

export async function killSession(sessionName: string): Promise<void> {
  const session = activeSessions.get(sessionName)
  if (session) {
    session.transport.write(`kill-session -t ${sessionName}\n`)
    session.parser.cleanup()
    session.transport.close()
    activeSessions.delete(sessionName)
  } else {
    // Session not managed but may exist — kill via exec
    try {
      execSync(`tmux kill-session -t ${sessionName} 2>/dev/null`)
    } catch {
      // Session doesn't exist, that's fine
    }
  }
}

export function detachAllSessions(): void {
  for (const [name] of activeSessions) {
    detachSession(name)
  }
}

export function getSession(sessionName: string): ManagedSession | undefined {
  return activeSessions.get(sessionName)
}

export function mapTerminalToWindow(sessionName: string, terminalId: string, paneId: string): void {
  const session = activeSessions.get(sessionName)
  if (!session) return

  const window = session.windows.get(paneId)
  if (window) {
    window.terminalId = terminalId
  }
}
