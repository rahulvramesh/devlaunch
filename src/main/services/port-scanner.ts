import { execSync } from 'child_process'
import os from 'os'
import net from 'net'
import { Client } from 'ssh2'

export interface DetectedPort {
  port: number
  pid?: number
  process?: string
}

// Ports to ignore (system services, common noise)
// System services, VNC, X11, DNS, printing, mDNS, DBus
const IGNORED_PORTS = new Set([22, 53, 631, 5353, 5900, 5901, 6000, 6001, 6080, 6081, 3389, 4713, 43249])

export function scanLocalPorts(): DetectedPort[] {
  try {
    const platform = os.platform()
    let output: string

    if (platform === 'win32') {
      output = execSync('netstat -ano -p TCP', { encoding: 'utf-8', timeout: 5000 })
      return parseWindowsNetstat(output)
    } else {
      // Linux/macOS — use ss or lsof
      try {
        output = execSync('ss -tlnp 2>/dev/null', { encoding: 'utf-8', timeout: 5000 })
        return parseSSOutput(output)
      } catch {
        output = execSync('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null || true', {
          encoding: 'utf-8',
          timeout: 5000
        })
        return parseLsofOutput(output)
      }
    }
  } catch {
    return []
  }
}

function parseSSOutput(output: string): DetectedPort[] {
  const ports: DetectedPort[] = []
  const lines = output.split('\n').slice(1) // skip header

  for (const line of lines) {
    const match = line.match(/:(\d+)\s/)
    if (!match) continue
    const port = parseInt(match[1])
    if (IGNORED_PORTS.has(port)) continue

    const procMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/)
    ports.push({
      port,
      process: procMatch?.[1],
      pid: procMatch?.[2] ? parseInt(procMatch[2]) : undefined
    })
  }

  return ports
}

function parseLsofOutput(output: string): DetectedPort[] {
  const ports: DetectedPort[] = []
  const lines = output.split('\n').slice(1)

  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length < 9) continue

    const addrPort = parts[8]
    const portMatch = addrPort.match(/:(\d+)$/)
    if (!portMatch) continue

    const port = parseInt(portMatch[1])
    if (IGNORED_PORTS.has(port)) continue

    ports.push({
      port,
      process: parts[0],
      pid: parseInt(parts[1]) || undefined
    })
  }

  // Deduplicate by port
  const seen = new Set<number>()
  return ports.filter((p) => {
    if (seen.has(p.port)) return false
    seen.add(p.port)
    return true
  })
}

function parseWindowsNetstat(output: string): DetectedPort[] {
  const ports: DetectedPort[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    if (!line.includes('LISTENING')) continue
    const match = line.match(/:(\d+)\s+.*LISTENING\s+(\d+)/)
    if (!match) continue
    const port = parseInt(match[1])
    if (IGNORED_PORTS.has(port)) continue
    ports.push({ port, pid: parseInt(match[2]) })
  }

  return ports
}

export async function scanRemotePorts(client: Client): Promise<DetectedPort[]> {
  return new Promise((resolve) => {
    client.exec('ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || echo ""', (err, stream) => {
      if (err) {
        resolve([])
        return
      }

      let output = ''
      stream
        .on('data', (data: Buffer) => {
          output += data.toString()
        })
        .on('close', () => {
          if (output.includes('State') || output.includes('LISTEN')) {
            resolve(parseSSOutput(output))
          } else {
            resolve([])
          }
        })

      setTimeout(() => resolve([]), 5000)
    })
  })
}

export function createLocalForward(
  client: Client,
  remotePort: number,
  localPort?: number
): Promise<{ localPort: number; close: () => void }> {
  const targetLocalPort = localPort || remotePort

  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      client.forwardOut('127.0.0.1', targetLocalPort, '127.0.0.1', remotePort, (err, stream) => {
        if (err) {
          socket.destroy()
          return
        }
        socket.pipe(stream)
        stream.pipe(socket)

        socket.on('close', () => stream.end())
        stream.on('close', () => socket.end())
      })
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && !localPort) {
        // Try next port
        server.close()
        createLocalForward(client, remotePort, targetLocalPort + 1).then(resolve).catch(reject)
      } else {
        reject(err)
      }
    })

    server.listen(targetLocalPort, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      resolve({
        localPort: addr.port,
        close: () => server.close()
      })
    })
  })
}
