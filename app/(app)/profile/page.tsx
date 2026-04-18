'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { EQUIPMENT, EQUIPMENT_PROFILES_PRESETS } from '@/lib/data/skills'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { EquipmentProfile } from '@/types'
import { LogoMark } from '@/components/ui/logo'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const userProfile = useAppStore(s => s.userProfile)
  const getStreak = useAppStore(s => s.getStreak)
  const sessions = useAppStore(s => s.sessions)
  const personalRecords = useAppStore(s => s.personalRecords)

  const streak = getStreak()
  const totalSessions = sessions.filter(s => s.status === 'completed').length

  return (
    <div className="px-5 pt-12 page-enter">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <LogoMark size={56} />
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {userProfile?.display_name ?? 'Athlete'}
          </h1>
          <div className="text-sm text-[var(--text-secondary)]">
            Training since {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
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
      <TrainingLog />
    </div>
  )
}
