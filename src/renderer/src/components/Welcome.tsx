import { useEffect, useState } from 'react'
import { Plus, Folder, ArrowRight } from 'lucide-react'
import { ipc } from '../lib/ipc'
import { RecentProject } from '../lib/types'

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
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Subtle orange glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/5 blur-[120px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg px-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-lg font-bold text-white tracking-tight">DL</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white tracking-tight">DevLaunch</h1>
            <p className="text-neutral-500 text-sm mt-1">Create, launch, and manage projects</p>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateProject}
          className="group w-full flex items-center gap-4 px-5 py-4 rounded-lg
            border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/80
            hover:border-orange-500/30 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center
            group-hover:bg-orange-500/20 transition-colors">
            <Plus className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-white">New Project</div>
            <div className="text-xs text-neutral-500">Set up a new project from a template</div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-orange-500 transition-colors" />
        </button>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-neutral-800" />
              <span className="text-[11px] text-neutral-600 uppercase tracking-widest font-medium">
                Recent
              </span>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>
            <div className="flex flex-col gap-1">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => onOpenProject(project)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-md
                    hover:bg-neutral-800/50 transition-all duration-150 text-left w-full"
                >
                  <Folder className="w-4 h-4 text-neutral-600 group-hover:text-orange-500/70 shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-neutral-300 group-hover:text-white truncate transition-colors">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-neutral-600 truncate">{project.path}</div>
                  </div>
                  <span className="text-[10px] text-neutral-600 bg-neutral-800/80 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {project.template}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Version */}
      <div className="absolute bottom-4 text-[10px] text-neutral-700">v0.1.0</div>
    </div>
  )
}
