import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const C = {
  bg:        '#F8FAF8',
  card:      '#FFFFFF',
  border:    '#E8F5E9',
  green:     '#4CAF50',
  greenDark: '#2E7D32',
  greenBg:   '#E8F5E9',
  red:       '#E53935',
  redDark:   '#C62828',
  redBg:     '#FFEBEE',
  muted:     '#888888',
  dark:      '#1A1A1A',
}

function Shimmer({ w = '100%', h = 12, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,#F0F0F0 25%,#E8F5E9 50%,#F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()

  const [user,       setUser]       = useState(null)
  const [profile,    setProfile]    = useState(null)
  const [stats,      setStats]      = useState(null)
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    if (!document.getElementById('profile-styles')) {
      const s = document.createElement('style')
      s.id = 'profile-styles'
      s.textContent = `
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `
      document.head.appendChild(s)
    }
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    setIsLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { navigate('/login', { replace: true }); return }
      setUser(authUser)

      const [profRes, tradesRes, holdingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('trades').select('trade_type,profit_loss').eq('user_id', authUser.id),
        supabase.from('holdings').select('symbol').eq('user_id', authUser.id),
      ])

      const prof = profRes.data
      setProfile(prof)

      const trades   = tradesRes.data   ?? []
      const holdings = holdingsRes.data ?? []

      const sellTrades   = trades.filter(t => t.trade_type === 'SELL')
      const profitTrades = sellTrades.filter(t => (t.profit_loss ?? 0) > 0)
      const totalPnL     = sellTrades.reduce((s, t) => s + (t.profit_loss ?? 0), 0)
      const winRate      = sellTrades.length > 0
        ? Math.round((profitTrades.length / sellTrades.length) * 100)
        : 0

      // Leaderboard entry — table may not exist, handled gracefully
      let weeklyRank   = '--'
      let weeklyReturn = 0
      try {
        const { data: lb } = await supabase
          .from('leaderboard')
          .select('rank_position,weekly_return_pct')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (lb) { weeklyRank = lb.rank_position ?? '--'; weeklyReturn = lb.weekly_return_pct ?? 0 }
      } catch { /* leaderboard table may not exist yet */ }

      setStats({
        totalTrades:    trades.length,
        winRate,
        totalPnL:       Math.round(totalPnL),
        holdingsCount:  holdings.length,
        totalXP:        prof?.total_xp      ?? 0,
        streak:         prof?.streak_days   ?? 0,
        weeklyRank,
        weeklyReturn,
      })
    } catch (err) {
      console.error('Profile fetch error:', err)
      toast.error('Could not load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out! See you soon 👋')
    navigate('/login', { replace: true })
  }

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    ?? 'TR'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', maxWidth: 430, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 30 }}>

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #EBF5EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ color: C.dark, fontSize: 16, fontWeight: 800 }}>My Profile</span>
        <button onClick={handleLogout} style={{ background: C.redBg, border: '1px solid #FFCDD2', borderRadius: 20, padding: '6px 12px', color: C.redDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Logout
        </button>
      </div>

      {/* ── PROFILE CARD ──────────────────────────────────────────────────────── */}
      <div style={{ margin: '12px 14px', background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, borderTop: '3px solid #4CAF50', padding: 20, textAlign: 'center', boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Shimmer w={72} h={72} radius={36} />
            <Shimmer w={140} h={18} />
            <Shimmer w={180} h={12} />
            <Shimmer w={120} h={32} radius={20} />
          </div>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.green, border: '3px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', fontSize: 24, fontWeight: 800 }}>
              {initials}
            </div>
            <p style={{ color: C.dark, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              {profile?.full_name || 'Trader'}
            </p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenBg, border: '1px solid #C8E6C9', borderRadius: 20, padding: '6px 14px' }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ color: C.greenDark, fontSize: 13, fontWeight: 800 }}>
                ₹{(profile?.virtual_balance ?? 100000).toLocaleString('en-IN')}
              </span>
              <span style={{ color: C.muted, fontSize: 11 }}>available</span>
            </div>
          </>
        )}
      </div>

      {/* ── STATS GRID ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '0 14px 12px' }}>
        {isLoading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: 14 }}>
              <Shimmer w={36} h={36} radius={10} />
              <div style={{ marginTop: 8 }}><Shimmer w={60} h={18} /></div>
              <div style={{ marginTop: 4 }}><Shimmer w={80} h={10} /></div>
            </div>
          ))
        ) : [
          { label: 'Total Trades', value: stats?.totalTrades ?? 0,                                              icon: '📊', iconBg: '#E3F2FD' },
          { label: 'Win Rate',     value: `${stats?.winRate ?? 0}%`,                                            icon: '🎯', iconBg: '#E8F5E9' },
          { label: 'Total P&L',    value: `${(stats?.totalPnL ?? 0) >= 0 ? '+' : ''}₹${Math.abs(stats?.totalPnL ?? 0).toLocaleString('en-IN')}`, icon: '💹', iconBg: (stats?.totalPnL ?? 0) >= 0 ? '#E8F5E9' : '#FFEBEE' },
          { label: 'Holdings',     value: stats?.holdingsCount ?? 0,                                            icon: '📈', iconBg: '#FFF8E1' },
          { label: 'XP Earned',    value: (stats?.totalXP ?? 0).toLocaleString('en-IN'),                        icon: '⚡', iconBg: '#FFF8E1' },
          { label: 'Day Streak',   value: `${stats?.streak ?? 0} 🔥`,                                          icon: '🔥', iconBg: '#FFF3E0' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>
              {s.icon}
            </div>
            <p style={{ color: C.dark, fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{s.value}</p>
            <p style={{ color: C.muted, fontSize: 10 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── SIMULATOR LEAGUE CARD ─────────────────────────────────────────────── */}
      <div onClick={() => navigate('/simulator')} style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 8px rgba(76,175,80,0.05)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
          🏆
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.dark, fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Simulator League</p>
          <p style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Weekly trading competition</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ background: C.greenBg, color: C.greenDark, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #C8E6C9' }}>
              Your Rank: #{stats?.weeklyRank ?? '--'}
            </span>
            <span style={{ background: '#FFF8E1', color: '#E65100', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #FFE082' }}>
              {(stats?.weeklyReturn ?? 0) >= 0 ? '+' : ''}{(stats?.weeklyReturn ?? 0).toFixed(2)}% this week
            </span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* ── MENU LIST ─────────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        {[
          { icon: '📚', label: 'My Learning Progress', path: '/learn'      },
          { icon: '💼', label: 'My Portfolio',          path: '/portfolio'  },
          { icon: '📊', label: 'Trade History',         path: '/portfolio'  },
          { icon: '🤖', label: 'AI Mentor',             path: '/ai-mentor'  },
          { icon: '🏆', label: 'Simulator League',      path: '/simulator'  },
          { icon: '⚙️', label: 'Settings',              path: null          },
        ].map((item, idx, arr) => (
          <div key={item.label}
            onClick={() => item.path && navigate(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: idx < arr.length - 1 ? '1px solid #F5F5F5' : 'none', cursor: item.path ? 'pointer' : 'default', background: '#fff', transition: 'background 0.15s' }}
            onMouseEnter={e => item.path && (e.currentTarget.style.background = '#F8FFF8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FFF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {item.icon}
            </div>
            <span style={{ flex: 1, color: C.dark, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.path ? '#AAAAAA' : '#DDDDDD'} strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        ))}
      </div>

      {/* ── APP INFO ──────────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', padding: 16, textAlign: 'center' }}>
        <p style={{ color: C.greenDark, fontSize: 16, fontWeight: 900, marginBottom: 2 }}>TradeBoost.AI</p>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Learn. Practice. Become a Pro.</p>
        <p style={{ color: '#BBBBBB', fontSize: 10 }}>Version 1.0.0 · Made with ❤️ for Indian traders</p>
      </div>

      {/* ── LOGOUT BUTTON ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 14px' }}>
        <button onClick={handleLogout} style={{ width: '100%', background: C.redBg, border: '1px solid #FFCDD2', borderRadius: 14, padding: 14, color: C.redDark, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout from TradeBoost.AI
        </button>
      </div>

    </div>
  )
}
