import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses = {
  primary:
    'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm',
  secondary:
    'bg-[var(--dl-bg-raised)] hover:bg-[var(--dl-bg-hover)] text-[var(--dl-text-secondary)] border-[var(--dl-border)]',
  ghost:
    'bg-transparent hover:bg-[var(--dl-bg-hover)] text-[var(--dl-text-muted)] hover:text-[var(--dl-text-secondary)] border-transparent'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border font-medium transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-1
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
