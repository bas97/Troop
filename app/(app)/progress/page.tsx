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
import type { UserSkillStatus } from '@/types'

// ─── Edit Focus Skills modal ──────────────────────────────────────────────────

function EditFocusModal({ onClose }: { onClose: () => void }) {
  const skillLevels    = useAppStore(s => s.skillLevels)
  const setSkillStatus = useAppStore(s => s.setSkillStatus)
  const addSkillLevel  = useAppStore(s => s.addSkillLevel)

  const families = ['pushing', 'pulling', 'balance', 'legs'] as const

  function handleTap(skillId: string) {
    const sl = skillLevels.find(s => s.skill_id === skillId)
    if (!sl) {
      // Not tracked yet — add as focus
      addSkillLevel(skillId, 'focus')
    } else if (sl.status === 'focus') {
      setSkillStatus(skillId, 'maintenance')
    } else {
      setSkillStatus(skillId, 'focus')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Skills</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Tap to add or toggle focus</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {families.map(family => {
          const familySkills = SKILLS.filter(s => s.family === family)

          return (
            <div key={family} className="mb-6">
              <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3 capitalize">{family}</div>
              <div className="flex flex-col gap-2">
                {familySkills.map(skill => {
                  const sl = skillLevels.find(s => s.skill_id === skill.id)
                  const isTracked = !!sl && sl.status !== 'locked'
                  const isFocus   = sl?.status === 'focus'
                  const progression = sl ? getProgressionById(sl.current_progression_id) : null

                  return (
                    <button
                      key={skill.id}
                      onClick={() => handleTap(skill.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                      style={{
                        background: isFocus ? 'var(--accent-muted)' : 'var(--bg-surface)',
                        borderColor: isFocus ? 'var(--accent)' : 'var(--border)',
                        opacity: !isTracked ? 0.6 : 1,
                      }}
                    >
                      {/* State indicator */}
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: isFocus ? 'var(--accent)' : 'var(--border)',
                          background: isFocus ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {isFocus && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {!isTracked && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 2v6M2 5h6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[var(--text-primary)]">{skill.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] truncate">
                          {progression?.name ?? 'Starts at Level 1'}
                        </div>
                      </div>

                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: isFocus
                            ? 'var(--accent)'
                            : isTracked
                              ? 'var(--bg-elevated)'
                              : 'transparent',
                          color: isFocus
                            ? 'white'
                            : isTracked
                              ? 'var(--text-secondary)'
                              : 'var(--text-tertiary)',
                          border: !isTracked ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        {isFocus ? 'Focus' : isTracked ? 'Maintenance' : 'Add'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 pb-8 pt-4 border-t border-[var(--border)]">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Done
        </button>
      </div>
    </motion.div>
  )
}

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
  const [editingFocus, setEditingFocus] = useState(false)

  const focusSkills = skillLevels.filter(sl => sl.status === 'focus')
  const maintenanceSkills = skillLevels.filter(sl => sl.status === 'maintenance')

  return (
    <div className="px-5 pt-12 pb-24 page-enter">
      <BackButton className="mb-2" />
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Your journey</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Progress</h1>
      </div>

      <ActivityHeatmap />
      <RecentPRs />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">Focus skills</div>
          <button
            onClick={() => setEditingFocus(true)}
            className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            Edit
          </button>
        </div>
        {focusSkills.length > 0 ? (
          focusSkills.map(sl => (
            <SkillCard
              key={sl.skill_id}
              skillId={sl.skill_id}
              expanded={expandedSkill === sl.skill_id}
              onToggle={() => setExpandedSkill(expandedSkill === sl.skill_id ? null : sl.skill_id)}
            />
          ))
        ) : (
          <div
            className="rounded-xl border p-4 text-sm text-center"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
          >
            No focus skills set. Tap Edit to choose which skills to prioritise.
          </div>
        )}
      </div>

      {maintenanceSkills.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Maintenance</div>
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

      <AnimatePresence>
        {editingFocus && <EditFocusModal onClose={() => setEditingFocus(false)} />}
      </AnimatePresence>
    </div>
  )
}
