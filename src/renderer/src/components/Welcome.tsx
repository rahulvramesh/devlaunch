import { useEffect, useState } from 'react'
import { FolderPlus, Folder, Clock } from 'lucide-react'
import { ipc } from '../lib/ipc'
import { RecentProject } from '../lib/types'
import Button from './shared/Button'

interface WelcomeProps {
  onCreateProject: () => void
  onOpenProject: (project: RecentProject) => void
}

export default function Welcome({ onCreateProject, onOpenProject }: WelcomeProps): JSX.Element {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])

  useEffect(() => {
    ipc.getRecentProjects().then(setRecentProjects)
  }, [])

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-10 bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">DL</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-100">DevLaunch</h1>
        <p className="text-zinc-500 text-sm">Your guided project launcher</p>
      </div>

      <Button size="lg" onClick={onCreateProject}>
        <FolderPlus className="w-5 h-5 mr-2" />
        Create New Project
      </Button>

      {recentProjects.length > 0 && (
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500 font-medium">Recent Projects</span>
          </div>
          <div className="flex flex-col gap-1">
            {recentProjects.map((project) => (
              <button
                key={project.path}
                onClick={() => onOpenProject(project)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-left w-full"
              >
                <Folder className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{project.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{project.path}</div>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded shrink-0">
                  {project.template}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
