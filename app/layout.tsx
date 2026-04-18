import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SplashScreen } from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: 'Troop — Train with the Troop',
  description: 'Adaptive calisthenics skill-progression app. Open, see today\'s workout, tap start, train.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Troop',
    startupImage: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8f9fa',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
