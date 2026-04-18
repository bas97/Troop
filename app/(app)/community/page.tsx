'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ─── Mock data ──────────────────────────────────────────────────────���─────────

const MOCK_POSTS = [
  {
    id: '1',
    display_name: 'Marcus K.',
    type: 'skill_unlock',
    content: 'Finally got the straddle front lever! Took me 4 months from advanced tuck but the moment it clicked was worth every frustrating session.',
    related_skill: 'Front Lever',
    created_at: '2026-04-18T09:00:00Z',
    likes_count: 24,
    comments_count: 5,
    liked_by_me: false,
  },
  {
    id: '2',
    display_name: 'Sofia R.',
    type: 'pr',
    content: 'New PR on tuck planche — held 18s. Getting closer to the advanced tuck unlock criteria (10s target). Parallettes are a game changer for the wrists.',
    related_skill: 'Planche',
    created_at: '2026-04-18T07:30:00Z',
    likes_count: 11,
    comments_count: 2,
    liked_by_me: true,
  },
  {
    id: '3',
    display_name: 'Jonas W.',
    type: 'text',
    content: 'Week 3 of the accumulation block. Volume is high but I can feel my front lever rows getting stronger. Trusting the process.',
    created_at: '2026-04-17T20:00:00Z',
    likes_count: 7,
    comments_count: 0,
    liked_by_me: false,
  },
]

const MOCK_CHALLENGES = [
  {
    id: '1',
    title: '30-Day Handstand Challenge',
    type: 'streak',
    description: 'Practice handstand at least 10 minutes every day for 30 days.',
    end_date: '2026-05-18',
    participants: 142,
    my_progress: 8,
    target: 30,
    joined: true,
  },
  {
    id: '2',
    title: 'Unlock the Tuck Front Lever',
    type: 'skill_unlock',
    description: 'Achieve a 10s tuck front lever hold × 3 sets before end of April.',
    end_date: '2026-04-30',
    participants: 89,
    my_progress: 0,
    target: 1,
    joined: false,
  },
  {
    id: '3',
    title: 'April Volume Run',
    type: 'volume',
    description: 'Log 80+ training sets this month.',
    end_date: '2026-04-30',
    participants: 231,
    my_progress: 34,
    target: 80,
    joined: true,
  },
]

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  const [liked, setLiked] = useState(post.liked_by_me)
  const [likes, setLikes] = useState(post.likes_count)

  const typeEmoji: Record<string, string> = {
    skill_unlock: '🔓',
    pr: '🏅',
    form_check: '🎥',
    text: '💬',
    challenge_complete: '🏆',
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <Card className="mb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-overlay)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
          {post.display_name[0]}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--text-primary)]">{post.display_name}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{timeAgo(post.created_at)}</div>
        </div>
        <span className="text-base">{typeEmoji[post.type] ?? '💬'}</span>
      </div>

      {post.related_skill && (
        <div className="mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)]">
            {post.related_skill}
          </span>
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
        <button className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.comments_count}
        </button>
      </div>
    </Card>
  )
}

// ─── Challenge card ───────────────────────────────────────────────────────────

function ChallengeCard({ challenge }: { challenge: typeof MOCK_CHALLENGES[0] }) {
  const [joined, setJoined] = useState(challenge.joined)
  const pct = Math.min(100, (challenge.my_progress / challenge.target) * 100)

  const typeColors: Record<string, string> = {
    streak: 'var(--accent)',
    skill_unlock: '#a78bfa',
    volume: 'var(--success)',
    group: '#60a5fa',
  }

  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / 86400000)

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div
            className="text-xs font-medium mb-1 uppercase tracking-widest"
            style={{ color: typeColors[challenge.type] }}
          >
            {challenge.type.replace('_', ' ')}
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{challenge.title}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="mono text-xs text-[var(--text-tertiary)]">{daysLeft}d left</div>
          <div className="text-xs text-[var(--text-tertiary)]">{challenge.participants} athletes</div>
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-3">{challenge.description}</p>

      {joined && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="mono text-xs text-[var(--text-tertiary)]">{challenge.my_progress}</span>
            <span className="mono text-xs text-[var(--text-tertiary)]">{challenge.target}</span>
          </div>
          <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: typeColors[challenge.type] }}
            />
          </div>
        </div>
      )}

      <Button
        variant={joined ? 'ghost' : 'secondary'}
        size="sm"
        onClick={() => setJoined(j => !j)}
      >
        {joined ? 'Joined ✓' : 'Join challenge'}
      </Button>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'feed' | 'challenges' | 'partners'

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>('feed')

  return (
    <div className="px-5 pt-12 page-enter">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-1">The Troop</div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Community</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-elevated)] p-1 rounded-xl">
        {(['feed', 'challenges', 'partners'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? 'var(--bg-overlay)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {MOCK_POSTS.map(post => <PostCard key={post.id} post={post} />)}
          <div className="text-center pt-4">
            <Button variant="ghost" size="sm">Share a PR or update</Button>
          </div>
        </motion.div>
      )}

      {tab === 'challenges' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {MOCK_CHALLENGES.map(c => <ChallengeCard key={c.id} challenge={c} />)}
        </motion.div>
      )}

      {tab === 'partners' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-5xl mb-4">🦍</div>
          <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Find your Troop</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs mx-auto">
            Training partners keep you accountable. Connect your account to find athletes at your level.
          </p>
          <Button variant="secondary" size="md">
            Create account to connect
          </Button>
        </motion.div>
      )}
    </div>
  )
}
