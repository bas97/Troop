'use client'

import { useAppStore } from '@/lib/store/app-store'
import { getBlockPhase, getSessionTypeForDay } from '@/lib/engine/workout-generator'
import { SKILLS } from '@/lib/data/skills'
import { getProgressionById } from '@/lib/data/progressions'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/ui/back-button'
import { addDays, format, parseISO } from 'date-fns'

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

export default function ProgramPage() {
  const block        = useAppStore(s => s.currentBlock)
  const userProfile  = useAppStore(s => s.userProfile)
  const skillLevels  = useAppStore(s => s.skillLevels)

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
                const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                return (
                  <div
                    key={dow}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
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
                    <div
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
