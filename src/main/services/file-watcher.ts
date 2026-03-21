import { watch, FSWatcher } from 'chokidar'
import { Client } from 'ssh2'
import { getSFTP } from './ssh-manager'

let localWatcher: FSWatcher | null = null
let remoteInterval: ReturnType<typeof setInterval> | null = null

// Track remote directory mtimes for change detection
const remoteDirMtimes = new Map<string, number>()

export function watchLocal(
  rootPath: string,
  onChange: (event: string, path: string) => void
): void {
  stopLocalWatch()

  localWatcher = watch(rootPath, {
    ignoreInitial: true,
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/out/**',
      '**/.next/**'
    ],
    depth: 5,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })

  localWatcher
    .on('add', (path) => onChange('add', path))
    .on('unlink', (path) => onChange('remove', path))
    .on('addDir', (path) => onChange('addDir', path))
    .on('unlinkDir', (path) => onChange('removeDir', path))
    .on('change', (path) => onChange('change', path))
}

export function stopLocalWatch(): void {
  if (localWatcher) {
    localWatcher.close()
    localWatcher = null
  }
}

export function watchRemote(
  client: Client,
  rootPath: string,
  intervalMs: number,
  onChange: () => void
): void {
  stopRemoteWatch()
  remoteDirMtimes.clear()

  async function checkChanges(): Promise<void> {
    try {
      const sftp = await getSFTP(client)
      const mtime = await getRemoteDirMtime(sftp, rootPath)
      const lastMtime = remoteDirMtimes.get(rootPath)

      if (lastMtime !== undefined && mtime !== lastMtime) {
        onChange()
      }

      remoteDirMtimes.set(rootPath, mtime)
    } catch {
      // Connection lost or dir doesn't exist
    }
  }

  // Initial check
  checkChanges()

  remoteInterval = setInterval(checkChanges, intervalMs)
}

function getRemoteDirMtime(sftp: any, dirPath: string): Promise<number> {
  return new Promise((resolve) => {
    sftp.stat(dirPath, (err: Error | null, stats: any) => {
      if (err) {
        resolve(0)
      } else {
        resolve(stats.mtime || 0)
      }
    })
  })
}

export function stopRemoteWatch(): void {
  if (remoteInterval) {
    clearInterval(remoteInterval)
    remoteInterval = null
  }
  remoteDirMtimes.clear()
}

export function stopAllWatchers(): void {
  stopLocalWatch()
  stopRemoteWatch()
}
