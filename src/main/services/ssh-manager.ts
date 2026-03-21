import { Client, ConnectConfig, SFTPWrapper } from 'ssh2'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export interface SSHConnectionConfig {
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

interface ActiveConnection {
  client: Client
  config: SSHConnectionConfig
}

const connections = new Map<string, ActiveConnection>()

function buildConnectConfig(config: SSHConnectionConfig): ConnectConfig {
  const connectConfig: ConnectConfig = {
    host: config.host,
    port: config.port,
    username: config.username,
    readyTimeout: 10000
  }

  if (config.authType === 'password') {
    connectConfig.password = config.password
  } else if (config.authType === 'key' && config.privateKeyPath) {
    const keyPath = resolve(config.privateKeyPath)
    if (!existsSync(keyPath)) {
      throw new Error(`SSH key file not found: ${keyPath}`)
    }
    connectConfig.privateKey = readFileSync(keyPath)
    if (config.passphrase) {
      connectConfig.passphrase = config.passphrase
    }
  }

  return connectConfig
}

export function testConnection(config: SSHConnectionConfig): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const client = new Client()
    const timeout = setTimeout(() => {
      client.end()
      resolve({ success: false, error: 'Connection timed out' })
    }, 10000)

    client
      .on('ready', () => {
        clearTimeout(timeout)
        client.end()
        resolve({ success: true })
      })
      .on('error', (err) => {
        clearTimeout(timeout)
        resolve({ success: false, error: err.message })
      })
      .connect(buildConnectConfig(config))
  })
}

export function connect(config: SSHConnectionConfig): Promise<Client> {
  return new Promise((resolve, reject) => {
    // Reuse existing connection if alive
    const existing = connections.get(config.id)
    if (existing) {
      resolve(existing.client)
      return
    }

    const client = new Client()
    const timeout = setTimeout(() => {
      client.end()
      reject(new Error('Connection timed out'))
    }, 10000)

    client
      .on('ready', () => {
        clearTimeout(timeout)
        connections.set(config.id, { client, config })
        resolve(client)
      })
      .on('error', (err) => {
        clearTimeout(timeout)
        connections.delete(config.id)
        reject(err)
      })
      .on('close', () => {
        connections.delete(config.id)
      })
      .connect(buildConnectConfig(config))
  })
}

export function getConnection(id: string): Client | undefined {
  return connections.get(id)?.client
}

export function disconnect(id: string): void {
  const conn = connections.get(id)
  if (conn) {
    conn.client.end()
    connections.delete(id)
  }
}

export function disconnectAll(): void {
  for (const [id] of connections) {
    disconnect(id)
  }
}

export function getSFTP(client: Client): Promise<SFTPWrapper> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) reject(err)
      else resolve(sftp)
    })
  })
}

export function execCommand(client: Client, command: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) {
        reject(err)
        return
      }

      let stdout = ''
      let stderr = ''

      stream
        .on('close', (code: number) => {
          resolve({ stdout, stderr, code: code ?? 0 })
        })
        .on('data', (data: Buffer) => {
          stdout += data.toString()
        })
        .stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
    })
  })
}

export function createShellStream(client: Client, cols: number, rows: number): Promise<any> {
  return new Promise((resolve, reject) => {
    client.shell(
      {
        term: 'xterm-256color',
        cols,
        rows
      },
      (err, stream) => {
        if (err) reject(err)
        else resolve(stream)
      }
    )
  })
}
