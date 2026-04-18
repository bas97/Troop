'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { PROGRESSIONS, getProgressionById } from '@/lib/data/progressions'
import { SKILLS } from '@/lib/data/skills'
import { format } from 'date-fns'
import type { WorkoutSession } from '@/types'
import { LogoMark } from '@/components/ui/logo'

// ─── Readiness check-in ───────────────────────────────────────────────────────

function ReadinessCheckIn({ onRate }: { onRate: (score: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <Card>
        <p className="text-sm text-[var(--text-secondary)] mb-3">How are you feeling today?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => onRate(score)}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-sm font-medium mono text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] active:scale-95"
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">terrible</span>
          <span className="text-xs text-[var(--text-tertiary)]">great</span>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Readiness banner ─────────────────────────────────────────────────────────

function ReadinessBanner({ score }: { score: number }) {
  const labels: Record<number, { text: string; color: string }> = {
    1: { text: 'Volume reduced 30% — take care of yourself', color: 'var(--danger)' },
    2: { text: 'Volume reduced 30% — listen to your body', color: 'var(--warning)' },
    3: { text: 'Volume reduced 15%', color: 'var(--text-secondary)' },
    4: { text: 'Normal session', color: 'var(--text-secondary)' },
    5: { text: 'PR attempts unlocked — you\'re ready', color: 'var(--success)' },
  }
  const info = labels[score]

  return (
    <div className="flex items-center gap-2 mb-4 px-1">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: info.color }}
      />
      <span className="text-xs text-[var(--text-secondary)]">{info.text}</span>
    </div>
  )
}

// ─── Workout card ─────────────────────────────────────────────────────────────

