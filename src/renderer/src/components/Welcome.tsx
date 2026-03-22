import { useEffect, useState } from 'react'
import { Plus, Folder, FolderOpen, ArrowRight, Sun, Moon } from 'lucide-react'
import { ipc } from '../lib/ipc'
import { useTheme } from '../lib/theme'
import { RecentProject } from '../lib/types'

interface WelcomeProps {
  onCreateProject: () => void
  onOpenExisting: () => void
  onOpenProject: (project: RecentProject) => void
}

export default function Welcome({ onCreateProject, onOpenExisting, onOpenProject }: WelcomeProps): JSX.Element {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const { theme, toggle } = useTheme()

  useEffect(() => {
    ipc.getRecentProjects().then(setRecentProjects)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--dl-bg)' }}>
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 p-2 rounded-md transition-colors hover:bg-[var(--dl-bg-hover)]"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4" style={{ color: 'var(--dl-text-muted)' }} />
        ) : (
          <Moon className="w-4 h-4" style={{ color: 'var(--dl-text-muted)' }} />
        )}
      </button>

      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--dl-dot-color) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
          opacity: 'var(--dl-dot-opacity)'
        }}
      />

      {/* Subtle glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] blur-[120px] rounded-full"
        style={{ background: 'rgb(249 115 22)', opacity: 'var(--dl-glow-opacity)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg px-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-lg font-bold text-white tracking-tight">DL</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
              DevLaunch
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
              Create, launch, and manage projects
            </p>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateProject}
          className="group w-full flex items-center gap-4 px-5 py-4 rounded-lg border transition-all duration-200"
          style={{
            background: 'var(--dl-card-bg)',
            borderColor: 'var(--dl-border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'
            e.currentTarget.style.background = 'var(--dl-bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--dl-border)'
            e.currentTarget.style.background = 'var(--dl-card-bg)'
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center
            group-hover:bg-orange-500/20 transition-colors">
            <Plus className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium" style={{ color: 'var(--dl-text)' }}>New Project</div>
            <div className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>
              Set up a new project from a template
            </div>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:text-orange-500 transition-colors"
            style={{ color: 'var(--dl-text-muted)' }} />
        </button>

        {/* Open Existing Button */}
        <button
          onClick={onOpenExisting}
          className="group w-full flex items-center gap-4 px-5 py-4 rounded-lg border transition-all duration-200"
          style={{
            background: 'var(--dl-card-bg)',
            borderColor: 'var(--dl-border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--dl-border)'
            e.currentTarget.style.background = 'var(--dl-bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--dl-border)'
            e.currentTarget.style.background = 'var(--dl-card-bg)'
          }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--dl-bg-raised)', border: '1px solid var(--dl-border)' }}>
            <FolderOpen className="w-5 h-5" style={{ color: 'var(--dl-text-muted)' }} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium" style={{ color: 'var(--dl-text)' }}>Open Existing</div>
            <div className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>
              Open a local or remote project folder
            </div>
          </div>
          <ArrowRight className="w-4 h-4 transition-colors"
            style={{ color: 'var(--dl-text-muted)' }} />
        </button>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: 'var(--dl-border)' }} />
              <span className="text-[11px] uppercase tracking-widest font-medium"
                style={{ color: 'var(--dl-text-muted)' }}>
                Recent
              </span>
              <div className="h-px flex-1" style={{ background: 'var(--dl-border)' }} />
            </div>
            <div className="flex flex-col gap-1">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => onOpenProject(project)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-left w-full
                    hover:bg-[var(--dl-bg-hover)]"
                >
                  <Folder className="w-4 h-4 shrink-0 group-hover:text-orange-500/70 transition-colors"
                    style={{ color: 'var(--dl-text-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate transition-colors"
                      style={{ color: 'var(--dl-text-secondary)' }}>
                      {project.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--dl-text-muted)' }}>
                      {project.path}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                    style={{ color: 'var(--dl-text-muted)', background: 'var(--dl-bg-raised)' }}>
                    {project.template}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Version */}
      <div className="absolute bottom-4 text-[10px]" style={{ color: 'var(--dl-text-muted)' }}>v0.1.0</div>
    </div>
  )
}
