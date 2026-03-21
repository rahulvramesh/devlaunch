import { ipcMain } from 'electron'
import { join } from 'path'
import { templates } from '../templates/nextjs'
import { pathExists } from '../services/fs-service'
import { addRecentProject } from '../services/config-store'

export function registerProjectIPC(): void {
  ipcMain.handle(
    'project:create',
    async (_event, config: { name: string; template: string; directory: string }) => {
      const { name, template: templateId, directory } = config

      const tmpl = templates[templateId]
      if (!tmpl) {
        return { success: false, error: `Unknown template: ${templateId}` }
      }

      const dirExists = await pathExists(directory)
      if (!dirExists) {
        return { success: false, error: `Directory does not exist: ${directory}` }
      }

      const projectPath = join(directory, name)
      const scaffoldCommand = tmpl.command(name)

      // Save to recent projects
      addRecentProject({
        name,
        path: projectPath,
        createdAt: new Date().toISOString(),
        template: templateId
      })

      return { success: true, projectPath, scaffoldCommand }
    }
  )
}