function WorkoutCard({
  session,
  onStart,
}: {
  session: WorkoutSession
  onStart: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const focusExercises = session.planned_exercises.filter(e => e.category === 'skill')
  const strengthExercises = session.planned_exercises.filter(e => e.category === 'strength')
  const allExercises = session.planned_exercises

  const estimatedMins = Math.round(
    allExercises.reduce((sum, ex) => {
      const timePerSet = ex.planned_target.type === 'hold_time'
        ? ex.planned_target.value + ex.planned_rest_seconds
        : 45 + ex.planned_rest_seconds
      return sum + (timePerSet * ex.planned_sets) / 60
    }, 0) * 1.1
  )

  const nonWarmupMobility = allExercises.filter(e => e.category !== 'warmup' && e.category !== 'mobility')

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="mb-5">
        {/* Session header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
              Today's session
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {session.session_label}
            </h2>
          </div>
          <div className="text-right">
            <div className="mono text-xs text-[var(--text-tertiary)]">est.</div>
            <div className="mono text-lg font-semibold text-[var(--accent)]">
              {estimatedMins}<span className="text-xs ml-0.5">min</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-5">
          <div>
            <div className="mono text-lg font-semibold text-[var(--text-primary)]">
              {nonWarmupMobility.length}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">exercises</div>
          </div>
          <div>
            <div className="mono text-lg font-semibold text-[var(--text-primary)]">
              {focusExercises.length}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">skill sets</div>
          </div>
          <div>
            <div className="mono text-lg font-semibold text-[var(--text-primary)]">
              {nonWarmupMobility.reduce((s, e) => s + e.planned_sets, 0)}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">total sets</div>
          </div>
        </div>

        {/* Start button */}
        <Button fullWidth size="lg" onClick={onStart}>
          Start session
        </Button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1.5"
        >
          {expanded ? 'Hide preview' : 'Preview exercises'}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Exercise preview */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-0">
                {allExercises.map((ex, i) => {
                  const prog = getProgressionById(ex.progression_id)
                  const name = prog?.name ?? ex.progression_id.replace(/_/g, ' ')
                  const targetStr = ex.planned_target.type === 'hold_time'
                    ? `${ex.planned_target.value}s`
                    : `${ex.planned_target.value} reps`

                  return (
                    <div
                      key={ex.id}
                      className="flex items-center gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: ex.category === 'skill' ? 'var(--accent)'
                            : ex.category === 'warmup' ? 'var(--text-tertiary)'
                            : ex.category === 'mobility' ? 'var(--success)'
                            : 'var(--text-secondary)'
                        }}
                      />
                      <span className="text-sm text-[var(--text-primary)] flex-1">{name}</span>
                      <span className="mono text-xs text-[var(--text-tertiary)]">
                        {ex.planned_sets}×{targetStr}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// ─── Rest day card ────────────────────────────────────────────────────────────

function RestDayCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="mb-5 text-center">
        <div className="text-4xl mb-3">🌙</div>
        <h2 className="text-xl font-semibold mb-1 text-[var(--text-primary)]">Rest day</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Your body is building. Recovery is part of training.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="md" fullWidth>
            10 min handstand practice
          </Button>
          <Button variant="secondary" size="md" fullWidth>
            15 min mobility flow
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Quick stats row ──────────────────────────────────────────────────────────

function QuickStats() {
  const getStreak = useAppStore(s => s.getStreak)
  const getWeeklySessionCount = useAppStore(s => s.getWeeklySessionCount)
  const streak = getStreak()
  const { done, total } = getWeeklySessionCount()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-3 mb-5">
      {[
        { label: 'Streak', value: `${streak}d`, mono: true },
        { label: 'This week', value: `${done}/${total}`, mono: true },
        { label: 'Status', value: done >= total ? 'Done ✓' : 'Active', mono: false },
      ].map(stat => (
        <Card key={stat.label} className="text-center p-4">
          <div className={`text-xl font-semibold ${stat.mono ? 'mono' : ''} text-[var(--text-primary)]`}>
            {stat.value}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{stat.label}</div>
        </Card>
      ))}
    </motion.div>
  )
}

// ─── Block progress ───────────────────────────────────────────────────────────

function BlockProgress() {
  const currentBlock = useAppStore(s => s.currentBlock)
  const skillLevels = useAppStore(s => s.skillLevels)

  if (!currentBlock) return null

  const progress = (currentBlock.current_week / currentBlock.duration_weeks) * 100
  const phaseLabels = { accumulation: 'Build', intensification: 'Intensify', realization: 'Peak' }

  const focusSkillNames = currentBlock.focus_skill_ids.map(id => {
    const skill = SKILLS.find(s => s.id === id)
    return skill?.name ?? id
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Focus block</div>
            <div className="font-medium text-[var(--text-primary)]">
              {focusSkillNames.join(' + ')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--text-tertiary)]">Phase</div>
            <div className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              {phaseLabels[currentBlock.current_phase]}
            </div>
          </div>
        </div>
        <ProgressBar value={progress} />
        <div className="flex justify-between mt-1.5">
          <span className="mono text-xs text-[var(--text-tertiary)]">Week {currentBlock.current_week}</span>
          <span className="mono text-xs text-[var(--text-tertiary)]">{currentBlock.duration_weeks} weeks</span>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const router = useRouter()
  const userProfile = useAppStore(s => s.userProfile)
  const readinessScore = useAppStore(s => s.readinessScore)
  const readinessCheckedToday = useAppStore(s => s.readinessCheckedToday)
  const setReadinessScore = useAppStore(s => s.setReadinessScore)
  const getTodaySession = useAppStore(s => s.getTodaySession)
  const generateTodaySession = useAppStore(s => s.generateTodaySession)
  const startSession = useAppStore(s => s.startSession)

  const [todaySession, setTodaySession] = useState(getTodaySession())

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!userProfile?.onboarding_completed) {
      router.replace('/onboarding')
    }
  }, [userProfile, router])

  // Generate session on mount if needed
  useEffect(() => {
    if (!todaySession) {
      const session = generateTodaySession()
      setTodaySession(session)
    }
  }, [todaySession, generateTodaySession])

  const handleReadiness = (score: number) => {
    setReadinessScore(score)
    // Regenerate session with new readiness
    const newSession = generateTodaySession()
    setTodaySession(newSession)
  }

  const handleStartSession = () => {
    if (!todaySession) return
    startSession(todaySession.id)
    router.push(`/session/${todaySession.id}`)
  }

  const today = new Date()
  const isRestDay = !todaySession || todaySession.session_type === 'rest'

  return (
    <div className="px-5 pt-12 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
            {format(today, 'EEEE, MMM d')}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {isRestDay ? 'Rest day' : 'Train today'}
          </h1>
        </div>
        <LogoMark size={32} />
      </div>

      {/* Readiness check-in */}
      {!readinessCheckedToday && !isRestDay && (
        <ReadinessCheckIn onRate={handleReadiness} />
      )}

      {/* Readiness banner */}
      {readinessCheckedToday && readinessScore && !isRestDay && (
        <ReadinessBanner score={readinessScore} />
      )}

      {/* Main content */}
      {isRestDay ? (
        <RestDayCard />
      ) : todaySession ? (
        <WorkoutCard session={todaySession} onStart={handleStartSession} />
      ) : (
        <Card className="mb-5 text-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Generating your workout…</p>
        </Card>
      )}

      {/* Quick stats */}
      <QuickStats />

      {/* Block progress */}
      <BlockProgress />
    </div>
  )
}
