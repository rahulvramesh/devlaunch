import { ipcMain } from 'electron'
import simpleGit from 'simple-git'

export function registerGitIPC(): void {
  ipcMain.handle('git:status', async (_event, dirPath: string) => {
    try {
      const git = simpleGit(dirPath)
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return null
      }
      const status = await git.status()
      return {
        branch: status.current || 'unknown',
        changedFiles: status.files.length,
        isRepo: true
      }
    } catch {
      return null
    }
  })
}
