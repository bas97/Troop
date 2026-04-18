import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  accent?: boolean
  hoverable?: boolean
}

export function Card({ children, accent, hoverable, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]',
        'p-5 transition-all duration-150',
        accent && 'border-[var(--accent)] border-opacity-30',
        hoverable && 'cursor-pointer hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('text-xs uppercase tracking-widest text-[var(--text-tertiary)] font-medium', className)}>
      {children}
    </span>
  )
}
