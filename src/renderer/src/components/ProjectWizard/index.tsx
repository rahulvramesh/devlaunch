import { useState } from 'react'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import StepName from './StepName'
import StepLocation from './StepLocation'

interface ProjectWizardProps {
  onCancel: () => void
  onCreated: (projectName: string, projectPath: string, mode: ConnectionMode, sshConfig?: SSHConfig) => void
}

const STEPS = [
  { num: 1, label: 'Project' },
  { num: 2, label: 'Location' }
]

export default function ProjectWizard({ onCancel, onCreated }: ProjectWizardProps): JSX.Element {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [directory, setDirectory] = useState('')

  function handleStepNameNext(name: string, _tmpl: string): void {
    setProjectName(name)
    setStep(2)
  }

  function handleCreate(dir: string, mode: ConnectionMode, sshConfig?: SSHConfig): void {
    setDirectory(dir)
    const fullPath = `${dir}/${projectName}`
    onCreated(projectName, fullPath, mode, sshConfig)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors
                    ${s.num === step
                      ? 'bg-orange-500 text-white'
                      : s.num < step
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-neutral-800 text-neutral-600'
                    }`}
                >
                  {s.num}
                </div>
                <span
                  className={`text-xs font-medium transition-colors
                    ${s.num === step ? 'text-neutral-200' : 'text-neutral-600'}`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-2 ${step > 1 ? 'bg-orange-500/30' : 'bg-neutral-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
          {step === 1 && (
            <StepName initialName={projectName} onNext={handleStepNameNext} onBack={onCancel} />
          )}
          {step === 2 && (
            <StepLocation
              projectName={projectName}
              initialDirectory={directory}
              onBack={() => setStep(1)}
              onCreate={handleCreate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
