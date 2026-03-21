import { useState } from 'react'
import { FileCode2 } from 'lucide-react'
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
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Name your project</h2>
        <p className="text-sm text-zinc-500">Choose a name and template for your new project.</p>
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
        <label className="text-sm font-medium text-zinc-300 mb-2 block">Template</label>
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-blue-500 bg-blue-500/10 cursor-default">
            <FileCode2 className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-zinc-100">Next.js</div>
              <div className="text-xs text-zinc-500">Full-stack React framework</div>
            </div>
            <div className="ml-auto">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!name || !!error}>
          Next
        </Button>
      </div>
    </div>
  )
}
