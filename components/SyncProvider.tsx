'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { loadUserData, syncProfile, syncSkillLevels, syncEquipmentProfiles, syncBlock, syncSession } from '@/lib/supabase/sync'

export function SyncProvider() {
  const store             = useAppStore()
  const userProfile       = useAppStore(s => s.userProfile)
  const skillLevels       = useAppStore(s => s.skillLevels)
  const sessions          = useAppStore(s => s.sessions)
  const currentBlock      = useAppStore(s => s.currentBlock)
  const equipmentProfiles = useAppStore(s => s.equipmentProfiles)
  const restoreFromCloud  = useAppStore(s => s.restoreFromCloud)
  const loaded            = useRef(false)
  const syncTimer         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const authUserId        = useRef<string | null>(null)

  // ── On mount: try to load from Supabase ──────────────────────────────
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    ;(async () => {
      try {
        const sb = createClient()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) return
        authUserId.current = user.id

        const data = await loadUserData(user.id)
        if (data.profile) {
          restoreFromCloud(data)
        }
      } catch {
        // Supabase not configured or tables missing — use localStorage
      }
    })()
  }, [restoreFromCloud])

  // ── Debounced sync back to Supabase whenever key state changes ────────
  useEffect(() => {
    if (!authUserId.current) return
    if (syncTimer.current) clearTimeout(syncTimer.current)

    syncTimer.current = setTimeout(async () => {
      const uid = authUserId.current
      if (!uid) return
      try {
        if (userProfile)       await syncProfile(userProfile, uid)
        if (skillLevels.length) await syncSkillLevels(skillLevels, uid)
        if (equipmentProfiles.length) await syncEquipmentProfiles(equipmentProfiles, uid)
        if (currentBlock)      await syncBlock(currentBlock, uid)
        for (const s of sessions.filter(s => s.status === 'completed' || s.status === 'skipped')) {
          await syncSession(s, uid)
        }
      } catch {
        // silent
      }
    }, 3000)
  }, [userProfile, skillLevels, sessions, currentBlock, equipmentProfiles])

  void store

  return null
}
