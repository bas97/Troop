'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { SKILLS, EQUIPMENT, EQUIPMENT_PROFILES_PRESETS } from '@/lib/data/skills'
import { PROGRESSIONS } from '@/lib/data/progressions'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { BackButton } from '@/components/ui/back-button'
import type { UserProfile, UserSkillLevel, EquipmentProfile } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Step components
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 12,
            background: i <= current ? 'var(--accent)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type Goal = 'skill' | 'strength' | 'balanced'

function StepGoal({ onNext }: { onNext: (goal: Goal) => void }) {
  const [selected, setSelected] = useState<Goal | null>(null)

  const options: { value: Goal; title: string; description: string }[] = [
    { value: 'skill',    title: 'Unlock new skills',      description: 'Master front lever, planche, handstand — skill-first programming' },
    { value: 'strength', title: 'Build skill strength',   description: 'Focused on the supplementary work that makes skills possible' },
    { value: 'balanced', title: 'Skill + strength',       description: 'Even balance — great for most athletes' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">What's your primary goal?</h1>
      <p className="text-[var(--text-secondary)] mb-8">This shapes your program structure.</p>
      <div className="flex flex-col gap-3 mb-8">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className="text-left p-4 rounded-2xl border transition-all duration-150"
            style={{
              background: selected === opt.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
              borderColor: selected === opt.value ? 'var(--accent)' : 'var(--border)',
            }}
          >
            <div className="font-medium text-[var(--text-primary)]">{opt.title}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-0.5">{opt.description}</div>
          </button>
        ))}
      </div>
      <Button fullWidth size="lg" disabled={!selected} onClick={() => selected && onNext(selected)}>
        Continue
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StepSkills({ onNext }: { onNext: (skills: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['planche', 'front_lever', 'handstand']))

  const toggleSkill = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const grouped = {
    pushing: SKILLS.filter(s => s.family === 'pushing'),
    pulling: SKILLS.filter(s => s.family === 'pulling'),
    balance: SKILLS.filter(s => s.family === 'balance'),
    legs:    SKILLS.filter(s => s.family === 'legs'),
  }

  const familyLabels = { pushing: 'Push skills', pulling: 'Pull skills', balance: 'Balance', legs: 'Legs' }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Which skills do you want to train?</h1>
      <p className="text-[var(--text-secondary)] mb-8">Select all you're interested in — you'll focus on 1–2 per block.</p>

      <div className="flex flex-col gap-6 mb-8">
        {(Object.entries(grouped) as [keyof typeof grouped, typeof SKILLS][]).map(([family, skills]) => (
          <div key={family}>
            <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              {familyLabels[family]}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {skills.map(skill => {
                const active = selected.has(skill.id)
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className="p-3 rounded-xl border text-left transition-all duration-150"
                    style={{
                      background: active ? 'var(--accent-muted)' : 'var(--bg-surface)',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <div className="font-medium text-sm text-[var(--text-primary)]">{skill.name}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary" size="md"
          onClick={() => setSelected(new Set(SKILLS.map(s => s.id)))}
        >
          Select all
        </Button>
        <Button
          fullWidth size="lg"
          disabled={selected.size === 0}
          onClick={() => onNext(Array.from(selected))}
        >
          Continue ({selected.size})
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StepAssessment({
  skillIds,
  onNext,
}: {
  skillIds: string[]
  onNext: (levels: Record<string, string>) => void
}) {
  const [skillIndex, setSkillIndex] = useState(0)
  const [levels, setLevels] = useState<Record<string, string>>({})

  const currentSkillId = skillIds[skillIndex]
  const skill = SKILLS.find(s => s.id === currentSkillId)
  const progressions = PROGRESSIONS
    .filter(p => p.skill_id === currentSkillId)
    .sort((a, b) => b.level - a.level) // Highest first

  const handleSelect = (progressionId: string) => {
    const next = { ...levels, [currentSkillId]: progressionId }
    setLevels(next)

    if (skillIndex < skillIds.length - 1) {
      setTimeout(() => setSkillIndex(i => i + 1), 300)
    } else {
      onNext(next)
    }
  }

  if (!skill) return null

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
        {skillIndex + 1} of {skillIds.length}
      </div>
      <h1 className="text-2xl font-semibold mb-1">{skill.name}</h1>
      <p className="text-[var(--text-secondary)] mb-6">
        What's the hardest version you can{' '}
        {skill.type === 'static' ? 'hold for 5+ seconds' : 'do for 3+ reps'}?
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {progressions.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className="text-left p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-150 active:scale-[0.98] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
          >
            <span className="font-medium text-sm text-[var(--text-primary)]">{p.name}</span>
            <span className="mono text-xs text-[var(--text-tertiary)] ml-2">
              lvl {p.level}
            </span>
          </button>
        ))}
        <button
          onClick={() => handleSelect(progressions[progressions.length - 1].id)}
          className="text-left p-3.5 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-secondary)] text-sm transition-all duration-150 hover:border-[var(--text-tertiary)]"
        >
          Never tried this skill
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StepSchedule({
  onNext,
}: {
  onNext: (days: number[], frequency: 3 | 4 | 5) => void
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Mon, Wed, Fri
  const [frequency, setFrequency] = useState<3 | 4 | 5>(3)

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length <= frequency) return prev // Don't go below frequency
        return prev.filter(d => d !== day)
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  const handleFrequencyChange = (f: 3 | 4 | 5) => {
    setFrequency(f)
    // Default day selections
    const defaults: Record<3 | 4 | 5, number[]> = {
      3: [1, 3, 5],
      4: [1, 2, 4, 6],
      5: [1, 2, 3, 4, 6],
    }
    setSelectedDays(defaults[f])
  }

  const valid = selectedDays.length === frequency

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Training schedule</h1>
      <p className="text-[var(--text-secondary)] mb-8">How many days per week can you train?</p>

      <div className="flex gap-2 mb-8">
        {([3, 4, 5] as const).map(f => (
          <button
            key={f}
            onClick={() => handleFrequencyChange(f)}
            className="flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-150"
            style={{
              background: frequency === f ? 'var(--accent-muted)' : 'var(--bg-surface)',
              borderColor: frequency === f ? 'var(--accent)' : 'var(--border)',
              color: frequency === f ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {f} days
          </button>
        ))}
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-3">
        Select {frequency} days:
      </p>
      <div className="grid grid-cols-7 gap-1.5 mb-8">
        {DAYS.map((day, i) => {
          const active = selectedDays.includes(i)
          return (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className="aspect-square rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-center"
              style={{
                background: active ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {day[0]}
            </button>
          )
        })}
      </div>

      <Button fullWidth size="lg" disabled={!valid} onClick={() => onNext(selectedDays, frequency)}>
        Continue
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StepEquipment({ onNext }: { onNext: (name: string, equipmentIds: string[]) => void }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(['pullup_bar', 'parallel_bars', 'wall', 'floor']))

  const toggleEquip = (id: string) => {
    if (id === 'floor') return // Floor always selected
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const applyPreset = (presetKey: keyof typeof EQUIPMENT_PROFILES_PRESETS) => {
    const preset = EQUIPMENT_PROFILES_PRESETS[presetKey]
    setName(preset.name)
    setSelected(new Set(preset.equipment_ids))
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Your equipment</h1>
      <p className="text-[var(--text-secondary)] mb-6">The app adapts exercises to what you have.</p>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(Object.entries(EQUIPMENT_PROFILES_PRESETS) as [keyof typeof EQUIPMENT_PROFILES_PRESETS, { name: string }][]).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-150"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Profile name */}
      <input
        type="text"
        placeholder="Profile name (e.g. My gym)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full mb-5 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-all text-sm"
      />

      {/* Equipment list */}
      <div className="flex flex-col gap-2 mb-8">
        {EQUIPMENT.map(eq => {
          const active = selected.has(eq.id)
          const isFloor = eq.id === 'floor'
          return (
            <button
              key={eq.id}
              onClick={() => toggleEquip(eq.id)}
              disabled={isFloor}
              className="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150"
              style={{
                background: active ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                opacity: isFloor ? 0.6 : 1,
              }}
            >
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--text-tertiary)',
                  background: active ? 'var(--accent)' : 'transparent',
                }}
              >
                {active && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{eq.name}</span>
              {isFloor && <span className="text-xs text-[var(--text-tertiary)] ml-auto">always included</span>}
            </button>
          )
        })}
      </div>

      <Button
        fullWidth size="lg"
        onClick={() => onNext(name || 'My setup', Array.from(selected))}
      >
        Create my program
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const initializeUser = useAppStore(s => s.initializeUser)

  const [step, setStep] = useState(0)
  const [data, setData] = useState<{
    goal?: 'skill' | 'strength' | 'balanced'
    selectedSkills?: string[]
    assessedLevels?: Record<string, string>
    trainingDays?: number[]
    trainingFrequency?: 3 | 4 | 5
    equipmentName?: string
    equipmentIds?: string[]
  }>({})

  const totalSteps = 5

  const handleGoal = (goal: 'skill' | 'strength' | 'balanced') => {
    setData(d => ({ ...d, goal }))
    setStep(1)
  }

  const handleSkills = (skills: string[]) => {
    setData(d => ({ ...d, selectedSkills: skills }))
    setStep(2)
  }

  const handleAssessment = (levels: Record<string, string>) => {
    setData(d => ({ ...d, assessedLevels: levels }))
    setStep(3)
  }

  const handleSchedule = (days: number[], freq: 3 | 4 | 5) => {
    setData(d => ({ ...d, trainingDays: days, trainingFrequency: freq }))
    setStep(4)
  }

  const handleEquipment = (equipName: string, equipIds: string[]) => {
    const finalData = { ...data, equipmentName: equipName, equipmentIds: equipIds }

    // Build the user profile
    const profile: UserProfile = {
      id: '',
      display_name: 'Athlete',
      created_at: new Date().toISOString(),
      onboarding_completed: true,
      training_days: finalData.trainingDays ?? [1, 3, 5],
      training_frequency: finalData.trainingFrequency ?? 3,
      goal: finalData.goal ?? 'balanced',
    }

    // Build skill levels
    const skills = finalData.selectedSkills ?? []
    const levels = finalData.assessedLevels ?? {}

    // First 2 skills are focus, rest are maintenance
    const skillLevels: UserSkillLevel[] = skills.map((skillId, idx) => {
      const progressionId = levels[skillId] ?? (() => {
        const progs = PROGRESSIONS.filter(p => p.skill_id === skillId).sort((a, b) => a.level - b.level)
        return progs[0]?.id ?? ''
      })()
      const progression = PROGRESSIONS.find(p => p.id === progressionId)
      return {
        user_id: '',
        skill_id: skillId,
        current_progression_id: progressionId,
        current_progression_level: progression?.level ?? 1,
        status: idx < 2 ? 'focus' : 'maintenance',
      }
    })

    // Equipment profile
    const equipProfile: EquipmentProfile = {
      id: '',
      user_id: '',
      name: equipName,
      is_default: true,
      equipment_ids: equipIds,
    }

    initializeUser(profile, skillLevels, equipProfile)
    router.replace('/today')
  }

  const stepComponents = [
    <StepGoal key={0} onNext={handleGoal} />,
    <StepSkills key={1} onNext={handleSkills} />,
    data.selectedSkills && data.selectedSkills.length > 0
      ? <StepAssessment key={2} skillIds={data.selectedSkills} onNext={handleAssessment} />
      : null,
    <StepSchedule key={3} onNext={handleSchedule} />,
    <StepEquipment key={4} onNext={handleEquipment} />,
  ]

  return (
    <div className="min-h-screen px-5 pt-12 pb-8 page-enter">
      <BackButton href={step === 0 ? '/auth/login' : undefined} onClick={step > 0 ? () => setStep(s => s - 1) : undefined} className="mb-4" />
      <Logo className="mb-8" iconSize={32} />

      <StepIndicator current={step} total={totalSteps} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {stepComponents[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
