import { ipcMain } from 'electron'
import {
  getRecentProjects,
  addRecentProject,
  getSavedConnections,
  saveConnection,
  removeConnection
} from '../services/config-store'

export function registerStoreIPC(): void {
  ipcMain.handle('store:getRecentProjects', async () => {
    return getRecentProjects()
  })

  ipcMain.handle('store:addRecentProject', async (_event, project) => {
    addRecentProject(project)
  })

  ipcMain.handle('store:getSavedConnections', async () => {
    return getSavedConnections()
  })

  ipcMain.handle('store:saveConnection', async (_event, conn) => {
    saveConnection(conn)
  })

  ipcMain.handle('store:removeConnection', async (_event, id: string) => {
    removeConnection(id)
  })
}
