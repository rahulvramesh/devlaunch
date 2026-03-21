import * as pty from 'node-pty'
import os from 'os'

const activePtys = new Map<string, pty.IPty>()

function getDefaultShell(): string {
  if (os.platform() === 'win32') {
    return process.env.COMSPEC || 'powershell.exe'
  }
  return process.env.SHELL || '/bin/bash'
}

export function createPty(
  id: string,
  cols: number,
  rows: number,
  cwd?: string
): pty.IPty {
  killPty(id)

  const shell = getDefaultShell()
  const term = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: cwd || os.homedir(),
    env: process.env as Record<string, string>
  })

  activePtys.set(id, term)
  return term
}

export function writeToPty(id: string, data: string): void {
  const term = activePtys.get(id)
  if (term) {
    term.write(data)
  }
}

export function resizePty(id: string, cols: number, rows: number): void {
  const term = activePtys.get(id)
  if (term) {
    term.resize(cols, rows)
  }
}

export function killPty(id: string): void {
  const term = activePtys.get(id)
  if (term) {
    term.kill()
    activePtys.delete(id)
  }
}

export function getPty(id: string): pty.IPty | undefined {
  return activePtys.get(id)
}

export function killAll(): void {
  for (const [id] of activePtys) {
    killPty(id)
  }
}
