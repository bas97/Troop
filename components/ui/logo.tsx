import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoMarkProps {
  size?: number
  className?: string
}

// Gorilla icon — dark background, white illustration, looks good at any size
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <div
      className={cn('rounded-xl overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/icon.png"
        alt="Troop"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority
      />
    </div>
  )
}

interface LogoProps {
  className?: string
  iconSize?: number
  showWordmark?: boolean
}

// Full logo: gorilla icon + "troop" wordmark
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
