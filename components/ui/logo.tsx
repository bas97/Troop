import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoMarkProps {
  size?: number
  className?: string
}

// The gorilla icon — used as app icon, loading states, empty states
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <div
      className={cn('rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <Image
        src="/brand/icon.png"
        alt="Troop"
        width={size}
        height={size}
        className="object-contain"
        // Invert the dark-brown logo to white so it shows on dark backgrounds
        style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
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

// Full logo: icon + wordmark side by side
export function Logo({ className, iconSize = 32, showWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={iconSize} />
      {showWordmark && (
        <Image
          src="/brand/logotype.png"
          alt="troop"
          width={64}
          height={20}
          className="object-contain h-5 w-auto"
          // Render white on the dark background
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
          priority
        />
      )}
    </div>
  )
}
