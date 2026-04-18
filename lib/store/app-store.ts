'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  UserProfile,
  UserSkillLevel,
  EquipmentProfile,
  TrainingBlock,
  WorkoutSession,
  PlannedExercise,
  LoggedExercise,
  LoggedSet,
  PersonalRecord,
  Friend,
  UserChallenge,
  UserPark,
} from '@/types'
import { PROGRESSIONS } from '@/lib/data/progressions'
import { generateWorkout, getBlockPhase, getSessionTypeForDay } from '@/lib/engine/workout-generator'
import { addDays, format, isSameDay, parseISO } from 'date-fns'

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // User
  userProfile: UserProfile | null
  skillLevels: UserSkillLevel[]
  equipmentProfiles: EquipmentProfile[]
  activeEquipmentProfileId: string | null

  // Current block
  currentBlock: TrainingBlock | null

  // Sessions
  sessions: WorkoutSession[]
  activeSessionId: string | null

  // Personal records
  personalRecords: PersonalRecord[]

  // Social
  friends: Friend[]
  userChallenges: UserChallenge[]

  // Parks
  parks: UserPark[]
  allowParkDiscovery: boolean

  // UI state
  readinessScore: number | null
  readinessCheckedToday: boolean

  // Actions
  initializeUser: (profile: UserProfile, skillLevels: UserSkillLevel[], equipmentProfile: EquipmentProfile) => void
  updateUserProfile: (updates: Partial<UserProfile>) => void
  addFriend: (id: string, display_name: string) => void
  removeFriend: (id: string) => void
  createChallenge: (challenge: Omit<UserChallenge, 'id' | 'participants' | 'my_progress' | 'joined' | 'created_by_me'>) => void
  joinChallenge: (id: string) => void
  setReadinessScore: (score: number) => void
  createFirstBlock: () => void
  generateTodaySession: () => WorkoutSession | null
  createSessionForDate: (weekNum: number, dayIdx: number, date: string) => WorkoutSession | null
  startSession: (sessionId: string) => void
  logSet: (sessionId: string, exerciseId: string, set: LoggedSet) => void
  completeSession: (sessionId: string) => void
  skipSession: (sessionId: string) => void
  addEquipmentProfile: (profile: Omit<EquipmentProfile, 'id'>) => void
  updateEquipmentProfile: (id: string, updates: Partial<EquipmentProfile>) => void
  deleteEquipmentProfile: (id: string) => void
  setActiveEquipmentProfile: (id: string) => void
  advanceProgression: (skillId: string) => void
  regressProgression: (skillId: string) => void
  restoreFromCloud: (data: import('@/lib/supabase/sync').SupabaseUserData) => void
  addPark: (park: UserPark) => void
  removePark: (placeId: string) => void
  setAllowParkDiscovery: (allow: boolean) => void
  getTodaySession: () => WorkoutSession | null
  getActiveSession: () => WorkoutSession | null
  getActiveEquipment: () => string[]
  getStreak: () => number
  getWeeklySessionCount: () => { done: number; total: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      skillLevels: [],
      equipmentProfiles: [],
      activeEquipmentProfileId: null,
      currentBlock: null,
      sessions: [],
      activeSessionId: null,
      personalRecords: [],
      friends: [],
      userChallenges: [],
      parks: [],
      allowParkDiscovery: true,
      readinessScore: null,
      readinessCheckedToday: false,

      initializeUser: (profile, skillLevels, equipmentProfile) => {
        const profileWithId = { ...profile, id: profile.id || generateId() }
        const epWithId = { ...equipmentProfile, id: generateId(), user_id: profileWithId.id }
        set({
          userProfile: profileWithId,
          skillLevels,
          equipmentProfiles: [epWithId],
          activeEquipmentProfileId: epWithId.id,
        })
        // Create first block
        get().createFirstBlock()
      },

      updateUserProfile: (updates) => {
        set(state => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null,
        }))
      },

      setReadinessScore: (score) => {
        set({ readinessScore: score, readinessCheckedToday: true })
        // Regenerate today's session with the new readiness score
        const today = get().getTodaySession()
        if (today && today.status === 'planned') {
          get().generateTodaySession()
        }
      },

      createFirstBlock: () => {
        const { userProfile, skillLevels } = get()
        if (!userProfile) return

        const focusSkills = skillLevels
          .filter(sl => sl.status === 'focus')
          .map(sl => sl.skill_id)

        const maintenanceSkills = skillLevels
          .filter(sl => sl.status === 'maintenance')
          .map(sl => sl.skill_id)

        const startDate = new Date()
        const endDate = addDays(startDate, 35) // 5-week block

        const block: TrainingBlock = {
          id: generateId(),
          user_id: userProfile.id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          duration_weeks: 5,
          focus_skill_ids: focusSkills,
          maintenance_skill_ids: maintenanceSkills,
          current_phase: 'accumulation',
          current_week: 1,
          status: 'active',
        }

        set({ currentBlock: block })

        // Pre-generate sessions for the next 7 days
        const sessions = generateSessionsForWeek(block, userProfile, get().skillLevels, get().getActiveEquipment())
        set(state => ({ sessions: [...state.sessions, ...sessions] }))
      },

      generateTodaySession: () => {
        const { userProfile, currentBlock, skillLevels, readinessScore } = get()
        if (!userProfile || !currentBlock) return null

        const today = todayStr()
        const existing = get().sessions.find(s => s.date === today && s.type === 'program')
        if (existing) return existing

        // Determine day index in the training week
        const trainingDays = userProfile.training_days.sort((a, b) => a - b)
        const todayDow = new Date().getDay()
        const dayIndex = trainingDays.indexOf(todayDow)

        if (dayIndex === -1) {
          // Rest day
          const restSession: WorkoutSession = {
            id: generateId(),
            user_id: userProfile.id,
            training_block_id: currentBlock.id,
            date: today,
            type: 'rest_day_activity',
            session_type: 'rest',
            session_label: 'Rest Day',
            planned_exercises: [],
            readiness_score: readinessScore ?? 4,
            status: 'planned',
          }
          set(state => ({ sessions: [...state.sessions, restSession] }))
          return restSession
        }

        const { type: sessionType, label } = getSessionTypeForDay(dayIndex, userProfile.training_frequency)
        const phase = getBlockPhase(currentBlock.current_week, currentBlock.duration_weeks)
        const activeEquipment = get().getActiveEquipment()

        const result = generateWorkout({
          userId: userProfile.id,
          userProfile,
          skillLevels,
          focusSkillIds: currentBlock.focus_skill_ids,
          activeEquipment,
          blockPhase: phase,
          sessionType,
          sessionLabel: label,
          readinessScore: readinessScore ?? 4,
          weekNumber: currentBlock.current_week,
          trainingFrequency: userProfile.training_frequency,
          sessionIndexThisWeek: dayIndex,
          date: today,
        })

        const session: WorkoutSession = {
          id: generateId(),
          user_id: userProfile.id,
          training_block_id: currentBlock.id,
          date: today,
          type: 'program',
          session_type: sessionType,
          session_label: label,
          week_number: currentBlock.current_week,
          planned_exercises: result.exercises,
          readiness_score: readinessScore ?? 4,
          status: 'planned',
        }

        set(state => ({ sessions: [...state.sessions, session] }))
        return session
      },

      startSession: (sessionId) => {
        set(state => ({
          activeSessionId: sessionId,
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, status: 'in_progress' } : s
          ),
        }))
      },

      logSet: (sessionId, exerciseId, loggedSet) => {
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s
            const logged = s.logged_exercises ?? s.planned_exercises.map(e => ({ ...e, actual_sets: [], completed: false } as LoggedExercise))
            const updated = logged.map(e => {
              if (e.id !== exerciseId) return e
              const newSets = [...(e.actual_sets ?? []), loggedSet]
              return { ...e, actual_sets: newSets, completed: newSets.length >= e.planned_sets }
            })
            return { ...s, logged_exercises: updated }
          }),
        }))

        // Check for PR
        const { sessions, userProfile, personalRecords } = get()
        const session = sessions.find(s => s.id === sessionId)
        if (!session || !userProfile) return

        const exercise = (session.logged_exercises ?? []).find(e => e.id === exerciseId)
        if (!exercise) return

        const prog = PROGRESSIONS.find(p => p.id === exercise.progression_id)
        if (!prog) return

        const existing = personalRecords.filter(pr => pr.progression_id === exercise.progression_id)
        const bestExisting = Math.max(...existing.map(pr => pr.value), 0)

        if (loggedSet.value > bestExisting) {
          const pr: PersonalRecord = {
            id: generateId(),
            user_id: userProfile.id,
            progression_id: exercise.progression_id,
            value: loggedSet.value,
            target_type: exercise.planned_target.type,
            achieved_at: new Date().toISOString(),
            session_id: sessionId,
          }
          set(state => ({ personalRecords: [...state.personalRecords, pr] }))
        }
      },

      completeSession: (sessionId) => {
        set(state => ({
          activeSessionId: null,
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? { ...s, status: 'completed', duration_minutes: Math.round((Date.now() - new Date(s.date).getTime()) / 60000) }
              : s
          ),
        }))
      },

      skipSession: (sessionId) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, status: 'skipped' } : s
          ),
        }))
      },

      addEquipmentProfile: (profile) => {
        const id = generateId()
        const { userProfile } = get()
        if (!userProfile) return
        const newProfile: EquipmentProfile = { ...profile, id, user_id: userProfile.id }
        set(state => ({ equipmentProfiles: [...state.equipmentProfiles, newProfile] }))
      },

      updateEquipmentProfile: (id, updates) => {
        set(state => ({
          equipmentProfiles: state.equipmentProfiles.map(p => p.id === id ? { ...p, ...updates } : p),
        }))
      },

      deleteEquipmentProfile: (id) => {
        set(state => ({
          equipmentProfiles: state.equipmentProfiles.filter(p => p.id !== id),
          activeEquipmentProfileId: state.activeEquipmentProfileId === id
            ? (state.equipmentProfiles.find(p => p.id !== id)?.id ?? null)
            : state.activeEquipmentProfileId,
        }))
      },

      setActiveEquipmentProfile: (id) => {
        set({ activeEquipmentProfileId: id })
      },

      advanceProgression: (skillId) => {
        set(state => ({
          skillLevels: state.skillLevels.map(sl => {
            if (sl.skill_id !== skillId) return sl
            const progs = PROGRESSIONS.filter(p => p.skill_id === skillId).sort((a, b) => a.level - b.level)
            const next = progs.find(p => p.level === sl.current_progression_level + 1)
            if (!next) return sl
            return { ...sl, current_progression_id: next.id, current_progression_level: next.level }
          }),
        }))
      },

      addFriend: (id, display_name) => {
        set(state => {
          if (state.friends.some(f => f.id === id)) return state
          return { friends: [...state.friends, { id, display_name, added_at: new Date().toISOString() }] }
        })
      },

      removeFriend: (id) => {
        set(state => ({ friends: state.friends.filter(f => f.id !== id) }))
      },

      createChallenge: (challenge) => {
        const id = generateId()
        const newChallenge: UserChallenge = {
          ...challenge,
          id,
          participants: 1,
          my_progress: 0,
          joined: true,
          created_by_me: true,
        }
        set(state => ({ userChallenges: [...state.userChallenges, newChallenge] }))
      },

      joinChallenge: (id) => {
        set(state => ({
          userChallenges: state.userChallenges.map(c =>
            c.id === id ? { ...c, joined: true, participants: c.participants + 1 } : c
          ),
        }))
      },

      regressProgression: (skillId) => {
        set(state => ({
          skillLevels: state.skillLevels.map(sl => {
            if (sl.skill_id !== skillId) return sl
            const progs = PROGRESSIONS.filter(p => p.skill_id === skillId).sort((a, b) => a.level - b.level)
            const prev = progs.find(p => p.level === sl.current_progression_level - 1)
            if (!prev) return sl
            return { ...sl, current_progression_id: prev.id, current_progression_level: prev.level }
          }),
        }))
      },

      restoreFromCloud: (data) => {
        const { profile, skillLevels, equipment, block, sessions, prs } = data
        if (!profile) return
        set({
          userProfile: profile,
          skillLevels,
          equipmentProfiles: equipment,
          activeEquipmentProfileId: equipment.find(e => e.is_default)?.id ?? equipment[0]?.id ?? null,
          currentBlock: block,
          sessions,
          personalRecords: prs,
        })
      },

      createSessionForDate: (weekNum, dayIdx, date) => {
        const { userProfile, currentBlock, skillLevels, readinessScore } = get()
        if (!userProfile || !currentBlock) return null

        const existing = get().sessions.find(s => s.date === date && s.type === 'program')
        if (existing) return existing

        const { type: sessionType, label } = getSessionTypeForDay(dayIdx, userProfile.training_frequency)
        const phase = getBlockPhase(weekNum, currentBlock.duration_weeks)
        const activeEquipment = get().getActiveEquipment()

        const result = generateWorkout({
          userId: userProfile.id,
          userProfile,
          skillLevels,
          focusSkillIds: currentBlock.focus_skill_ids,
          activeEquipment,
          blockPhase: phase,
          sessionType,
          sessionLabel: label,
          readinessScore: readinessScore ?? 4,
          weekNumber: weekNum,
          trainingFrequency: userProfile.training_frequency,
          sessionIndexThisWeek: dayIdx,
          date,
        })

        const session: WorkoutSession = {
          id: generateId(),
          user_id: userProfile.id,
          training_block_id: currentBlock.id,
          date,
          type: 'program',
          session_type: sessionType,
          session_label: label,
          week_number: weekNum,
          planned_exercises: result.exercises,
          readiness_score: readinessScore ?? 4,
          status: 'planned',
        }

        set(state => ({ sessions: [...state.sessions, session] }))
        return session
      },

      addPark: (park) => {
        set(state => {
          if (state.parks.some(p => p.placeId === park.placeId)) return state
          return { parks: [...state.parks, park] }
        })
      },

      removePark: (placeId) => {
        set(state => ({ parks: state.parks.filter(p => p.placeId !== placeId) }))
      },

      setAllowParkDiscovery: (allow) => {
        set({ allowParkDiscovery: allow })
      },

      getTodaySession: () => {
        const today = todayStr()
        return get().sessions.find(s => s.date === today && s.type !== 'custom') ?? null
      },

      getActiveSession: () => {
        const { activeSessionId, sessions } = get()
        if (!activeSessionId) return null
        return sessions.find(s => s.id === activeSessionId) ?? null
      },

      getActiveEquipment: () => {
        const { equipmentProfiles, activeEquipmentProfileId } = get()
        const active = equipmentProfiles.find(p => p.id === activeEquipmentProfileId)
          ?? equipmentProfiles.find(p => p.is_default)
          ?? equipmentProfiles[0]
        return active?.equipment_ids ?? ['floor', 'wall']
      },

      getStreak: () => {
        const { sessions } = get()
        const completed = sessions
          .filter(s => s.status === 'completed')
          .map(s => s.date)
          .sort((a, b) => b.localeCompare(a))

        if (completed.length === 0) return 0

        let streak = 0
        let current = new Date()

        for (let i = 0; i < 365; i++) {
          const dateStr = format(current, 'yyyy-MM-dd')
          if (completed.includes(dateStr)) {
            streak++
            current = addDays(current, -1)
          } else if (i === 0) {
            // Today not completed yet — don't break streak
            current = addDays(current, -1)
          } else {
            break
          }
        }
        return streak
      },

      getWeeklySessionCount: () => {
        const { sessions, userProfile } = get()
        if (!userProfile) return { done: 0, total: 0 }

        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Sunday

        const thisWeekSessions = sessions.filter(s => {
          const d = parseISO(s.date)
          return d >= weekStart && d <= today && s.type === 'program'
        })

        const done = thisWeekSessions.filter(s => s.status === 'completed').length
        return { done, total: userProfile.training_frequency }
      },
    }),
    {
      name: 'troop-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        skillLevels: state.skillLevels,
        equipmentProfiles: state.equipmentProfiles,
        activeEquipmentProfileId: state.activeEquipmentProfileId,
        currentBlock: state.currentBlock,
        sessions: state.sessions,
        personalRecords: state.personalRecords,
        friends: state.friends,
        userChallenges: state.userChallenges,
        parks: state.parks,
        allowParkDiscovery: state.allowParkDiscovery,
      }),
    }
  )
)

