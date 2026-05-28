import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, TrendingUp, MessageCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { SECTIONS } from '../data/sections'
import { useTheme } from '../context/ThemeContext'

// ── Colors (resolved at runtime from theme) ───────────────────────────────────
const mkC = (t) => ({
  bg:        t.bgPrimary,
  card:      t.bgCard,
  border:    t.border,
  green:     t.primary,
  greenDark: t.primaryDark,
  greenBg:   t.primaryLight,
  dark:      t.textPrimary,
  muted:     t.textMuted,
})

// ── Bottom nav trophy icon ────────────────────────────────────────────────────
function TrophyNavIcon({ size = 22, color = '#AAAAAA' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <path d="M6 9H3.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h2.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

function NavItem({ icon: Icon, label, active, onClick }) {
  const { t } = useTheme()
  const color = active ? t.primary : t.textMuted
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
      <Icon size={22} color={color} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ color, fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
      {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.primary, marginTop: -1 }} />}
    </button>
  )
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ w = '100%', h = 14, radius = 6 }) {
  const { t } = useTheme()
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: `linear-gradient(90deg,${t.borderSubtle} 25%,${t.border} 50%,${t.borderSubtle} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const navigate = useNavigate()
  const { t }    = useTheme()
  const C        = mkC(t)

  const [userProgress, setUserProgress] = useState({})
  const [userStats,    setUserStats]    = useState({ totalXP: 0, streak: 0, completedSections: 0 })
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    // inject keyframe once
    if (!document.getElementById('learn-styles')) {
      const s = document.createElement('style')
      s.id = 'learn-styles'
      s.textContent = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`
      document.head.appendChild(s)
    }
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: progRows }, { data: prof }] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('total_xp, streak_days').eq('id', user.id).single(),
      ])

      const map = {}
      ;(progRows ?? []).forEach(r => { map[r.section_id] = r })
      setUserProgress(map)

      const completed = Object.values(map).filter(p => p.status === 'completed').length
      setUserStats({
        totalXP:          prof?.total_xp     ?? 0,
        streak:           prof?.streak_days  ?? 0,
        completedSections: completed,
      })
    } catch (err) {
      console.error('LearnPage fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getSectionStatus   = (id) => userProgress[id]?.status         ?? 'not_started'
  const getSectionProgress = (id) => userProgress[id]?.progress_percent ?? 0

  const isLocked = (section, idx) => {
    if (idx <= 2) return false
    const prev = SECTIONS[idx - 1]
    return getSectionStatus(prev.id) !== 'completed'
  }

  const handleSectionClick = (section, idx) => {
    if (isLocked(section, idx)) {
      toast.error(`Complete Section ${idx} first to unlock this!`)
      return
    }
    navigate(`/learn/${section.id}`)
  }

  const xpToNextLevel = 500
  const level = Math.floor(userStats.totalXP / 200) + 1

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bgPrimary, minHeight: '100dvh', maxWidth: 430, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 80 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px', background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <span style={{ color: C.dark, fontSize: 16, fontWeight: 800 }}>Learn & Practice</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 20, padding: '4px 10px', color: '#E65100', fontSize: 10, fontWeight: 700 }}>
            ⚡ {userStats.totalXP} XP
          </div>
          <div style={{ background: '#FCE4EC', border: '1px solid #F8BBD0', borderRadius: 20, padding: '4px 10px', color: '#880E4F', fontSize: 10, fontWeight: 700 }}>
            🔥 {userStats.streak}
          </div>
        </div>
      </div>

      {/* ── PROGRESS CARD ──────────────────────────────────────────────────── */}
      <div style={{ margin: '12px 14px', background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, borderTop: `3px solid ${t.primary}`, padding: '14px', boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Shimmer h={12} w="60%" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '4px 0' }}>
              {[1,2,3,4].map(i => <Shimmer key={i} h={36} radius={8} />)}
            </div>
            <Shimmer h={5} radius={3} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.dark, fontSize: 13, fontWeight: 800 }}>Your Progress</span>
              <span style={{ background: C.greenBg, color: C.greenDark, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: '1px solid #C8E6C9' }}>
                {userStats.completedSections}/8 Completed
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
              {[
                ['Done',   `${userStats.completedSections}`],
                ['Streak', `🔥${userStats.streak}`],
                ['XP',     `${userStats.totalXP}`],
                ['Level',  `${level}`],
              ].map(([label, val]) => (
                <div key={label} style={{ textAlign: 'center', background: t.bgPrimary, borderRadius: 10, padding: '8px 4px' }}>
                  <div style={{ color: C.dark, fontSize: 14, fontWeight: 800 }}>{val}</div>
                  <div style={{ color: C.muted, fontSize: 8, marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 5, background: t.borderSubtle, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: 5, borderRadius: 3, background: C.green, width: `${Math.min((userStats.totalXP / xpToNextLevel) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: C.muted, fontSize: 9 }}>{userStats.totalXP} XP</span>
              <span style={{ color: C.muted, fontSize: 9 }}>{xpToNextLevel} XP → Level {level + 1}</span>
            </div>
          </>
        )}
      </div>

      {/* ── DAILY QUIZ BANNER ──────────────────────────────────────────────── */}
      <div
        onClick={() => navigate('/learn/8')}
        style={{ margin: '0 14px 12px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFE082', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#633806', fontSize: 12, fontWeight: 800 }}>Final Quiz Challenge</div>
          <div style={{ color: '#854F0B', fontSize: 10 }}>5 questions · Earn +100 XP · All topics</div>
        </div>
        <div style={{ background: '#E65100', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          Start →
        </div>
      </div>

      {/* ── SECTIONS HEADER ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 14px', marginBottom: 8 }}>
        <span style={{ color: C.dark, fontSize: 13, fontWeight: 800 }}>8 Learning Sections</span>
        <span style={{ color: C.muted, fontSize: 10 }}>Tap to start</span>
      </div>

      {/* ── SECTIONS LIST ──────────────────────────────────────────────────── */}
      <div style={{ padding: '0 14px' }}>
        {isLoading
          ? [1,2,3,4].map(i => (
              <div key={i} style={{ background: t.bgCard, borderRadius: 16, border: `1px solid ${t.borderSubtle}`, padding: 14, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Shimmer w={48} h={48} radius={14} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Shimmer h={12} w="70%" />
                  <Shimmer h={9} w="90%" />
                  <Shimmer h={3} radius={2} />
                </div>
                <Shimmer w={52} h={24} radius={20} />
              </div>
            ))
          : SECTIONS.map((section, idx) => {
              const status   = getSectionStatus(section.id)
              const progress = getSectionProgress(section.id)
              const locked   = isLocked(section, idx)
              const isActive = status === 'in_progress'
              const isDone   = status === 'completed'

              return (
                <div
                  key={section.id}
                  onClick={() => handleSectionClick(section, idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                    background: isActive ? t.bgHover : t.bgCard,
                    borderRadius: 16,
                    border: isActive ? `1.5px solid ${t.primary}` : `1px solid ${t.borderSubtle}`,
                    marginBottom: 8,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.55 : 1,
                    boxShadow: isActive ? '0 2px 12px rgba(76,175,80,0.1)' : '0 1px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: section.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {locked ? '🔒' : section.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.dark, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {idx + 1}. {section.title}
                    </div>
                    <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>{section.description}</div>
                    <div style={{ height: 3, background: t.borderSubtle, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: 3, borderRadius: 2,
                        background: isDone ? C.green : '#2196F3',
                        width: `${isDone ? 100 : progress}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: isDone ? t.successBg : isActive ? '#E3F2FD' : locked ? t.borderSubtle : t.primaryLight,
                      color:      isDone ? t.success : isActive ? '#1565C0' : locked ? t.textMuted : t.primary,
                      border:     isDone ? `1px solid ${t.successBorder}` : isActive ? '1px solid #BBDEFB' : `1px solid ${t.borderSubtle}`,
                    }}>
                      {isDone ? 'Done ✓' : isActive ? `${progress}%` : locked ? 'Locked' : 'Start'}
                    </span>
                    <span style={{ color: C.muted, fontSize: 9 }}>+{section.xp} XP</span>
                  </div>
                </div>
              )
            })}
      </div>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: t.navBg, borderTop: `1px solid ${t.navBorder}`, padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      onClick={() => navigate('/home')}      />
        <NavItem icon={TrendingUp}    label="Trade"     onClick={() => navigate('/trade')}     />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyNavIcon size={22} color={t.textMuted} />
          <span style={{ color: t.textMuted, fontSize: 9, fontWeight: 500 }}>League</span>
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor" onClick={() => navigate('/ai-mentor')} />
        <NavItem icon={User}          label="Profile"   onClick={() => navigate('/profile')}   />
      </div>

    </div>
  )
}
