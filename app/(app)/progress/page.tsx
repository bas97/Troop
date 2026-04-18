'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/app-store'
import { SKILLS } from '@/lib/data/skills'
import { PROGRESSIONS, getProgressionsForSkill, getProgressionById } from '@/lib/data/progressions'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BackButton } from '@/components/ui/back-button'
import { format, parseISO, subDays } from 'date-fns'

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({ skillId, expanded, onToggle }: { skillId: string; expanded: boolean; onToggle: () => void }) {
  const skillLevels = useAppStore(s => s.skillLevels)
  const personalRecords = useAppStore(s => s.personalRecords)

  const skill = SKILLS.find(s => s.id === skillId)
  const skillLevel = skillLevels.find(sl => sl.skill_id === skillId)
  if (!skill || !skillLevel) return null

  const progressions = getProgressionsForSkill(skillId)
  const current = progressions.find(p => p.level === skillLevel.current_progression_level)
  const next = progressions.find(p => p.level === skillLevel.current_progression_level + 1)

  const prs = personalRecords.filter(pr =>
    progressions.some(p => p.id === pr.progression_id)
  )
  const latestPR = prs.sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())[0]

  const currentPRs = personalRecords.filter(pr => pr.progression_id === skillLevel.current_progression_id)
  const bestValue = Math.max(...currentPRs.map(pr => pr.value), 0)
  const targetValue = current?.unlock_criteria.target_value ?? 1
  const progressPct = Math.min(100, (bestValue / targetValue) * 100)

  const statusColors: Record<string, string> = {
    focus: 'var(--accent)',
    maintenance: 'var(--text-secondary)',
    locked: 'var(--text-tertiary)',
    paused: 'var(--text-tertiary)',
  }

  return (
    <Card hoverable className="mb-3" onClick={onToggle}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ background: statusColors[skillLevel.status] }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-medium text-[var(--text-primary)]">{skill.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0"
              style={{
                borderColor: statusColors[skillLevel.status],
                color: statusColors[skillLevel.status],
              }}
            >
              {skillLevel.status}
            </span>
          </div>
          <div className="text-sm text-[var(--text-secondary)] truncate">
            {current?.name ?? 'Not started'}
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, marginTop: 4 }}
        >
          <path d="M4 6L8 10L12 6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Progress toward next level */}
      {current && bestValue > 0 && (
        <div className="mt-3 ml-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">
              Best: <span className="mono">{bestValue}{current.unlock_criteria.type === 'hold_time' ? 's' : ' reps'}</span>
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              Target: <span className="mono">{targetValue}{current.unlock_criteria.type === 'hold_time' ? 's' : ' reps'} ×{current.unlock_criteria.target_sets}</span>
            </span>
          </div>
          <ProgressBar value={progressPct} />
        </div>
      )}

      {/* Expanded: full progression ladder */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 ml-5 border-l border-[var(--border)] pl-4">
              {progressions.map(p => {
                const isCompleted = p.level < skillLevel.current_progression_level
                const isCurrent = p.level === skillLevel.current_progression_level
                const isLocked = p.level > skillLevel.current_progression_level

                const bestForLevel = personalRecords
                  .filter(pr => pr.progression_id === p.id)
                  .sort((a, b) => b.value - a.value)[0]

                return (
                  <div
                    key={p.id}
                    className="relative flex gap-3 pb-3 last:pb-0"
                  >
                    {/* Level dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 -ml-5 border-2"
                      style={{
                        background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--bg-base)',
                        borderColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--border)',
                      }}
                    />

                    <div className={isLocked ? 'opacity-40' : ''}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                        {isCurrent && (
                          <span className="text-xs text-[var(--accent)] border border-[var(--accent)] rounded-full px-1.5">current</span>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-[var(--success)]">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {p.unlock_criteria.target_sets}×{p.unlock_criteria.target_value}
                        {p.unlock_criteria.type === 'hold_time' ? 's' : ' reps'}
                        {bestForLevel && (
                          <span className="mono ml-2 text-[var(--text-secondary)]">
                            best: {bestForLevel.value}{p.unlock_criteria.type === 'hold_time' ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap() {
  const sessions = useAppStore(s => s.sessions)
  const completedDates = new Set(
    sessions.filter(s => s.status === 'completed').map(s => s.date)
  )

  const today = new Date()
  const days = Array.from({ length: 70 }, (_, i) => subDays(today, 69 - i))

  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Activity</div>
      <div className="flex gap-1 flex-wrap">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const active = completedDates.has(dateStr)
          return (
            <div
              key={dateStr}
              title={dateStr}
              className="w-3 h-3 rounded-sm transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                opacity: active ? 1 : 0.4,
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-[var(--text-tertiary)]">70 days ago</span>
        <span className="text-xs text-[var(--text-tertiary)]">Today</span>
      </div>
    </div>
  )
}

// ─── Recent PRs ───────────────────────────────────────────────────────────────

function RecentPRs() {
  const personalRecords = useAppStore(s => s.personalRecords)

  const recent = [...personalRecords]
    .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
    .slice(0, 10)

  if (recent.length === 0) return null

  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Recent PRs</div>
      <div className="flex flex-col gap-2">
        {recent.map(pr => {
          const prog = getProgressionById(pr.progression_id)
          return (
            <div
              key={pr.id}
              className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--text-primary)] truncate block">{prog?.name ?? pr.progression_id}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {format(parseISO(pr.achieved_at), 'MMM d')}
                </span>
              </div>
              <span className="mono text-sm font-medium text-[var(--accent)] flex-shrink-0">
                {pr.value}{pr.target_type === 'hold_time' ? 's' : ' reps'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const skillLevels = useAppStore(s => s.skillLevels)
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  const focusSkills = skillLevels.filter(sl => sl.status === 'focus')
  const maintenanceSkills = skillLevels.filter(sl => sl.status === 'maintenance')

  return (
    <div className="px-5 pt-12 page-enter">
      <BackButton className="mb-2" />
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Your journey</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Progress</h1>
      </div>

      <ActivityHeatmap />
      <RecentPRs />

      {focusSkills.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Focus skills</div>
          {focusSkills.map(sl => (
            <SkillCard
              key={sl.skill_id}
              skillId={sl.skill_id}
              expanded={expandedSkill === sl.skill_id}
              onToggle={() => setExpandedSkill(expandedSkill === sl.skill_id ? null : sl.skill_id)}
            />
          ))}
        </div>
      )}

      {maintenanceSkills.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">All skills</div>
          {maintenanceSkills.map(sl => (
            <SkillCard
              key={sl.skill_id}
              skillId={sl.skill_id}
              expanded={expandedSkill === sl.skill_id}
              onToggle={() => setExpandedSkill(expandedSkill === sl.skill_id ? null : sl.skill_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
