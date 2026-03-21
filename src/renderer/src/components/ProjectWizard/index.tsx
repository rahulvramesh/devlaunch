import { useState } from 'react'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import StepName from './StepName'
import StepLocation from './StepLocation'

interface ProjectWizardProps {
  onCancel: () => void
  onCreated: (projectName: string, projectPath: string, mode: ConnectionMode, sshConfig?: SSHConfig) => void
}

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
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-lg mx-auto p-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-blue-600/30 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}
              >
                {s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 ${step > 1 ? 'bg-blue-600/50' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <StepName
            initialName={projectName}
            onNext={handleStepNameNext}
            onBack={onCancel}
          />
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
  )
}
