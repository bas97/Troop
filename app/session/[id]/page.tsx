'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { getProgressionById } from '@/lib/data/progressions'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import type { PlannedExercise, LoggedSet, WorkoutSession } from '@/types'

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer(initialSeconds: number, countDown: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => setRunning(true), [])
  const stop = useCallback(() => setRunning(false), [])
  const reset = useCallback((s = initialSeconds) => {
    setRunning(false)
    setSeconds(s)
  }, [initialSeconds])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (countDown && s <= 1) {
          setRunning(false)
          return 0
        }
        return countDown ? s - 1 : s + 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, countDown])

  return { seconds, running, start, stop, reset }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Session complete screen ──────────────────────────────────────────────────

function SessionComplete({
  session,
  onClose,
}: {
  session: WorkoutSession
  onClose: () => void
}) {
  const skillLevels = useAppStore(s => s.skillLevels)
  const personalRecords = useAppStore(s => s.personalRecords)
  const logged = session.logged_exercises ?? []
  const completedSets = logged.reduce((sum, ex) => sum + ex.actual_sets.length, 0)

  const newPRs = personalRecords.filter(pr =>
    pr.session_id === session.id &&
    new Date(pr.achieved_at) > new Date(Date.now() - 3600000)
  )

  return (
    <motion.div
      className="min-h-screen px-5 pt-16 pb-8 flex flex-col items-center text-center unlock-glow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-6xl mb-6">🏆</div>
      <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Session complete</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        {session.session_label} — {completedSets} sets logged
      </p>

      {newPRs.length > 0 && (
        <div className="w-full mb-6 p-4 rounded-2xl border border-[var(--accent)] bg-[var(--accent-muted)]">
          <div className="text-xs uppercase tracking-widest text-[var(--accent)] mb-2">New personal records</div>
          {newPRs.map(pr => {
            const prog = getProgressionById(pr.progression_id)
            return (
              <div key={pr.id} className="text-sm font-medium text-[var(--text-primary)]">
                {prog?.name} — {pr.value}{pr.target_type === 'hold_time' ? 's' : ' reps'}
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 w-full mb-8">
        {[
          { label: 'Exercises', value: logged.length },
          { label: 'Sets', value: completedSets },
          { label: 'PRs', value: newPRs.length },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="mono text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <Button fullWidth size="lg" onClick={onClose}>
        Back to Today
      </Button>
    </motion.div>
  )
}

// ─── Rest period screen ───────────────────────────────────────────────────────

function RestScreen({
  seconds: initialSeconds,
  nextExercise,
  onSkip,
}: {
  seconds: number
  nextExercise?: PlannedExercise
  onSkip: () => void
}) {
  const { seconds, running, start } = useTimer(initialSeconds, true)

  useEffect(() => {
    start()
  }, [start])

  const nextProg = nextExercise ? getProgressionById(nextExercise.progression_id) : null

  useEffect(() => {
    if (seconds === 0) onSkip()
  }, [seconds, onSkip])

  const pct = ((initialSeconds - seconds) / initialSeconds) * 100

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-5 pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-6">Rest</div>

      {/* Circular countdown */}
      <div className="relative w-40 h-40 mb-8">
        <svg width="160" height="160" className="-rotate-90 absolute inset-0">
          <circle cx="80" cy="80" r="68" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="80" cy="80" r="68" fill="none"
            stroke="var(--accent)" strokeWidth="6"
            strokeDasharray={2 * Math.PI * 68}
            strokeDashoffset={(1 - pct / 100) * 2 * Math.PI * 68}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`mono text-4xl font-bold text-[var(--text-primary)] ${seconds <= 10 ? 'timer-pulse' : ''}`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {nextProg && (
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Next up</div>
          <div className="text-lg font-medium text-[var(--text-primary)]">{nextProg.name}</div>
          <div className="mono text-sm text-[var(--text-secondary)] mt-0.5">
            {nextExercise?.planned_sets}×
            {nextExercise?.planned_target.value}
            {nextExercise?.planned_target.type === 'hold_time' ? 's' : ' reps'}
          </div>
        </div>
      )}

      <button
        onClick={onSkip}
        className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        Skip rest →
      </button>
    </motion.div>
  )
}

// ─── Hold timer (for static skills) ──────────────────────────────────────────

function HoldTimer({ onLog }: { onLog: (seconds: number) => void }) {
  const { seconds, running, start, stop, reset } = useTimer(0, false)

  const handleStart = () => start()
  const handleLog = () => {
    stop()
    onLog(seconds)
    reset(0)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className={`mono text-7xl font-bold tracking-tighter ${running ? '' : 'text-[var(--text-tertiary)]'}`}
        style={{ color: running ? 'var(--text-primary)' : undefined }}
      >
        {formatTime(seconds)}
      </motion.div>

      {!running ? (
        <Button size="lg" onClick={handleStart} className="min-w-[160px]">
          Start hold
        </Button>
      ) : (
        <Button size="lg" onClick={handleLog} className="min-w-[160px]" style={{ background: 'var(--success)' }}>
          Log set  {formatTime(seconds)}
        </Button>
      )}
    </div>
  )
}

// ─── Rep logger ───────────────────────────────────────────────────────────────

function RepLogger({
  target,
  onLog,
}: {
  target: number
  onLog: (reps: number) => void
}) {
  const [reps, setReps] = useState(target)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setReps(r => Math.max(0, r - 1))}
          className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-xl text-[var(--text-secondary)] flex items-center justify-center transition-all active:scale-95"
        >
          −
        </button>
        <div className="mono text-7xl font-bold text-[var(--text-primary)] w-24 text-center">
          {reps}
        </div>
        <button
          onClick={() => setReps(r => r + 1)}
          className="w-12 h-12 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-xl text-[var(--text-secondary)] flex items-center justify-center transition-all active:scale-95"
        >
          +
        </button>
      </div>
      <div className="text-sm text-[var(--text-tertiary)]">
        Target: <span className="mono text-[var(--text-secondary)]">{target} reps</span>
      </div>
      <Button size="lg" onClick={() => onLog(reps)} className="min-w-[160px]">
        Log {reps} reps
      </Button>
    </div>
  )
}

// ─── Exercise screen ──────────────────────────────────────────────────────────

function ExerciseScreen({
  exercise,
  currentSet,
  totalSets,
  sessionProgress,
  onLogSet,
  onSkip,
}: {
  exercise: PlannedExercise
  currentSet: number
  totalSets: number
  sessionProgress: number
  onLogSet: (value: number) => void
  onSkip: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const progression = getProgressionById(exercise.progression_id)
  const isStatic = exercise.planned_target.type === 'hold_time'
  const isMobility = exercise.category === 'mobility' || exercise.category === 'warmup'

  const formCues = progression?.form_cues ?? []
  const commonMistakes = progression?.common_mistakes ?? []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top progress bar */}
      <ProgressBar value={sessionProgress} className="fixed top-0 left-0 right-0 z-50 rounded-none" />

      <div className="flex-1 flex flex-col px-5 pt-10 pb-32">
        {/* Exercise name + set counter */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
            Set {currentSet} of {totalSets}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] leading-tight">
            {progression?.name ?? exercise.progression_id.replace(/_/g, ' ')}
          </h1>
          {exercise.notes && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">{exercise.notes}</p>
          )}
        </div>

        {/* Category badge */}
        <div className="flex gap-2 mb-6">
          <span
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{
              borderColor: exercise.category === 'skill' ? 'var(--accent)' : 'var(--border)',
              color: exercise.category === 'skill' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            {exercise.category}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-tertiary)] mono">
            {exercise.planned_target.value}{isStatic ? 's' : ' reps'} target
          </span>
        </div>

        {/* Main interaction */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {isMobility ? (
            <div className="text-center">
              <div className="text-5xl mb-6">🧘</div>
              <p className="text-[var(--text-secondary)] mb-6">
                {exercise.notes ?? 'Take your time with this.'}
              </p>
              <Button size="lg" onClick={() => onLogSet(1)}>Done</Button>
            </div>
          ) : isStatic ? (
            <HoldTimer onLog={onLogSet} />
          ) : (
            <RepLogger target={exercise.planned_target.value} onLog={onLogSet} />
          )}
        </div>

        {/* Form cues */}
        {formCues.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Form cues
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                style={{ transform: showForm ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Cues</div>
                    {formCues.map((cue, i) => (
                      <div key={i} className="flex gap-2 text-sm text-[var(--text-secondary)] mb-1.5">
                        <span className="text-[var(--accent)] flex-shrink-0">›</span>
                        {cue}
                      </div>
                    ))}
                    {commonMistakes.length > 0 && (
                      <>
                        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2 mt-3">Common mistakes</div>
                        {commonMistakes.map((m, i) => (
                          <div key={i} className="flex gap-2 text-sm text-[var(--text-secondary)] mb-1.5">
                            <span className="text-[var(--danger)] flex-shrink-0">×</span>
                            {m}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom skip */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5">
        <button
          onClick={onSkip}
          className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-3"
        >
          Skip exercise
        </button>
      </div>
    </div>
  )
}

// ─── Main session page ────────────────────────────────────────────────────────

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const sessions = useAppStore(s => s.sessions)
  const logSet = useAppStore(s => s.logSet)
  const completeSession = useAppStore(s => s.completeSession)

  const session = sessions.find(s => s.id === id)

  // Current exercise state
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [showRest, setShowRest] = useState(false)
  const [showComplete, setShowComplete] = useState(false)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <p className="text-[var(--text-secondary)] mb-4">Session not found.</p>
          <Button onClick={() => router.replace('/today')}>Back to Today</Button>
        </div>
      </div>
    )
  }

  if (showComplete) {
    return (
      <SessionComplete
        session={session}
        onClose={() => router.replace('/today')}
      />
    )
  }

  const exercises = session.planned_exercises
  const currentExercise = exercises[exerciseIndex]

  if (!currentExercise) {
    // No more exercises
    if (!showComplete) {
      completeSession(session.id)
      setShowComplete(true)
    }
    return null
  }

  const sessionProgress = ((exerciseIndex * 100) / exercises.length)

  const advanceToNext = () => {
    const nextSet = currentSet + 1
    if (nextSet <= currentExercise.planned_sets) {
      setCurrentSet(nextSet)
    } else {
      // Move to next exercise
      const nextIndex = exerciseIndex + 1
      if (nextIndex < exercises.length) {
        setExerciseIndex(nextIndex)
        setCurrentSet(1)
      } else {
        completeSession(session.id)
        setShowComplete(true)
      }
    }
  }

  const handleLogSet = (value: number) => {
    const loggedSet: LoggedSet = {
      value,
      timestamp: new Date().toISOString(),
    }
    logSet(session.id, currentExercise.id, loggedSet)

    // Show rest if there's a rest period and it's not the last set of last exercise
    const isLastSet = currentSet >= currentExercise.planned_sets
    const isLastExercise = exerciseIndex >= exercises.length - 1
    const isMobility = currentExercise.category === 'mobility' || currentExercise.category === 'warmup'

    if (!isMobility && !isLastExercise && currentExercise.planned_rest_seconds > 0) {
      setShowRest(true)
    } else {
      advanceToNext()
    }
  }

  const handleSkip = () => {
    advanceToNext()
    setShowRest(false)
  }

  if (showRest) {
    const nextExercise = currentSet < currentExercise.planned_sets
      ? currentExercise
      : exercises[exerciseIndex + 1]

    return (
      <RestScreen
        seconds={currentExercise.planned_rest_seconds}
        nextExercise={nextExercise}
        onSkip={() => {
          setShowRest(false)
          advanceToNext()
        }}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${exerciseIndex}-${currentSet}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <ExerciseScreen
          exercise={currentExercise}
          currentSet={currentSet}
          totalSets={currentExercise.planned_sets}
          sessionProgress={sessionProgress}
          onLogSet={handleLogSet}
          onSkip={handleSkip}
        />
      </motion.div>
    </AnimatePresence>
  )
}
