'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { getBlockPhase, getSessionTypeForDay, generateWorkout } from '@/lib/engine/workout-generator'
import { SKILLS } from '@/lib/data/skills'
import { getProgressionById } from '@/lib/data/progressions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { addDays, format, parseISO } from 'date-fns'
import type { WorkoutSession, PlannedExercise } from '@/types'

const PHASE_COLORS: Record<string, string> = {
  accumulation:    'var(--success)',
  intensification: 'var(--accent)',
  realization:     '#a78bfa',
}

const PHASE_DESC: Record<string, string> = {
  accumulation:    'High volume · Build capacity',
  intensification: 'Moderate volume · Build intensity',
  realization:     'Low volume · Peak performance',
}

const DUP_LABEL: Record<string, string> = {
  heavy:  'Heavy',
  medium: 'Medium',
  light:  'Light',
}

function getDupIntensity(sessionIndex: number, frequency: 3 | 4 | 5): 'heavy' | 'medium' | 'light' {
  if (frequency === 3) return 'medium'
  const pattern: ('heavy' | 'medium' | 'light')[] = ['heavy', 'medium', 'light', 'medium', 'medium']
  return pattern[sessionIndex % pattern.length]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Session Sheet ─────────────────────────────────────────────────────────────

interface SessionSheetProps {
  weekNum:   number
  dayIdx:    number
  date:      string
  label:     string
  dup:       'heavy' | 'medium' | 'light'
  onClose:   () => void
}

function SessionSheet({ weekNum, dayIdx, date, label, dup, onClose }: SessionSheetProps) {
  const router             = useRouter()
  const block              = useAppStore(s => s.currentBlock)
  const userProfile        = useAppStore(s => s.userProfile)
  const skillLevels        = useAppStore(s => s.skillLevels)
  const sessions           = useAppStore(s => s.sessions)
  const createSessionForDate = useAppStore(s => s.createSessionForDate)
  const completeSession    = useAppStore(s => s.completeSession)
  const startSession       = useAppStore(s => s.startSession)
  const getActiveEquipment = useAppStore(s => s.getActiveEquipment)
  const readinessScore     = useAppStore(s => s.readinessScore)

  const existingSession = sessions.find(s => s.date === date && s.type === 'program')
  const isCompleted = existingSession?.status === 'completed'

  // Generate planned exercises on the fly for preview if no session
  const plannedExercises: PlannedExercise[] = (() => {
    if (existingSession) return existingSession.planned_exercises
    if (!block || !userProfile) return []
    const { type: sessionType, label: sLabel } = getSessionTypeForDay(dayIdx, userProfile.training_frequency)
    const phase = getBlockPhase(weekNum, block.duration_weeks)
    const result = generateWorkout({
      userId: userProfile.id,
      userProfile,
      skillLevels,
      focusSkillIds: block.focus_skill_ids,
      activeEquipment: getActiveEquipment(),
      blockPhase: phase,
      sessionType,
      sessionLabel: sLabel,
      readinessScore: readinessScore ?? 4,
      weekNumber: weekNum,
      trainingFrequency: userProfile.training_frequency,
      sessionIndexThisWeek: dayIdx,
      date,
    })
    return result.exercises
  })()

  const handleStart = () => {
    const session = createSessionForDate(weekNum, dayIdx, date)
    if (!session) return
    startSession(session.id)
    router.push(`/session/${session.id}`)
    onClose()
  }

  const handleMarkComplete = () => {
    let session: WorkoutSession | null = existingSession ?? null
    if (!session) {
      session = createSessionForDate(weekNum, dayIdx, date)
    }
    if (!session) return
    completeSession(session.id)
    onClose()
  }

  const handleShare = () => {
    const text = [
      `${label} — ${date}`,
      `DUP: ${DUP_LABEL[dup]}`,
      '',
      'Exercises:',
      ...plannedExercises.map((ex, i) => {
        const prog = getProgressionById(ex.progression_id)
        const name = prog?.name ?? ex.progression_id.replace(/_/g, ' ')
        const target = `${ex.planned_sets}×${ex.planned_target.value}${ex.planned_target.type === 'hold_time' ? 's' : ' reps'}`
        return `${i + 1}. ${name} — ${target}`
      }),
    ].join('\n')

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: label, text }).catch(() => {/* ignore */})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {/* ignore */})
    }
  }

  return (
    <>
      {/* Dark overlay */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)] rounded-t-3xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: dup === 'heavy' ? 'rgba(239,68,68,0.1)' : dup === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                  color: dup === 'heavy' ? '#ef4444' : dup === 'medium' ? 'var(--accent)' : 'var(--success)',
                }}
              >
                {DUP_LABEL[dup]}
              </span>
              {isCompleted && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                  Completed ✓
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{label}</h2>
            <div className="mono text-xs text-[var(--text-tertiary)] mt-0.5">{date}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Exercises list */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Exercises</div>
          {plannedExercises.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] py-3">No exercises generated.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {plannedExercises.map((ex) => {
                const prog = getProgressionById(ex.progression_id)
                const name = prog?.name ?? ex.progression_id.replace(/_/g, ' ')
                const target = `${ex.planned_sets}×${ex.planned_target.value}${ex.planned_target.type === 'hold_time' ? 's' : ' reps'}`
                return (
                  <div key={ex.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0"
                        style={{
                          borderColor: ex.category === 'skill' ? 'var(--accent)' : 'var(--border)',
                          color: ex.category === 'skill' ? 'var(--accent)' : 'var(--text-tertiary)',
                        }}
                      >
                        {ex.category}
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">{name}</span>
                    </div>
                    <span className="mono text-xs text-[var(--text-tertiary)] flex-shrink-0 ml-2">{target}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {!isCompleted && (
            <Button fullWidth size="lg" onClick={handleStart}>
              Start session
            </Button>
          )}
          {!isCompleted && (
            <Button fullWidth variant="secondary" onClick={handleMarkComplete}>
              Mark complete
            </Button>
          )}
          <button
            onClick={handleShare}
            className="w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Share
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProgramPage() {
  const block        = useAppStore(s => s.currentBlock)
  const userProfile  = useAppStore(s => s.userProfile)
  const skillLevels  = useAppStore(s => s.skillLevels)
  const sessions     = useAppStore(s => s.sessions)

  const [selectedDay, setSelectedDay] = useState<{
    weekNum: number
    dayIdx:  number
    date:    string
    label:   string
    dup:     'heavy' | 'medium' | 'light'
  } | null>(null)

  void skillLevels

  if (!block || !userProfile) {
    return (
      <div className="px-5 pt-12 page-enter">
        <BackButton className="mb-2" />
        <p className="text-[var(--text-secondary)] text-center py-16">
          No active training block. Complete onboarding first.
        </p>
      </div>
    )
  }

  const sortedDays = [...userProfile.training_days].sort((a, b) => a - b)
  const blockStart = parseISO(block.start_date)

  return (
    <div className="px-5 pt-12 pb-8 page-enter">
      <AnimatePresence>
        {selectedDay && (
          <SessionSheet
            weekNum={selectedDay.weekNum}
            dayIdx={selectedDay.dayIdx}
            date={selectedDay.date}
            label={selectedDay.label}
            dup={selectedDay.dup}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>

      <BackButton className="mb-2" />

      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Training programme</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Block {block.current_week > 0 ? `· Week ${block.current_week}` : ''}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {format(blockStart, 'MMM d')} — {format(parseISO(block.end_date), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Focus skills */}
      <Card className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Focus skills</div>
        <div className="flex flex-col gap-2">
          {block.focus_skill_ids.map(skillId => {
            const skill = SKILLS.find(s => s.id === skillId)
            const level = skillLevels.find(sl => sl.skill_id === skillId)
            const prog = level ? getProgressionById(level.current_progression_id) : null
            return (
              <div key={skillId} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">{skill?.name ?? skillId}</span>
                <span className="text-xs text-[var(--text-secondary)]">{prog?.name ?? '—'}</span>
              </div>
            )
          })}
        </div>
        {block.maintenance_skill_ids.length > 0 && (
          <>
            <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mt-4 mb-2">Maintenance</div>
            <div className="flex flex-wrap gap-2">
              {block.maintenance_skill_ids.map(skillId => {
                const skill = SKILLS.find(s => s.id === skillId)
                return (
                  <span key={skillId} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                    {skill?.name ?? skillId}
                  </span>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* Week-by-week schedule */}
      {Array.from({ length: block.duration_weeks }, (_, wi) => {
        const weekNum = wi + 1
        const phase   = getBlockPhase(weekNum, block.duration_weeks)
        const isCurrent = weekNum === block.current_week
        const weekStartDate = addDays(blockStart, wi * 7)

        return (
          <div key={weekNum} className="mb-5">
            {/* Week header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: `${PHASE_COLORS[phase]}15`, color: PHASE_COLORS[phase] }}
              >
                Week {weekNum}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] capitalize">{phase}</div>
              {isCurrent && (
                <div className="ml-auto text-xs font-semibold text-[var(--accent)]">← current</div>
              )}
            </div>

            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: isCurrent ? 'var(--accent)' : 'var(--border)', background: 'var(--bg-surface)' }}
            >
              {/* Phase description */}
              <div
                className="px-4 py-2 text-xs"
                style={{ background: `${PHASE_COLORS[phase]}08`, color: 'var(--text-tertiary)' }}
              >
                {PHASE_DESC[phase]}
              </div>

              {/* Training days */}
              {sortedDays.map((dow, dayIdx) => {
                const { type: sessionType, label } = getSessionTypeForDay(dayIdx, userProfile.training_frequency)
                const dup = getDupIntensity(dayIdx, userProfile.training_frequency)
                const sessionDate = addDays(weekStartDate, (dow - weekStartDate.getDay() + 7) % 7)
                const dateStr = format(sessionDate, 'yyyy-MM-dd')
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
                const matchingSession = sessions.find(s => s.date === dateStr && s.type === 'program')
                const isCompleted = matchingSession?.status === 'completed'

                void sessionType

                return (
                  <button
                    key={dow}
                    onClick={() => setSelectedDay({ weekNum, dayIdx, date: dateStr, label, dup })}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 text-left transition-colors hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-overlay)]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      background: isToday ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    <div className="w-8 text-center">
                      <div className="text-xs font-medium text-[var(--text-tertiary)]">{DAY_NAMES[dow]}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">{format(sessionDate, 'M/d')}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {block.focus_skill_ids
                          .map(id => SKILLS.find(s => s.id === id)?.name)
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex-shrink-0">
                        ✓
                      </span>
                    )}
                    <div
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: dup === 'heavy' ? 'rgba(239,68,68,0.1)' : dup === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                        color: dup === 'heavy' ? '#ef4444' : dup === 'medium' ? 'var(--accent)' : 'var(--success)',
                      }}
                    >
                      {DUP_LABEL[dup]}
                    </div>
                    {isToday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