// ─── Generate sessions for a week ─────────────────────────────────────────────

function generateSessionsForWeek(
  block: TrainingBlock,
  profile: UserProfile,
  skillLevels: UserSkillLevel[],
  activeEquipment: string[],
): WorkoutSession[] {
  const sessions: WorkoutSession[] = []
  const today = new Date()
  const sortedDays = [...profile.training_days].sort((a, b) => a - b)

  sortedDays.forEach((dow, dayIndex) => {
    // Find next occurrence of this day of week
    const daysUntil = (dow - today.getDay() + 7) % 7
    const sessionDate = addDays(today, daysUntil)
    const dateStr = format(sessionDate, 'yyyy-MM-dd')

    const { type: sessionType, label } = getSessionTypeForDay(dayIndex, profile.training_frequency)
    const phase = getBlockPhase(block.current_week, block.duration_weeks)

    const result = generateWorkout({
      userId: profile.id,
      userProfile: profile,
      skillLevels,
      focusSkillIds: block.focus_skill_ids,
      activeEquipment,
      blockPhase: phase,
      sessionType,
      sessionLabel: label,
      readinessScore: 4, // default
      weekNumber: block.current_week,
      trainingFrequency: profile.training_frequency,
      sessionIndexThisWeek: dayIndex,
      date: dateStr,
    })

    sessions.push({
      id: Math.random().toString(36).slice(2),
      user_id: profile.id,
      training_block_id: block.id,
      date: dateStr,
      type: 'program',
      session_type: sessionType,
      session_label: label,
      week_number: block.current_week,
      planned_exercises: result.exercises,
      readiness_score: 4,
      status: 'planned',
    })
  })

  return sessions
}
