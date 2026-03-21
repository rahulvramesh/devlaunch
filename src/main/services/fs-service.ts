import { readdir, stat, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

export async function readDirectory(dirPath: string): Promise<FileEntry[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })

  const result: FileEntry[] = entries
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => ({
      name: entry.name,
      path: join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }))

  result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })

  return result
}

export async function createDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

export async function pathExists(dirPath: string): Promise<boolean> {
  try {
    await stat(dirPath)
    return true
  } catch {
    return false
  }
}
