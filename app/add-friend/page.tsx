'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store/app-store'
import { Logo } from '@/components/ui/logo'
import { BackButton } from '@/components/ui/back-button'

function AddFriendForm() {
  const params  = useSearchParams()
  const router  = useRouter()
  const addFriend = useAppStore(s => s.addFriend)
  const friends   = useAppStore(s => s.friends)

  const id   = params.get('id')   ?? ''
  const name = params.get('name') ?? 'Unknown athlete'

  const [done, setDone] = useState(false)
  const alreadyFriend = friends.some(f => f.id === id)

  const handleAdd = () => {
    addFriend(id, name)
    setDone(true)
    setTimeout(() => router.replace('/community'), 1200)
  }

  if (!id) {
    return (
      <div className="text-center py-16 px-5">
        <p className="text-sm text-[var(--text-secondary)]">Invalid invite link.</p>
      </div>
    )
  }

  if (done || alreadyFriend) {
    return (
      <div className="text-center py-16 px-5">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">{alreadyFriend && !done ? 'Already friends' : `${name} added!`}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Heading to Friends…</p>
      </div>
    )
  }

  return (
    <div className="text-center py-16 px-5">
      <div
        className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white"
        style={{ fontSize: 36, letterSpacing: '-0.02em' }}
      >
        {name[0]?.toUpperCase()}
      </div>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">{name}</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">wants to train with you</p>
      <button
        onClick={handleAdd}
        className="w-full max-w-xs py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm active:scale-[0.98] transition-all"
      >
        Add to Troop
      </button>
    </div>
  )
}

export default function AddFriendPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-5 pt-12">
      <div className="flex items-center justify-between mb-8">
        <BackButton href="/community" />
        <Logo iconSize={28} />
      </div>
      <Suspense>
        <AddFriendForm />
      </Suspense>
    </div>
  )
}
