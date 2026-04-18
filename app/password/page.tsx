'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from   = params.get('from') ?? '/'

  const [value,   setValue]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: value, from }),
      })

      if (res.ok) {
        router.replace(from)
      } else {
        setError('Wrong password.')
        setValue('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
          <span className="text-[#0a0a0a] font-bold text-lg">T</span>
        </div>
        <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Troop</span>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          ref={inputRef}
          type="password"
          placeholder="Password"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-sm text-center tracking-widest"
        />

        {error && (
          <p className="text-xs text-[var(--danger)] text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!value || loading}
          className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-medium text-sm transition-all disabled:opacity-40 active:scale-[0.98]"
        >
          {loading ? '…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

export default function PasswordPage() {
  return (
    <Suspense>
      <PasswordForm />
    </Suspense>
  )
}
