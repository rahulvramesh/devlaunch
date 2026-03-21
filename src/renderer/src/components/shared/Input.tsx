import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`rounded-md border border-neutral-700/50 bg-neutral-900 px-3 py-2 text-sm text-neutral-100
          placeholder:text-neutral-600 transition-colors
          focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30
          disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}
