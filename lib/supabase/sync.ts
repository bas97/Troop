import { createClient } from './client'
import type {
  UserProfile, UserSkillLevel, EquipmentProfile,
  TrainingBlock, WorkoutSession, PersonalRecord,
} from '@/types'

// ─── Load all user data from Supabase ────────────────────────────────────────

export interface SupabaseUserData {
  profile:     UserProfile | null
  skillLevels: UserSkillLevel[]
  equipment:   EquipmentProfile[]
  block:       TrainingBlock | null
  sessions:    WorkoutSession[]
  prs:         PersonalRecord[]
}

export async function loadUserData(userId: string): Promise<SupabaseUserData> {
  const sb = createClient()

  const [
    { data: profile },
    { data: skillLevels },
    { data: equipment },
    { data: block },
    { data: sessions },
    { data: prs },
  ] = await Promise.all([
    sb.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
    sb.from('user_skill_levels').select('*').eq('user_id', userId),
    sb.from('equipment_profiles').select('*').eq('user_id', userId),
    sb.from('training_blocks').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    sb.from('workout_sessions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(200),
    sb.from('personal_records').select('*').eq('user_id', userId),
  ])

  return {
    profile:     profile as UserProfile | null,
    skillLevels: (skillLevels ?? []) as UserSkillLevel[],
    equipment:   (equipment ?? []) as EquipmentProfile[],
    block:       block as TrainingBlock | null,
    sessions:    (sessions ?? []) as WorkoutSession[],
    prs:         (prs ?? []) as PersonalRecord[],
  }
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

export async function syncProfile(profile: UserProfile, authUserId: string) {
  const sb = createClient()
  await sb.from('user_profiles').upsert({ ...profile, id: authUserId })
}

export async function syncSkillLevels(levels: UserSkillLevel[], authUserId: string) {
  const sb = createClient()
  if (!levels.length) return
  await sb.from('user_skill_levels').upsert(levels.map(l => ({ ...l, user_id: authUserId })))
}

export async function syncEquipmentProfiles(profiles: EquipmentProfile[], authUserId: string) {
  const sb = createClient()
  if (!profiles.length) return
  await sb.from('equipment_profiles').upsert(profiles.map(p => ({ ...p, user_id: authUserId })))
}

export async function syncBlock(block: TrainingBlock, authUserId: string) {
  const sb = createClient()
  await sb.from('training_blocks').upsert({ ...block, user_id: authUserId })
}

export async function syncSession(session: WorkoutSession, authUserId: string) {
  const sb = createClient()
  await sb.from('workout_sessions').upsert({ ...session, user_id: authUserId })
}

export async function syncPR(pr: PersonalRecord, authUserId: string) {
  const sb = createClient()
  await sb.from('personal_records').upsert({ ...pr, user_id: authUserId })
}
