import { useState } from 'react'
import { FileCode2, ArrowLeft, ArrowRight } from 'lucide-react'
import Input from '../shared/Input'
import Button from '../shared/Button'

interface StepNameProps {
  initialName: string
  onNext: (name: string, template: string) => void
  onBack: () => void
}

const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9-]*$/

export default function StepName({ initialName, onNext, onBack }: StepNameProps): JSX.Element {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')

  function validate(value: string): string {
    if (!value) return 'Project name is required'
    if (value.length < 2) return 'Must be at least 2 characters'
    if (value.length > 50) return 'Must be 50 characters or fewer'
    if (!PROJECT_NAME_RE.test(value)) return 'Lowercase letters, numbers, and hyphens only'
    return ''
  }

  function handleChange(value: string): void {
    setName(value)
    if (error) setError(validate(value))
  }

  function handleNext(): void {
    const err = validate(name)
    if (err) {
      setError(err)
      return
    }
    onNext(name, 'nextjs')
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--dl-text)' }}>
          Name your project
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>
          Choose a name and select a framework template.
        </p>
      </div>

      <Input
        label="Project Name"
        value={name}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        placeholder="my-awesome-app"
        error={error}
        autoFocus
      />

      <div>
        <label className="text-xs font-medium uppercase tracking-wider mb-2 block"
          style={{ color: 'var(--dl-text-muted)' }}>
          Template
        </label>
        <button
          className="w-full flex items-center gap-3 p-3 rounded-md border border-orange-500/30 bg-orange-500/5 text-left transition-colors">
          <div className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: 'var(--dl-bg-raised)', border: '1px solid var(--dl-border)' }}>
            <FileCode2 className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--dl-text)' }}>Next.js</div>
            <div className="text-xs" style={{ color: 'var(--dl-text-muted)' }}>Full-stack React framework</div>
          </div>
          <div className="w-3 h-3 rounded-full border-2 border-orange-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!name || !!error}>
          Continue
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
