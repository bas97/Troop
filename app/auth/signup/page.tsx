'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })

      if (error) {
        setError(error.message)
      } else {
        setDone(true)
        router.replace('/onboarding')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[var(--bg-base)]">
        <Logo className="mb-8" iconSize={40} />
        <h2 className="text-xl font-semibold mb-2">You&apos;re in</h2>
        <p className="text-sm text-[var(--text-secondary)]">Setting up your profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-base)]">
      <Logo className="mb-12" iconSize={40} />

      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1 text-center">Join Troop</h1>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-8">Start your calisthenics journey</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            autoComplete="name"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />

          {error && <p className="text-xs text-[var(--danger)] text-center">{error}</p>}

          <button
            type="submit"
            disabled={!name || !email || !password || loading}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm transition-all disabled:opacity-40 active:scale-[0.98] mt-1"
          >
            {loading ? '…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent)] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
