'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { loadUserData, syncProfile, syncSkillLevels, syncEquipmentProfiles, syncBlock, syncSession, syncPR } from '@/lib/supabase/sync'

export function SyncProvider() {
  const userProfile       = useAppStore(s => s.userProfile)
  const skillLevels       = useAppStore(s => s.skillLevels)
  const sessions          = useAppStore(s => s.sessions)
  const currentBlock      = useAppStore(s => s.currentBlock)
  const equipmentProfiles = useAppStore(s => s.equipmentProfiles)
  const personalRecords   = useAppStore(s => s.personalRecords)
  const restoreFromCloud  = useAppStore(s => s.restoreFromCloud)

  // Use state (not ref) so the sync effect re-runs once auth resolves
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load from Supabase ────────────────────────────────────────────────
  async function loadFromCloud() {
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      if (!authUserId) setAuthUserId(user.id)

      const data = await loadUserData(user.id)
      if (data.profile) restoreFromCloud(data)
    } catch {
      // Supabase not configured — use localStorage
    }
  }

  // On mount: load once
  useEffect(() => {
    loadFromCloud()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-load whenever the app becomes visible again (switching devices / tabs)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') loadFromCloud()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId])

  // ── Debounced write back to Supabase on state changes ────────────────
  // authUserId is now in deps — so the effect re-runs once auth resolves,
  // ensuring the initial sync actually fires.
  useEffect(() => {
    if (!authUserId) return
    if (syncTimer.current) clearTimeout(syncTimer.current)

    syncTimer.current = setTimeout(async () => {
      try {
        if (userProfile)              await syncProfile(userProfile, authUserId)
        if (skillLevels.length)       await syncSkillLevels(skillLevels, authUserId)
        if (equipmentProfiles.length) await syncEquipmentProfiles(equipmentProfiles, authUserId)
        if (currentBlock)             await syncBlock(currentBlock, authUserId)
        for (const s of sessions.filter(s => s.status !== 'planned')) {
          await syncSession(s, authUserId)
        }
        for (const pr of personalRecords) {
          await syncPR(pr, authUserId)
        }
      } catch {
        // silent
      }
    }, 2000)
  }, [authUserId, userProfile, skillLevels, sessions, currentBlock, equipmentProfiles, personalRecords])

  return null
}
