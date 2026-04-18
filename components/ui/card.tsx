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
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        accent && 'border-[var(--accent)]',
        hoverable && 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
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
