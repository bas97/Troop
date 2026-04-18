'use client'

import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', fullWidth, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
        {
          // Variants
          'bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent-hover)]': variant === 'primary',
          'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-overlay)]': variant === 'secondary',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]': variant === 'ghost',
          'bg-[var(--danger)] text-white hover:opacity-90': variant === 'danger',
          // Sizes
          'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
          'px-4 py-2.5 text-sm gap-2': size === 'md',
          'px-6 py-3.5 text-base gap-2': size === 'lg',
          // Width
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
