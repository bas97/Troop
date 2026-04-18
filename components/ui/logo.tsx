import { cn } from '@/lib/utils/cn'

interface LogoMarkProps {
  size?: number
  className?: string
}

// Amber "T" mark in a rounded square
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const fontSize = Math.round(size * 0.5)
  return (
    <div
      className={cn('rounded-xl flex items-center justify-center flex-shrink-0', className)}
      style={{
        width: size,
        height: size,
        background: 'var(--accent)',
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        T
      </span>
    </div>
  )
}

interface LogoProps {
  className?: string
  iconSize?: number
  showWordmark?: boolean
}

// Full logo: amber T mark + "troop" wordmark
export function Logo({ className, iconSize = 32, showWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={iconSize} />
      {showWordmark && (
        <span
          style={{
            fontSize: Math.round(iconSize * 0.65),
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          troop
        </span>
      )}
    </div>
  )
}
