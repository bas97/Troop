'use client'

import { cn } from '@/lib/utils/cn'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  accentColor?: string
}

export function ProgressBar({ value, className, accentColor = 'var(--accent)' }: ProgressBarProps) {
  return (
    <div className={cn('h-0.5 bg-[var(--border)] rounded-full overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: accentColor }}
      />
    </div>
  )
}

interface CircularProgressProps {
  value: number  // 0-100
  size?: number
  strokeWidth?: number
  className?: string
}

export function CircularProgress({ value, size = 64, strokeWidth = 4, className }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className={cn('-rotate-90', className)}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--accent)" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}
