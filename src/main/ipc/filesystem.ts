import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readDirectory, createDirectory } from '../services/fs-service'

export function registerFilesystemIPC(): void {
  ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
    return readDirectory(dirPath)
  })

  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    return createDirectory(dirPath)
  })

  ipcMain.handle('dialog:selectFolder', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:selectFile', async (event, filters?: { name: string; extensions: string[] }[]) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
