'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const SPLASH_KEY = 'troop_splash_shown'

export function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show once per browser session
    if (typeof window === 'undefined') return
    const shown = sessionStorage.getItem(SPLASH_KEY)
    if (shown) return
    sessionStorage.setItem(SPLASH_KEY, '1')
    setVisible(true)

    // Hold for 1.8s then fade out
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#3a3a3a' }}
        >
          {/* Gorilla face */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/brand/gorilla-face.png"
              alt="Troop"
              width={140}
              height={140}
              priority
              style={{ display: 'block', borderRadius: '24px' }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.3 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              fontSize: '2rem',
              letterSpacing: '-0.04em',
              color: '#ffffff',
              marginTop: '18px',
              lineHeight: 1,
            }}
          >
            troop
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              marginTop: '7px',
            }}
          >
            train with the troop
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
