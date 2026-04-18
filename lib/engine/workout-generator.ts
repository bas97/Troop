/**
 * Troop Workout Generation Engine
 *
 * Implements the hybrid concurrent block periodization algorithm from the spec (Section 5.2).
 * Inputs → block phase, session type, focus skills, equipment, readiness score
 * Output → ordered PlannedExercise list ready for a WorkoutSession
 */

import { PROGRESSIONS, getProgressionsForSkill, getProgressionById } from '@/lib/data/progressions'
import { SKILLS } from '@/lib/data/skills'
import type {
  PlannedExercise,
  UserSkillLevel,
  BlockPhase,
  SessionType,
  ExerciseTargetType,
  UserProfile,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratorInput {
  userId: string
  userProfile: UserProfile
  skillLevels: UserSkillLevel[]
  focusSkillIds: string[]
  activeEquipment: string[]
  blockPhase: BlockPhase
  sessionType: SessionType
  sessionLabel: string
  readinessScore: number // 1-5
  weekNumber: number     // 1-5 within block
  trainingFrequency: 3 | 4 | 5
  sessionIndexThisWeek: number // 0-based, to determine DUP day type
  date: string
}

export interface GeneratorOutput {
  exercises: PlannedExercise[]
  sessionLabel: string
  estimatedMinutes: number
  focusSkillIds: string[]
  warnings: string[]
}

// ─── Volume tables (sets per session by block phase) ──────────────────────────

const FOCUS_SETS: Record<BlockPhase, number> = {
  accumulation:    5,
  intensification: 4,
  realization:     2,
}

const MAINTENANCE_SETS = 3

// ─── Rest periods (seconds) ───────────────────────────────────────────────────

const REST: Record<string, number> = {
  skill_static:  180, // 3 min for static holds
  skill_dynamic: 150, // 2.5 min for dynamic skills
  strength:      120, // 2 min
  accessory:      90, // 90s
  warmup:         60,
  mobility:       30,
}

// ─── Equipment compatibility check ───────────────────────────────────────────

function canPerformProgression(progressionId: string, availableEquipment: string[]): boolean {
  const p = getProgressionById(progressionId)
  if (!p) return false
  const eq = new Set(availableEquipment)
  // Floor is always assumed available
  eq.add('floor')
  return p.equipment_required.every(reqId => eq.has(reqId))
}

function bestAvailableProgressionId(
  skillId: string,
  currentLevel: number,
  availableEquipment: string[],
): string | null {
  const progressions = getProgressionsForSkill(skillId)
  // Try current level first, then step down
  for (let level = currentLevel; level >= 1; level--) {
    const p = progressions.find(prog => prog.level === level)
    if (p && canPerformProgression(p.id, availableEquipment)) {
      return p.id
    }
  }
  return null
}

// ─── DUP intensity modifier ───────────────────────────────────────────────────

function getDupIntensity(sessionIndex: number, frequency: 3 | 4 | 5): 'heavy' | 'medium' | 'light' {
  if (frequency === 3) {
    // All three days are "medium" for beginners — no DUP
    return 'medium'
  }
  // For 4-5 days: rotate Heavy / Medium / Light / Medium
  const pattern: ('heavy' | 'medium' | 'light')[] = ['heavy', 'medium', 'light', 'medium', 'medium']
  return pattern[sessionIndex % pattern.length]
}

function dupTargetMultiplier(intensity: 'heavy' | 'medium' | 'light'): number {
  return intensity === 'heavy' ? 1.0 : intensity === 'medium' ? 0.85 : 0.7
}

// ─── Target adjustment for equipment ─────────────────────────────────────────

function adjustTargetForEquipment(
  baseValue: number,
  progressionId: string,
  usedEquipment: string,
): number {
  const p = getProgressionById(progressionId)
  if (!p) return baseValue
  const modifier = p.difficulty_modifiers[usedEquipment]
  if (!modifier) return baseValue
  // A modifier < 1 means the equipment makes it easier → scale target UP
  // A modifier > 1 means harder → scale target DOWN
  return Math.round(baseValue / modifier)
}

// ─── Equipment selection for a progression ────────────────────────────────────

function selectBestEquipment(progressionId: string, available: string[]): string {
  const p = getProgressionById(progressionId)
  if (!p) return 'floor'
  const availSet = new Set(available)

  // Prefer preferred equipment
  for (const eq of p.equipment_preferred) {
    if (availSet.has(eq)) return eq
  }
  // Fall back to required
  for (const eq of p.equipment_required) {
    if (availSet.has(eq)) return eq
  }
  return 'floor'
}

// ─── Build a PlannedExercise ──────────────────────────────────────────────────

let exerciseIdCounter = 0

function buildExercise(params: {
  progressionId: string
  sets: number
  targetType: ExerciseTargetType
  targetValue: number
  restSeconds: number
  category: PlannedExercise['category']
  usedEquipment: string
  order: number
  notes?: string
}): PlannedExercise {
  const id = `ex_${++exerciseIdCounter}_${Date.now()}`
  return {
    id,
    progression_id: params.progressionId,
    order: params.order,
    planned_sets: params.sets,
    planned_target: { type: params.targetType, value: params.targetValue },
    planned_rest_seconds: params.restSeconds,
    category: params.category,
    equipment_used: params.usedEquipment,
    notes: params.notes,
  }
}

// ─── Warm-up protocol ────────────────────────────────────────────────────────

function buildWarmup(sessionType: SessionType, focusSkillIds: string[]): PlannedExercise[] {
  const exercises: PlannedExercise[] = []
  let order = 0

  // Universal: wrist conditioning (always for push/skill days)
  if (['push', 'skill'].includes(sessionType) || focusSkillIds.some(id => ['planche','hspu','handstand','l_sit'].includes(id))) {
    exercises.push(buildExercise({
      progressionId: 'warmup_wrist',
      sets: 1, targetType: 'hold_time', targetValue: 120,
      restSeconds: REST.warmup, category: 'warmup',
      usedEquipment: 'floor', order: order++,
      notes: 'Joint circles, wrist flexion/extension, finger pulses. Take your time.',
    }))
  }

  // Shoulder activation for upper days
  if (['push', 'pull', 'skill'].includes(sessionType)) {
    exercises.push(buildExercise({
      progressionId: 'warmup_shoulder',
      sets: 1, targetType: 'reps', targetValue: 15,
      restSeconds: REST.warmup, category: 'warmup',
      usedEquipment: 'floor', order: order++,
      notes: 'Band pull-aparts, dislocates, scapular push-ups.',
    }))
  }

  // Hip + ankle for leg days
  if (sessionType === 'legs') {
    exercises.push(buildExercise({
      progressionId: 'warmup_hips',
      sets: 1, targetType: 'reps', targetValue: 10,
      restSeconds: REST.warmup, category: 'warmup',
      usedEquipment: 'floor', order: order++,
      notes: 'Hip circles, ankle rotations, leg swings.',
    }))
  }

  return exercises
}

// ─── Skill-specific supplementary strength ────────────────────────────────────

const SKILL_STRENGTH_MAP: Record<string, { progressionId: string; type: ExerciseTargetType; target: number }[]> = {
  planche: [
    { progressionId: 'str_pseudo_pp', type: 'reps', target: 8 },
    { progressionId: 'str_planche_lean', type: 'hold_time', target: 20 },
    { progressionId: 'str_scapular_push', type: 'reps', target: 10 },
  ],
  hspu: [
    { progressionId: 'str_pike_pushup', type: 'reps', target: 10 },
    { progressionId: 'str_dips', type: 'reps', target: 10 },
  ],
  front_lever: [
    { progressionId: 'str_fl_rows', type: 'reps', target: 8 },
    { progressionId: 'str_weighted_pullup', type: 'reps', target: 5 },
  ],
  back_lever: [
    { progressionId: 'str_skin_cat', type: 'reps', target: 5 },
    { progressionId: 'str_ring_support', type: 'hold_time', target: 30 },
  ],
  muscle_up: [
    { progressionId: 'str_high_pullup', type: 'reps', target: 5 },
    { progressionId: 'str_bar_dip', type: 'reps', target: 10 },
  ],
  one_arm_pu: [
    { progressionId: 'str_weighted_pullup', type: 'reps', target: 5 },
    { progressionId: 'str_archer_row', type: 'reps', target: 5 },
  ],
  handstand: [
    { progressionId: 'str_wall_hs_hold', type: 'hold_time', target: 60 },
    { progressionId: 'str_shoulder_tap', type: 'reps', target: 10 },
  ],
  l_sit: [
    { progressionId: 'str_pike_compression', type: 'reps', target: 10 },
    { progressionId: 'str_hip_flexor_raise', type: 'reps', target: 10 },
  ],
  human_flag: [
    { progressionId: 'str_side_plank', type: 'hold_time', target: 30 },
    { progressionId: 'str_oblique_crunch', type: 'reps', target: 15 },
  ],
  pistol_squat: [
    { progressionId: 'str_bulgarian_ss', type: 'reps', target: 10 },
    { progressionId: 'str_calf_raise', type: 'reps', target: 15 },
  ],
  shrimp_squat: [
    { progressionId: 'str_step_up', type: 'reps', target: 10 },
    { progressionId: 'str_quad_stretch', type: 'hold_time', target: 30 },
  ],
  nordic_curl: [
    { progressionId: 'str_hamstring_bridge', type: 'reps', target: 15 },
    { progressionId: 'str_rdl', type: 'reps', target: 10 },
  ],
}

// ─── Main generation function ─────────────────────────────────────────────────

export function generateWorkout(input: GeneratorInput): GeneratorOutput {
  exerciseIdCounter = 0
  const warnings: string[] = []
  const exercises: PlannedExercise[] = []
  let order = 0

  const { focusSkillIds, activeEquipment, blockPhase, sessionType,
    readinessScore, weekNumber, trainingFrequency, sessionIndexThisWeek, skillLevels } = input

  // DUP day intensity
  const dupIntensity = getDupIntensity(sessionIndexThisWeek, trainingFrequency)
  const intensityMult = dupIntensity === 'light' ? 0.7 : 1.0

  // Readiness volume modifier
  const readinessMultiplier =
    readinessScore <= 2 ? 0.7 :
    readinessScore === 3 ? 0.85 : 1.0

  // Combined volume modifier
  const volumeMod = intensityMult * readinessMultiplier

  // Allow PR attempt on readiness 5 + realization phase
  const allowPrAttempt = readinessScore === 5 && blockPhase === 'realization'

  // ── 1. Warm-up ─────────────────────────────────────────────────────────────
  const warmupExercises = buildWarmup(sessionType, focusSkillIds)
  for (const ex of warmupExercises) {
    ex.order = order++
    exercises.push(ex)
  }

  // ── 2. Focus skill exercises ────────────────────────────────────────────────
  const skillsForSession = focusSkillIds.filter(skillId => {
    const skill = SKILLS.find(s => s.id === skillId)
    if (!skill) return false

    // Session type filter: only train relevant skill families
    if (sessionType === 'push' && !['pushing','balance'].includes(skill.family)) return false
    if (sessionType === 'pull' && !['pulling'].includes(skill.family)) return false
    if (sessionType === 'legs' && skill.family !== 'legs') return false
    // Skill days: all skills
    return true
  })

  for (const skillId of skillsForSession) {
    const skillLevel = skillLevels.find(sl => sl.skill_id === skillId)
    if (!skillLevel) continue

    const progressionId = bestAvailableProgressionId(skillId, skillLevel.current_progression_level, activeEquipment)
    if (!progressionId) {
      warnings.push(`${skillId}: no suitable progression available with current equipment`)
      continue
    }

    const progression = getProgressionById(progressionId)
    if (!progression) continue

    const usedEquipment = selectBestEquipment(progressionId, activeEquipment)
    const { type: targetType, target_value } = progression.unlock_criteria

    // Phase-specific intensity adjustments
    let targetValue = target_value
    if (blockPhase === 'accumulation') {
      // Build volume — slightly less than max, more sets
      targetValue = Math.max(1, Math.round(target_value * 0.75))
    } else if (blockPhase === 'intensification') {
      // Max intensity — hit or exceed target
      targetValue = target_value
    } else {
      // Realization — allow PR attempt or stay at 80%
      targetValue = allowPrAttempt ? Math.round(target_value * 1.2) : Math.round(target_value * 0.8)
    }

    // Adjust for DUP
    if (dupIntensity === 'light') {
      targetValue = Math.max(1, Math.round(targetValue * 0.8))
    }

    const baseSets = FOCUS_SETS[blockPhase]
    const sets = Math.max(1, Math.round(baseSets * volumeMod))

    const restKey = SKILLS.find(s => s.id === skillId)?.type === 'static' ? 'skill_static' : 'skill_dynamic'

    exercises.push(buildExercise({
      progressionId,
      sets,
      targetType,
      targetValue: Math.max(1, targetValue),
      restSeconds: REST[restKey],
      category: 'skill',
      usedEquipment,
      order: order++,
    }))
  }

  // ── 3. Skill-specific strength work ────────────────────────────────────────
  for (const skillId of skillsForSession) {
    const strengthExercises = SKILL_STRENGTH_MAP[skillId] ?? []
    // Take first 1-2 exercises depending on phase
    const count = blockPhase === 'accumulation' ? 2 : 1
    const toAdd = strengthExercises.slice(0, count)

    for (const se of toAdd) {
      const sets = Math.max(1, Math.round(3 * volumeMod))
      exercises.push(buildExercise({
        progressionId: se.progressionId,
        sets,
        targetType: se.type,
        targetValue: se.target,
        restSeconds: REST.strength,
        category: 'strength',
        usedEquipment: 'floor',
        order: order++,
      }))
    }
  }

  // ── 4. Maintenance sets for non-focus skills ───────────────────────────────
  if (sessionType !== 'legs') {
    const nonFocusSkillLevels = skillLevels.filter(sl => {
      if (focusSkillIds.includes(sl.skill_id)) return false
      if (sl.status === 'locked' || sl.status === 'paused') return false
      const skill = SKILLS.find(s => s.id === sl.skill_id)
      if (!skill) return false
      // Filter by session type
      if (sessionType === 'push' && !['pushing','balance'].includes(skill.family)) return false
      if (sessionType === 'pull' && skill.family !== 'pulling') return false
      return true
    })

    for (const sl of nonFocusSkillLevels.slice(0, 2)) {
      const progressionId = bestAvailableProgressionId(sl.skill_id, sl.current_progression_level, activeEquipment)
      if (!progressionId) continue

      const progression = getProgressionById(progressionId)
      if (!progression) continue

      const usedEquipment = selectBestEquipment(progressionId, activeEquipment)
      // Maintenance: 70-80% of best
      const maintenanceTarget = Math.max(1, Math.round(progression.unlock_criteria.target_value * 0.75))

      exercises.push(buildExercise({
        progressionId,
        sets: MAINTENANCE_SETS,
        targetType: progression.unlock_criteria.type,
        targetValue: maintenanceTarget,
        restSeconds: REST.skill_static,
        category: 'skill',
        usedEquipment,
        order: order++,
        notes: 'Maintenance — 70-80% effort',
      }))
    }
  }

  // ── 5. General strength / accessory ────────────────────────────────────────
  if (sessionType === 'legs') {
    // Add core work on leg days
    exercises.push(buildExercise({
      progressionId: 'str_hollow_body',
      sets: 3, targetType: 'hold_time', targetValue: 30,
      restSeconds: REST.accessory, category: 'accessory',
      usedEquipment: 'floor', order: order++,
    }))
  }

  // ── 6. Mobility / cool-down ─────────────────────────────────────────────────
  exercises.push(buildExercise({
    progressionId: 'mob_cooldown',
    sets: 1, targetType: 'hold_time', targetValue: 300,
    restSeconds: 0, category: 'mobility',
    usedEquipment: 'floor', order: order++,
    notes: 'Stretch muscles worked today. Focus on any tight areas.',
  }))

  // ── Estimate duration ─────────────────────────────────────────────────────
  const estimatedMinutes = Math.round(
    exercises.reduce((sum, ex) => {
      const timePerSet = ex.planned_target.type === 'hold_time'
        ? ex.planned_target.value + ex.planned_rest_seconds
        : 45 + ex.planned_rest_seconds // ~45s per set for dynamic
      return sum + (timePerSet * ex.planned_sets) / 60
    }, 0) * 1.1 // 10% buffer
  )

  // Low readiness warning
  if (readinessScore <= 2) {
    warnings.push('Low readiness detected. Volume reduced 30%. Consider resting if needed.')
  }

  return {
    exercises,
    sessionLabel: input.sessionLabel,
    estimatedMinutes: Math.min(estimatedMinutes, 90),
    focusSkillIds,
    warnings,
  }
}

// ─── Block phase determination ────────────────────────────────────────────────

export function getBlockPhase(weekNumber: number, totalWeeks: number): BlockPhase {
  const progress = weekNumber / totalWeeks
  if (progress <= 0.4) return 'accumulation'
  if (progress <= 0.8) return 'intensification'
  return 'realization'
}

// ─── Session type for a day ───────────────────────────────────────────────────

export function getSessionTypeForDay(
  dayIndex: number, // 0-based index within training week
  frequency: 3 | 4 | 5,
): { type: SessionType; label: string } {
  const schedules: Record<3 | 4 | 5, { type: SessionType; label: string }[]> = {
    3: [
      { type: 'push', label: 'Push + Handstand' },
      { type: 'pull', label: 'Pull + Lever' },
      { type: 'legs', label: 'Legs + Core' },
    ],
    4: [
      { type: 'push',  label: 'Upper Push' },
      { type: 'legs',  label: 'Lower Body' },
      { type: 'pull',  label: 'Upper Pull' },
      { type: 'skill', label: 'Skill + Core' },
    ],
    5: [
      { type: 'push',  label: 'Push Strength' },
      { type: 'pull',  label: 'Pull Strength' },
      { type: 'legs',  label: 'Legs' },
      { type: 'skill', label: 'Skill Practice (Light)' },
      { type: 'skill', label: 'Upper Skill + Mobility' },
    ],
  }

  const schedule = schedules[frequency]
  return schedule[dayIndex % schedule.length]
}

// ─── Progression check ───────────────────────────────────────────────────────

export interface ProgressionCheckResult {
  readyToAdvance: boolean
  readyToRegress: boolean
  nextProgressionId?: string
  prevProgressionId?: string
  message: string
}

export function checkProgressionStatus(
  progressionId: string,
  recentSessions: Array<{ value: number; sets: number }>, // last 3 sessions
): ProgressionCheckResult {
  const progression = getProgressionById(progressionId)
  if (!progression) return { readyToAdvance: false, readyToRegress: false, message: 'Progression not found' }

  const { target_value, target_sets, consecutive_sessions } = progression.unlock_criteria
  const sessionsToCheck = recentSessions.slice(-consecutive_sessions)

  const advanceSessions = sessionsToCheck.filter(
    s => s.value >= target_value && s.sets >= target_sets
  )
  const failSessions = sessionsToCheck.filter(
    s => s.value < target_value * 0.8 || s.sets < Math.ceil(target_sets * 0.67)
  )

  const readyToAdvance = advanceSessions.length >= consecutive_sessions
  const readyToRegress = failSessions.length >= consecutive_sessions && recentSessions.length >= consecutive_sessions

  const allProgressions = getProgressionsForSkill(progression.skill_id)
  const nextP = allProgressions.find(p => p.level === progression.level + 1)
  const prevP = allProgressions.find(p => p.level === progression.level - 1)

  let message = ''
  if (readyToAdvance && nextP) {
    message = `Ready to test ${nextP.name}!`
  } else if (readyToRegress && prevP) {
    message = `Consider stepping back to ${prevP.name} for more foundation building.`
  } else {
    const best = Math.max(...recentSessions.map(s => s.value), 0)
    const pct = target_value > 0 ? Math.round((best / target_value) * 100) : 0
    message = `Working toward ${target_value}${progression.unlock_criteria.type === 'hold_time' ? 's' : ' reps'} × ${target_sets} sets. Best: ${best} (${pct}%)`
  }

  return {
    readyToAdvance,
    readyToRegress,
    nextProgressionId: nextP?.id,
    prevProgressionId: prevP?.id,
    message,
  }
}
