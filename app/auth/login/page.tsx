'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') ?? '/today'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
      } else {
        router.replace(from)
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-base)]">
      <Logo className="mb-12" iconSize={40} />

      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-8">Sign in to your Troop account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />

          {error && <p className="text-xs text-[var(--danger)] text-center">{error}</p>}

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm transition-all disabled:opacity-40 active:scale-[0.98] mt-1"
          >
            {loading ? '…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          No account?{' '}
          <Link href="/auth/signup" className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent)] transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
