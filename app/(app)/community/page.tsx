'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '@/lib/store/app-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import type { UserChallenge } from '@/types'
import { getUsersAtPark } from '@/lib/supabase/parks'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
      style={{ width: size, height: size, background: 'var(--accent)', fontSize: size * 0.35 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Mock posts (shown when no friends yet) ────────────────────────────────────

const MOCK_POSTS = [
  { id: '1', display_name: 'Marcus K.',  type: 'skill_unlock', content: 'Finally got the straddle front lever! 4 months from advanced tuck.',             related_skill: 'Front Lever', created_at: '2026-04-18T09:00:00Z', likes: 24, liked: false },
  { id: '2', display_name: 'Sofia R.',   type: 'pr',           content: 'New PR on tuck planche — 18s hold. Getting closer to the unlock criteria.',       related_skill: 'Planche',     created_at: '2026-04-18T07:30:00Z', likes: 11, liked: true  },
  { id: '3', display_name: 'Jonas W.',   type: 'text',         content: 'Week 3 of accumulation block. Volume is high but I feel the progress building.',   related_skill: undefined,     created_at: '2026-04-17T20:00:00Z', likes:  7, liked: false },
]

const TYPE_ICON: Record<string, string> = { skill_unlock: '🔓', pr: '🏅', form_check: '🎥', text: '💬', challenge_complete: '🏆' }

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  return (
    <Card className="mb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar name={post.display_name} />
        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--text-primary)]">{post.display_name}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{timeAgo(post.created_at)}</div>
        </div>
        <span className="text-base">{TYPE_ICON[post.type] ?? '💬'}</span>
      </div>
      {post.related_skill && (
        <div className="mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">{post.related_skill}</span>
        </div>
      )}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{post.content}</p>
      <div className="flex items-center gap-4 pt-1 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1) }}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: liked ? 'var(--accent)' : 'var(--text-tertiary)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likes}
        </button>
      </div>
    </Card>
  )
}

// ─── Compose modal ────────────────────────────────────────────────────────────

