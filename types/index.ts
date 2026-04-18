// ─── Enumerations ─────────────────────────────────────────────────────────────

export type SkillFamily = 'pushing' | 'pulling' | 'balance' | 'legs'
export type SkillType = 'static' | 'dynamic'
export type ExerciseTargetType = 'hold_time' | 'reps'
export type SessionType = 'push' | 'pull' | 'legs' | 'skill' | 'custom' | 'rest'
export type BlockPhase = 'accumulation' | 'intensification' | 'realization'
export type UserSkillStatus = 'focus' | 'maintenance' | 'locked' | 'paused'
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped'
export type PostType = 'skill_unlock' | 'pr' | 'form_check' | 'text' | 'challenge_complete'
export type ChallengeType = 'streak' | 'skill_unlock' | 'volume' | 'group'
export type EquipmentCategory = 'bars' | 'suspended' | 'static' | 'weighted' | 'floor'

// ─── Core Entities ─────────────────────────────────────────────────────────────

export interface Equipment {
  id: string
  name: string
  category: EquipmentCategory
  icon?: string
}

export interface Skill {
  id: string
  name: string
  family: SkillFamily
  type: SkillType
  recommended_frequency: number
  icon?: string
  description?: string
}

export interface UnlockCriteria {
  type: ExerciseTargetType
  target_value: number
  target_sets: number
  consecutive_sessions: number
}

export interface Progression {
  id: string
  skill_id: string
  level: number
  name: string
  unlock_criteria: UnlockCriteria
  equipment_required: string[]
  equipment_preferred: string[]
  difficulty_modifiers: Record<string, number>
  demo_video_url?: string
  form_cues: string[]
  common_mistakes: string[]
  supplementary_exercises?: string[]
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  email?: string
  created_at: string
  onboarding_completed: boolean
  training_days: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  training_frequency: 3 | 4 | 5
  goal: 'skill' | 'strength' | 'balanced'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
}

export interface EquipmentProfile {
  id: string
  user_id: string
  name: string
  is_default: boolean
  equipment_ids: string[]
}

export interface UserSkillLevel {
  user_id: string
  skill_id: string
  current_progression_id: string
  current_progression_level: number
  personal_best_value?: number
  personal_best_date?: string
  status: UserSkillStatus
}

// ─── Training Block ────────────────────────────────────────────────────────────

export interface TrainingBlock {
  id: string
  user_id: string
  start_date: string
  end_date: string
  duration_weeks: number
  focus_skill_ids: string[]
  maintenance_skill_ids: string[]
  current_phase: BlockPhase
  current_week: number
  status: 'active' | 'completed' | 'upcoming'
}

// ─── Workout Session ──────────────────────────────────────────────────────────

export interface ExerciseTarget {
  type: ExerciseTargetType
  value: number
}

export interface LoggedSet {
  value: number
  timestamp: string
  rpe?: number
}

export interface PlannedExercise {
  id: string
  progression_id: string
  progression?: Progression
  order: number
  planned_sets: number
  planned_target: ExerciseTarget
  planned_rest_seconds: number
  equipment_used?: string
  category: 'skill' | 'strength' | 'accessory' | 'warmup' | 'mobility'
  notes?: string
}

export interface LoggedExercise extends PlannedExercise {
  actual_sets: LoggedSet[]
  completed: boolean
}

export interface WorkoutSession {
  id: string
  user_id: string
  training_block_id?: string
  date: string
  type: 'program' | 'custom' | 'rest_day_activity'
  session_type: SessionType
  session_label: string
  week_number?: number
  day_in_week?: number
  planned_exercises: PlannedExercise[]
  logged_exercises?: LoggedExercise[]
  readiness_score?: number
  duration_minutes?: number
  status: WorkoutStatus
  notes?: string
  equipment_profile_id?: string
}

// ─── Community ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string
  user_id: string
  display_name: string
  avatar_url?: string
  content: string
  created_at: string
}

export interface SocialPost {
  id: string
  user_id: string
  display_name?: string
  avatar_url?: string
  type: PostType
  content: string
  media_url?: string
  related_skill_id?: string
  related_progression_id?: string
  created_at: string
  likes_count: number
  liked_by_me?: boolean
  comments: Comment[]
}

export interface Challenge {
  id: string
  title: string
  type: ChallengeType
  description: string
  start_date: string
  end_date: string
  target_type: string
  target_value: number
  participant_count: number
  my_progress?: number
  joined?: boolean
}

export interface Friend {
  id: string
  display_name: string
  added_at: string
}

export interface UserChallenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  end_date: string
  target: number
  created_by_me: boolean
  my_progress: number
  joined: boolean
  participants: number
  invited_friend_ids: string[]
}

// ─── Parks ────────────────────────────────────────────────────────────────────

export interface UserPark {
  placeId: string
  name:    string
  address: string
  lat:     number
  lng:     number
}

// ─── Engine Types ─────────────────────────────────────────────────────────────

export interface WorkoutGenerationInput {
  user: UserProfile
  skill_levels: UserSkillLevel[]
  progressions: Progression[]
  skills: Skill[]
  focus_skill_ids: string[]
  active_equipment: string[]
  block_phase: BlockPhase
  session_type: SessionType
  readiness_score: number
  week_number: number
  is_dup_heavy: boolean // Daily Undulating Periodization day type
  is_dup_medium: boolean
  is_dup_light: boolean
}

export interface PersonalRecord {
  id: string
  user_id: string
  progression_id: string
  progression_name?: string
  skill_name?: string
  value: number
  target_type: ExerciseTargetType
  achieved_at: string
  session_id?: string
}
