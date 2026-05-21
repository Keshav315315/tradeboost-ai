import { motion, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export default function XPProgressBar({ current = 0, max = 500, level = 1, compact = false }) {
  const [display, setDisplay] = useState(0)
  const pct = Math.min((current / max) * 100, 100)

  useEffect(() => {
    const ctrl = animate(0, current, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v)),
    })
    return ctrl.stop
  }, [current])

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Zap size={12} color="#FBB040" fill="#FBB040" />
        <span style={{ color: '#FBB040', fontSize: 11, fontWeight: 700 }}>{display} XP</span>
        <div style={{ flex: 1, height: 4, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden', minWidth: 50 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #4CAF50, #2E7D32)', borderRadius: 4 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
              borderRadius: 8,
              padding: '2px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Zap size={10} color="#fff" fill="#fff" />
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>LVL {level}</span>
          </div>
        </div>
        <span style={{ color: '#888888', fontSize: 10, fontWeight: 600 }}>{display} / {max} XP</span>
      </div>
      <div style={{ height: 8, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.1 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50, #2E7D32)',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ x: ['-100%', '250%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1.5 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
