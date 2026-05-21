import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { X, Zap } from 'lucide-react'

const PARTICLES = [
  { x: -90, y: -70, color: '#4CAF50', size: 8 },
  { x: 90, y: -70, color: '#FBB040', size: 10 },
  { x: -110, y: 10, color: '#4CAF50', size: 6 },
  { x: 110, y: 10, color: '#E53935', size: 8 },
  { x: -60, y: 80, color: '#2E7D32', size: 10 },
  { x: 60, y: 80, color: '#4CAF50', size: 6 },
  { x: 20, y: -100, color: '#FBB040', size: 8 },
  { x: -20, y: 100, color: '#4CAF50', size: 8 },
  { x: 130, y: -30, color: '#2E7D32', size: 6 },
  { x: -130, y: -30, color: '#E53935', size: 6 },
]

function Particle({ x, y, color, size, delay }) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
      animate={{ opacity: 0, scale: 1.5, x, y, rotate: 180 }}
      transition={{ duration: 0.9, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute', top: '50%', left: '50%',
        width: size, height: size,
        borderRadius: 2,
        background: color,
        pointerEvents: 'none',
        marginLeft: -size / 2, marginTop: -size / 2,
      }}
    />
  )
}

export default function AchievementPopup({
  show,
  onDismiss,
  title = 'Lesson Complete!',
  description = 'You crushed it!',
  xp = 40,
  emoji = '🏆',
}) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [show, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 50, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8F5E9',
              borderRadius: 28,
              padding: '36px 32px 28px',
              textAlign: 'center',
              width: 310, maxWidth: '92vw',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Glow ring */}
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.03, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                position: 'absolute', inset: -3,
                borderRadius: 31,
                border: '2px solid #4CAF50',
                pointerEvents: 'none',
              }}
            />

            {/* Particles */}
            {PARTICLES.map((p, i) => (
              <Particle key={i} delay={i * 0.04} {...p} />
            ))}

            {/* Close */}
            <button
              onClick={onDismiss}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: '#F5F9F5',
                border: 'none', borderRadius: 10, padding: '5px 6px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              <X size={13} color="#888888" />
            </button>

            {/* Emoji */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}
            >
              {emoji}
            </motion.div>

            {/* Badge label */}
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(251,176,64,0.15)',
                border: '1px solid rgba(251,176,64,0.4)',
                borderRadius: 20,
                padding: '3px 12px',
                color: '#FBB040',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Achievement Unlocked
            </div>

            <p style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
              {title}
            </p>
            <p style={{ color: '#888888', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>
              {description}
            </p>

            {xp > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.5, stiffness: 400 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(76,175,80,0.1)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  borderRadius: 20, padding: '8px 20px',
                }}
              >
                <Zap size={14} color="#FBB040" fill="#FBB040" />
                <span style={{ color: '#FBB040', fontWeight: 800, fontSize: 15 }}>+{xp} XP earned!</span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