function ComposeModal({ onClose }: { onClose: () => void }) {
  const createPost   = useAppStore(s => s.createPost)
  const skillLevels  = useAppStore(s => s.skillLevels)
  const [content, setContent]   = useState('')
  const [type, setType]         = useState<import('@/types').PostType>('text')
  const [skillId, setSkillId]   = useState('')

  const trackedSkills = skillLevels.filter(sl => sl.status !== 'locked')

  function submit() {
    if (!content.trim()) return
    createPost(content.trim(), type, skillId || undefined)
    onClose()
  }

  const types: { value: import('@/types').PostType; label: string; icon: string }[] = [
    { value: 'text',         label: 'Update',       icon: '💬' },
    { value: 'pr',           label: 'New PR',        icon: '🏅' },
    { value: 'skill_unlock', label: 'Skill unlock',  icon: '🔓' },
    { value: 'form_check',   label: 'Form check',    icon: '🎥' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">New post</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Type selector */}
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Type</div>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all"
                style={{
                  borderColor: type === t.value ? 'var(--accent)' : 'var(--border)',
                  background:  type === t.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
                  color:       type === t.value ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skill tag (optional) */}
        {trackedSkills.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Tag a skill <span className="normal-case">(optional)</span></div>
            <select
              value={skillId}
              onChange={e => setSkillId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="">No skill</option>
              {trackedSkills.map(sl => {
                const { SKILLS } = require('@/lib/data/skills')
                const skill = SKILLS.find((s: { id: string }) => s.id === sl.skill_id)
                return <option key={sl.skill_id} value={sl.skill_id}>{skill?.name ?? sl.skill_id}</option>
              })}
            </select>
          </div>
        )}

        {/* Content */}
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">What's on your mind?</div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your progress, a PR, a win…"
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
          <div className="text-right text-xs mt-1" style={{ color: content.length > 280 ? 'var(--danger)' : 'var(--text-tertiary)' }}>
            {content.length}/280
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4 border-t border-[var(--border)]">
        <button
          onClick={submit}
          disabled={!content.trim() || content.length > 280}
          className="w-full py-3 rounded-xl font-medium text-white transition-opacity"
          style={{ background: 'var(--accent)', opacity: !content.trim() || content.length > 280 ? 0.4 : 1 }}
        >
          Post
        </button>
      </div>
    </motion.div>
  )
}

// ─── Feed tab ─────────────────────────────────────────────────────────────────

function FeedTab() {
  const friends    = useAppStore(s => s.friends)
  const myPosts    = useAppStore(s => s.posts)
  const userProfile = useAppStore(s => s.userProfile)
  const [composing, setComposing] = useState(false)

  // Map store posts to the shape PostCard expects
  const myFeedPosts = myPosts.map(p => ({
    id: p.id,
    display_name: p.display_name ?? userProfile?.display_name ?? 'You',
    type: p.type,
    content: p.content,
    related_skill: p.related_skill_id,
    created_at: p.created_at,
    likes: p.likes_count,
    liked: p.liked_by_me ?? false,
  }))

  const allPosts = [...myFeedPosts, ...MOCK_POSTS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>
        {composing && <ComposeModal onClose={() => setComposing(false)} />}
      </AnimatePresence>

      {/* Compose button */}
      <button
        onClick={() => setComposing(true)}
        className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <span>Share an update, PR or win…</span>
      </button>

      {friends.length === 0 && myFeedPosts.length === 0 && (
        <Card className="mb-4 text-center py-4">
          <p className="text-sm text-[var(--text-secondary)]">Add friends to see their updates here.</p>
        </Card>
      )}
      {allPosts.map(post => <PostCard key={post.id} post={post} />)}
    </motion.div>
  )
}

// ─── Challenges tab ───────────────────────────────────────────────────────────

const MOCK_CHALLENGES = [
  { id: 'm1', title: '30-Day Handstand', type: 'streak' as const,        description: 'Practise handstand ≥10 min every day for 30 days.', end_date: '2026-05-18', participants: 142, my_progress: 8,  target: 30, joined: true,  created_by_me: false, invited_friend_ids: [] },
  { id: 'm2', title: 'Tuck Front Lever', type: 'skill_unlock' as const,  description: 'Hit a 10s tuck FL hold × 3 sets before end of April.', end_date: '2026-04-30', participants: 89,  my_progress: 0,  target: 1,  joined: false, created_by_me: false, invited_friend_ids: [] },
]

const CHALLENGE_COLORS: Record<string, string> = { streak: 'var(--accent)', skill_unlock: '#a78bfa', volume: 'var(--success)', group: '#60a5fa' }

function ChallengeCard({ challenge, onJoin }: { challenge: UserChallenge; onJoin?: () => void }) {
  const pct = Math.min(100, (challenge.my_progress / challenge.target) * 100)
  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / 86400000)
  const color = CHALLENGE_COLORS[challenge.type] ?? 'var(--accent)'

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1">
          <div className="text-xs font-medium mb-1 uppercase tracking-widest" style={{ color }}>{challenge.type.replace('_', ' ')}</div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{challenge.title}</h3>
          {challenge.created_by_me && <span className="text-[10px] text-[var(--text-tertiary)]">Created by you</span>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="mono text-xs text-[var(--text-tertiary)]">{daysLeft}d left</div>
          <div className="text-xs text-[var(--text-tertiary)]">{challenge.participants} athletes</div>
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">{challenge.description}</p>
      {challenge.joined && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="mono text-xs text-[var(--text-tertiary)]">{challenge.my_progress}</span>
            <span className="mono text-xs text-[var(--text-tertiary)]">{challenge.target}</span>
          </div>
          <div className="h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      )}
      {!challenge.joined && (
        <Button variant="secondary" size="sm" onClick={onJoin}>Join challenge</Button>
      )}
      {challenge.joined && (
        <span className="text-xs text-[var(--success)] font-medium">Joined ✓</span>
      )}
    </Card>
  )
}

function ChallengesTab() {
  const userChallenges = useAppStore(s => s.userChallenges)
  const joinChallenge  = useAppStore(s => s.joinChallenge)
  const createChallenge = useAppStore(s => s.createChallenge)
  const friends        = useAppStore(s => s.friends)
  const [showCreate, setShowCreate] = useState(false)

  // Merge mock + user-created
  const [mockList, setMockList] = useState(MOCK_CHALLENGES)
  const allChallenges: UserChallenge[] = [...mockList, ...userChallenges]

  const joinMock = (id: string) => setMockList(prev => prev.map(c => c.id === id ? { ...c, joined: true, participants: c.participants + 1 } : c))

  // Create form state
  const [form, setForm] = useState({ title: '', description: '', type: 'streak' as UserChallenge['type'], end_date: '', target: 10, invited: new Set<string>() })

  const handleCreate = () => {
    if (!form.title || !form.end_date) return
    createChallenge({ title: form.title, description: form.description, type: form.type, end_date: form.end_date, target: form.target, invited_friend_ids: Array.from(form.invited) })
    setShowCreate(false)
    setForm({ title: '', description: '', type: 'streak', end_date: '', target: 10, invited: new Set() })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--text-tertiary)]">{allChallenges.length} challenges</span>
        <button onClick={() => setShowCreate(true)} className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
          + Create
        </button>
      </div>

      {allChallenges.map(c => (
        <ChallengeCard key={c.id} challenge={c} onJoin={() => c.id.startsWith('m') ? joinMock(c.id) : joinChallenge(c.id)} />
      ))}

      {/* Create challenge modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--bg-base)] overflow-y-auto px-5 pt-12 pb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create challenge</h2>
              <button onClick={() => setShowCreate(false)} className="text-sm text-[var(--text-secondary)]">Cancel</button>
            </div>

            <div className="flex flex-col gap-3">
              <input
                placeholder="Challenge name"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] text-sm"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] text-sm resize-none"
              />

              {/* Type */}
              <div>
                <div className="text-xs text-[var(--text-tertiary)] mb-2">Type</div>
                <div className="flex gap-2">
                  {(['streak', 'skill_unlock', 'volume', 'group'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize"
                      style={{
                        borderColor: form.type === t ? 'var(--accent)' : 'var(--border)',
                        background: form.type === t ? 'var(--accent-muted)' : 'var(--bg-surface)',
                        color: form.type === t ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-xs text-[var(--text-tertiary)] mb-2">Target</div>
                  <input
                    type="number"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                    min={1}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] text-sm"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[var(--text-tertiary)] mb-2">End date</div>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] text-sm"
                  />
                </div>
              </div>

              {/* Invite friends */}
              {friends.length > 0 && (
                <div>
                  <div className="text-xs text-[var(--text-tertiary)] mb-2">Invite friends</div>
                  <div className="flex flex-col gap-2">
                    {friends.map(f => {
                      const invited = form.invited.has(f.id)
                      return (
                        <button
                          key={f.id}
                          onClick={() => setForm(prev => {
                            const next = new Set(prev.invited)
                            invited ? next.delete(f.id) : next.add(f.id)
                            return { ...prev, invited: next }
                          })}
                          className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                          style={{ borderColor: invited ? 'var(--accent)' : 'var(--border)', background: invited ? 'var(--accent-muted)' : 'var(--bg-surface)' }}
                        >
                          <Avatar name={f.display_name} size={28} />
                          <span className="text-sm text-[var(--text-primary)]">{f.display_name}</span>
                          {invited && <span className="ml-auto text-xs text-[var(--accent)]">Invited ✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Button fullWidth size="lg" disabled={!form.title || !form.end_date} onClick={handleCreate} className="mt-2">
                Create challenge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── People at parks ──────────────────────────────────────────────────────────

type ParkUser = {
  user_id: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user_profiles: any
}

function PeopleAtParks() {
  const parks      = useAppStore(s => s.parks)
  const addFriend  = useAppStore(s => s.addFriend)

  const [parkUsers, setParkUsers] = useState<Record<string, ParkUser[]>>({})
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (parks.length === 0) return
    setLoading(true)
    Promise.all(
      parks.map(async park => {
        try {
          const users = await getUsersAtPark(park.placeId)
          return { placeId: park.placeId, users: users as ParkUser[] }
        } catch {
          return { placeId: park.placeId, users: [] }
        }
      })
    ).then(results => {
      const map: Record<string, ParkUser[]> = {}
      for (const r of results) map[r.placeId] = r.users
      setParkUsers(map)
      setLoading(false)
    })
  }, [parks])

  if (parks.length === 0) {
    return (
      <div className="mt-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">People at your parks</div>
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            Add training spots in your profile to find people nearby.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">People at your parks</div>
      {loading && (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Loading…</p>
      )}
      {!loading && parks.map(park => {
        const users = parkUsers[park.placeId] ?? []
        return (
          <div key={park.placeId} className="mb-4">
            <div className="text-sm font-medium text-[var(--text-primary)] mb-2">{park.name}</div>
            {users.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] mb-2">No other athletes here yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {users.map(u => {
                  const displayName: string = u.user_profiles?.display_name ?? 'Athlete'
                  return (
                    <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--accent)' }}
                      >
                        {displayName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{displayName}</div>
                      </div>
                      <button
                        onClick={() => addFriend(u.user_id, displayName)}
                        className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition-opacity px-2"
                      >
                        Add friend
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Friends tab ──────────────────────────────────────────────────────────────

function FriendsTab() {
  const friends      = useAppStore(s => s.friends)
  const removeFriend = useAppStore(s => s.removeFriend)
  const userProfile  = useAppStore(s => s.userProfile)
  const [showQR, setShowQR] = useState(false)

  const addLink = userProfile
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://troop.app'}/add-friend?id=${userProfile.id}&name=${encodeURIComponent(userProfile.display_name)}`
    : ''

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* QR button */}
      <button
        onClick={() => setShowQR(true)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-[var(--border)] mb-4 hover:border-[var(--accent)] transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center group-hover:bg-[var(--accent-muted)] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
          </svg>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-[var(--text-primary)]">Add friend via QR</div>
          <div className="text-xs text-[var(--text-tertiary)]">Show your code or scan theirs</div>
        </div>
      </button>

      {/* Friends list */}
      {friends.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-[var(--text-secondary)]">No friends yet. Share your QR code to connect.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {friends.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <Avatar name={f.display_name} size={36} />
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">{f.display_name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Added {new Date(f.added_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
              </div>
              <button onClick={() => removeFriend(f.id)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors px-2">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <PeopleAtParks />

      {/* QR modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col items-center justify-center px-5"
          >
            <button onClick={() => setShowQR(false)} className="absolute top-12 right-5 text-sm text-[var(--text-secondary)]">
              Close
            </button>
            <h2 className="text-xl font-semibold mb-2">Your Troop code</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8 text-center">
              Let a friend scan this to connect, or share the link below.
            </p>
            {addLink && (
              <div className="p-5 bg-white rounded-2xl shadow-md mb-6">
                <QRCodeSVG value={addLink} size={220} bgColor="#ffffff" fgColor="#111827" level="M" />
              </div>
            )}
            <p className="text-xs text-[var(--text-tertiary)] text-center max-w-xs break-all">{addLink}</p>
            <button
              onClick={() => navigator.clipboard?.writeText(addLink)}
              className="mt-4 text-sm text-[var(--accent)] font-medium"
            >
              Copy link
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'feed' | 'challenges' | 'friends'

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>('feed')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'feed',       label: 'Feed'       },
    { id: 'challenges', label: 'Challenges' },
    { id: 'friends',    label: 'Friends'    },
  ]

  return (
    <div className="px-5 pt-12 pb-8 page-enter">
      <BackButton className="mb-2" />
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">The Troop</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Community</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-overlay)] p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? 'var(--bg-surface)' : 'transparent',
              color:      tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow:  tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed'       && <FeedTab />}
      {tab === 'challenges' && <ChallengesTab />}
      {tab === 'friends'    && <FriendsTab />}
    </div>
  )
}
