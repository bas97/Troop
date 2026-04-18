'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { EQUIPMENT, EQUIPMENT_PROFILES_PRESETS } from '@/lib/data/skills'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { EquipmentProfile, UserPark } from '@/types'
import { LogoMark } from '@/components/ui/logo'
import { BackButton } from '@/components/ui/back-button'
import { searchCalisthenicParks } from '@/lib/supabase/parks'
import type { PlaceResult } from '@/lib/supabase/parks'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Avatar display + upload ──────────────────────────────────────────────────

function AvatarDisplay() {
  const userProfile      = useAppStore(s => s.userProfile)
  const updateUserProfile = useAppStore(s => s.updateUserProfile)
  const fileInputRef     = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      // Resize to 300×300 via Canvas API
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
          URL.revokeObjectURL(objectUrl)
          const canvas = document.createElement('canvas')
          canvas.width = 300
          canvas.height = 300
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('canvas')); return }
          ctx.drawImage(img, 0, 0, 300, 300)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('load')) }
        img.src = objectUrl
      })

      // Try Supabase Storage
      let publicUrl: string | null = null
      if (userProfile?.id) {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const sb = createClient()
          const blob = await (await fetch(dataUrl)).blob()
          const path = `${userProfile.id}.jpg`
          const { error } = await sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
          if (!error) {
            const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path)
            publicUrl = urlData.publicUrl
          }
        } catch {
          // Storage not configured — fall through to dataUrl
        }
      }

      updateUserProfile({ avatar_url: publicUrl ?? dataUrl })
    } catch {
      // ignore
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const avatarUrl = userProfile?.avatar_url

  return (
    <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={userProfile?.display_name ?? 'Avatar'}
          width={56}
          height={56}
          className="rounded-xl object-cover"
          style={{ width: 56, height: 56 }}
        />
      ) : (
        <LogoMark size={56} />
      )}

      {/* Camera button overlay */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: uploading ? 'var(--text-tertiary)' : '#f59e0b', transform: 'translate(25%, 25%)' }}
        aria-label="Change avatar"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ─── Equipment profile editor ─────────────────────────────────────────────────

function EquipmentProfileEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile?: Partial<EquipmentProfile>
  onSave: (name: string, ids: string[]) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(profile?.name ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set(profile?.equipment_ids ?? ['floor']))

  const toggle = (id: string) => {
    if (id === 'floor') return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-base)] z-50 px-5 pt-12 pb-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{profile?.id ? 'Edit profile' : 'New profile'}</h2>
        <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Cancel
        </button>
      </div>

      <input
        type="text"
        placeholder="Profile name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full mb-5 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] text-sm"
      />

      {/* Presets */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(Object.entries(EQUIPMENT_PROFILES_PRESETS) as [keyof typeof EQUIPMENT_PROFILES_PRESETS, { name: string; equipment_ids: string[] }][]).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => { setName(preset.name); setSelected(new Set(preset.equipment_ids)) }}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {EQUIPMENT.map(eq => {
          const active = selected.has(eq.id)
          const isFloor = eq.id === 'floor'
          return (
            <button
              key={eq.id}
              onClick={() => toggle(eq.id)}
              disabled={isFloor}
              className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
              style={{
                background: active ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                opacity: isFloor ? 0.5 : 1,
              }}
            >
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: active ? 'var(--accent)' : 'var(--text-tertiary)', background: active ? 'var(--accent)' : 'transparent' }}
              >
                {active && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{eq.name}</span>
            </button>
          )
        })}
      </div>

      <Button fullWidth size="lg" disabled={!name.trim()} onClick={() => onSave(name.trim(), Array.from(selected))}>
        Save profile
      </Button>
    </div>
  )
}

// ─── Equipment profiles section ───────────────────────────────────────────────

