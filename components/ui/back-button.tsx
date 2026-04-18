'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface BackButtonProps {
  href?: string
  onClick?: () => void
  className?: string
}

export function BackButton({ href, onClick, className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Go back"
      className={cn(
        'flex items-center justify-center w-9 h-9 -ml-2 rounded-xl',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--bg-overlay)] transition-all duration-150 active:scale-95',
        className
      )}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
