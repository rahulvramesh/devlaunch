import { ipcMain } from 'electron'
import { join } from 'path'
import { templates } from '../templates/nextjs'
import { pathExists, createDirectory } from '../services/fs-service'
import { addRecentProject } from '../services/config-store'
import { connect, getSFTP } from '../services/ssh-manager'

async function ensureRemoteDir(sshConfig: any, dirPath: string): Promise<void> {
  const client = await connect(sshConfig)
  const sftp = await getSFTP(client)

  return new Promise<void>((resolve, reject) => {
    sftp.stat(dirPath, (err) => {
      if (!err) {
        resolve()
        return
      }
      // Directory doesn't exist — create it recursively via exec
      client.exec(`mkdir -p "${dirPath}"`, (execErr, stream) => {
        if (execErr) {
          reject(new Error(`Failed to create remote directory: ${execErr.message}`))
          return
        }
        stream.on('close', (code: number) => {
          if (code === 0) resolve()
          else reject(new Error(`mkdir -p failed with code ${code}`))
        })
        stream.resume()
      })
    })
  })
}

export function registerProjectIPC(): void {
  ipcMain.handle(
    'project:create',
    async (_event, config: { name: string; template: string; directory: string; isSSH?: boolean; sshConfig?: any }) => {
      const { name, template: templateId, directory, isSSH, sshConfig } = config

      const tmpl = templates[templateId]
      if (!tmpl) {
        return { success: false, error: `Unknown template: ${templateId}` }
      }

      // Ensure directory exists — create if missing
      if (isSSH && sshConfig) {
        try {
          await ensureRemoteDir(sshConfig, directory)
        } catch (err) {
          return { success: false, error: `Cannot create remote directory: ${err}` }
        }
      } else {
        const dirExists = await pathExists(directory)
        if (!dirExists) {
          try {
            await createDirectory(directory)
          } catch (err) {
            return { success: false, error: `Cannot create directory: ${err}` }
          }
        }
      }

      const projectPath = join(directory, name)
      const scaffoldCommand = tmpl.command(name)

      addRecentProject({
        name,
        path: projectPath,
        createdAt: new Date().toISOString(),
        template: templateId,
        isSSH: isSSH || false,
        sshConfigId: sshConfig?.id
      })

      return { success: true, projectPath, scaffoldCommand }
    }
  )
}
