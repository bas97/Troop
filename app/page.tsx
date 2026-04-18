'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store/app-store'

export default function RootPage() {
  const router = useRouter()
  const userProfile = useAppStore(s => s.userProfile)
  const onboardingCompleted = userProfile?.onboarding_completed

  useEffect(() => {
    if (onboardingCompleted) {
      router.replace('/today')
    } else {
      router.replace('/onboarding')
    }
  }, [onboardingCompleted, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
    </div>
  )
}
