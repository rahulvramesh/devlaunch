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
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--dl-text-muted)' }}>
          {label}
        </label>
      )}
      <input
        className={`rounded-md border px-3 py-2 text-sm transition-colors
          focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30
          disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        style={{
          background: 'var(--dl-input-bg)',
          borderColor: 'var(--dl-input-border)',
          color: 'var(--dl-text)'
        }}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