function EquipmentProfiles() {
  const profiles = useAppStore(s => s.equipmentProfiles)
  const activeId = useAppStore(s => s.activeEquipmentProfileId)
  const setActive = useAppStore(s => s.setActiveEquipmentProfile)
  const addProfile = useAppStore(s => s.addEquipmentProfile)
  const updateProfile = useAppStore(s => s.updateEquipmentProfile)
  const deleteProfile = useAppStore(s => s.deleteEquipmentProfile)
  const userProfile = useAppStore(s => s.userProfile)

  const [editing, setEditing] = useState<Partial<EquipmentProfile> | null>(null)
  const [creating, setCreating] = useState(false)

  const handleSave = (name: string, ids: string[]) => {
    if (editing?.id) {
      updateProfile(editing.id, { name, equipment_ids: ids })
    } else {
      addProfile({ name, is_default: profiles.length === 0, equipment_ids: ids, user_id: userProfile?.id ?? '' })
    }
    setEditing(null)
    setCreating(false)
  }

  if (editing || creating) {
    return (
      <EquipmentProfileEditor
        profile={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false) }}
      />
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Equipment profiles</div>
        <button
          onClick={() => setCreating(true)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {profiles.map(profile => {
          const isActive = profile.id === activeId
          return (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-4 rounded-xl border transition-all"
              style={{
                background: isActive ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <button onClick={() => setActive(profile.id)} className="flex-1 text-left">
                <div className="font-medium text-sm text-[var(--text-primary)]">{profile.name}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {profile.equipment_ids.length} items
                  {isActive && <span className="text-[var(--accent)] ml-2">● Active</span>}
                </div>
              </button>
              <button
                onClick={() => setEditing(profile)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2"
              >
                Edit
              </button>
              {profiles.length > 1 && (
                <button
                  onClick={() => deleteProfile(profile.id)}
                  className="text-xs text-[var(--danger)] hover:opacity-80 px-2"
                >
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Training spots section ───────────────────────────────────────────────────

function TrainingSpots() {
  const parks               = useAppStore(s => s.parks)
  const allowParkDiscovery  = useAppStore(s => s.allowParkDiscovery)
  const addPark             = useAppStore(s => s.addPark)
  const removePark          = useAppStore(s => s.removePark)
  const setAllowParkDiscovery = useAppStore(s => s.setAllowParkDiscovery)

  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const r = await searchCalisthenicParks(query)
      setResults(r)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = (place: PlaceResult) => {
    const park: UserPark = {
      placeId: place.placeId,
      name:    place.name,
      address: place.address,
      lat:     place.lat,
      lng:     place.lng,
    }
    addPark(park)
    setResults(prev => prev.filter(r => r.placeId !== place.placeId))
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Training spots</div>
        <span className="text-xs text-[var(--text-tertiary)]">+ Add</span>
      </div>

      {!hasApiKey ? (
        <Card>
          <p className="text-xs text-[var(--text-tertiary)]">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment to enable park search.
          </p>
        </Card>
      ) : (
        <>
          {/* Discovery toggle */}
          <div className="flex items-center justify-between mb-4 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <span className="text-sm text-[var(--text-primary)]">Allow people to find me at my parks</span>
            <button
              onClick={() => setAllowParkDiscovery(!allowParkDiscovery)}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: allowParkDiscovery ? 'var(--accent)' : 'var(--bg-overlay)' }}
              aria-label="Toggle park discovery"
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: allowParkDiscovery ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Search input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search for calisthenics parks..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {results.map(r => (
                <div key={r.placeId} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{r.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)] truncate">{r.address}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(r)}
                    className="text-xs text-[var(--accent)] font-medium flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Added parks chips */}
          {parks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {parks.map(park => (
                <div
                  key={park.placeId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)]"
                >
                  <span className="truncate max-w-[150px]">{park.name}</span>
                  <button
                    onClick={() => removePark(park.placeId)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors flex-shrink-0 ml-0.5"
                    aria-label={`Remove ${park.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Training log ─────────────────────────────────────────────────────────────

function TrainingLog() {
  const sessions = useAppStore(s => s.sessions)
  const recent = [...sessions]
    .filter(s => s.status === 'completed' || s.status === 'skipped')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)

  if (recent.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Training log</div>
        <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No sessions logged yet.</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Training log</div>
      <div className="flex flex-col gap-2">
        {recent.map(s => (
          <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: s.status === 'completed' ? 'var(--success)' : 'var(--text-tertiary)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">{s.session_label}</div>
              <div className="mono text-xs text-[var(--text-tertiary)]">{s.date}</div>
            </div>
            <div className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
              {s.status === 'completed'
                ? `${(s.logged_exercises ?? []).reduce((n, e) => n + e.actual_sets.length, 0)} sets`
                : 'skipped'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edit profile modal ───────────────────────────────────────────────────────

const DAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const userProfile    = useAppStore(s => s.userProfile)
  const updateProfile  = useAppStore(s => s.updateUserProfile)

  const [name, setName]   = useState(userProfile?.display_name ?? '')
  const [goal, setGoal]   = useState<'skill' | 'strength' | 'balanced'>(userProfile?.goal ?? 'balanced')
  const [freq, setFreq]   = useState<3 | 4 | 5>(userProfile?.training_frequency ?? 3)
  const [days, setDays]   = useState<number[]>(userProfile?.training_days ?? [1, 3, 5])

  const toggleDay = (d: number) => {
    setDays(prev => {
      if (prev.includes(d)) return prev.length <= freq ? prev : prev.filter(x => x !== d)
      return [...prev, d].sort((a, b) => a - b)
    })
  }

  const handleSave = () => {
    updateProfile({ display_name: name, goal, training_frequency: freq, training_days: days })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[var(--bg-base)] px-5 pt-12 pb-8 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Edit profile</h2>
        <button onClick={onClose} className="text-sm text-[var(--text-secondary)]">Cancel</button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="text-xs text-[var(--text-tertiary)] mb-2">Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] text-sm"
          />
        </div>

        <div>
          <div className="text-xs text-[var(--text-tertiary)] mb-2">Goal</div>
          <div className="flex gap-2">
            {(['skill', 'strength', 'balanced'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all"
                style={{ borderColor: goal === g ? 'var(--accent)' : 'var(--border)', background: goal === g ? 'var(--accent-muted)' : 'var(--bg-surface)', color: goal === g ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--text-tertiary)] mb-2">Training days per week</div>
          <div className="flex gap-2">
            {([3, 4, 5] as const).map(f => (
              <button
                key={f}
                onClick={() => setFreq(f)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium mono transition-all"
                style={{ borderColor: freq === f ? 'var(--accent)' : 'var(--border)', background: freq === f ? 'var(--accent-muted)' : 'var(--bg-surface)', color: freq === f ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                {f}×
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--text-tertiary)] mb-2">Training days</div>
          <div className="flex gap-1.5">
            {DAYS_FULL.map((d, i) => {
              const active = days.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className="flex-1 h-10 rounded-lg text-xs font-medium transition-all"
                  style={{ background: active ? 'var(--accent-muted)' : 'var(--bg-elevated)', color: active ? 'var(--accent)' : 'var(--text-tertiary)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}
                >
                  {d[0]}
                </button>
              )
            })}
          </div>
        </div>

        <Button fullWidth size="lg" disabled={!name.trim()} onClick={handleSave} className="mt-2">
          Save changes
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const userProfile = useAppStore(s => s.userProfile)
  const getStreak = useAppStore(s => s.getStreak)
  const sessions = useAppStore(s => s.sessions)
  const personalRecords = useAppStore(s => s.personalRecords)

  const [editingProfile, setEditingProfile] = useState(false)

  const streak = getStreak()
  const totalSessions = sessions.filter(s => s.status === 'completed').length

  return (
    <div className="px-5 pt-12 page-enter">
      <AnimatePresence>
        {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
      </AnimatePresence>

      <BackButton className="mb-2" />
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <AvatarDisplay />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {userProfile?.display_name ?? 'Athlete'}
          </h1>
          <div className="text-sm text-[var(--text-secondary)]">
            Training since {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
        <button
          onClick={() => setEditingProfile(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] px-3 py-1.5 rounded-lg transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Sessions', value: totalSessions },
          { label: 'PRs', value: personalRecords.length },
          { label: 'Streak', value: `${streak}d` },
        ].map(stat => (
          <Card key={stat.label} className="text-center p-4">
            <div className="mono text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Schedule info */}
      {userProfile && (
        <Card className="mb-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Training schedule</div>
          <div className="flex gap-1.5">
            {DAYS.map((day, i) => {
              const active = userProfile.training_days.includes(i)
              return (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center"
                  style={{
                    background: active ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                    color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {day[0]}
                </div>
              )
            })}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-2">
            {userProfile.training_frequency} days/week · Goal: {userProfile.goal}
          </div>
        </Card>
      )}

      <EquipmentProfiles />
      <TrainingSpots />
      <TrainingLog />
    </div>
  )
}
