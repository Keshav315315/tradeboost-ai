import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

function Shimmer({ w = '100%', h = 12, radius = 6 }) {
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

export default function ProfilePage() {
  const navigate = useNavigate()
  const { theme, t, toggleTheme } = useTheme()

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
    <div style={{ background: t.bgPrimary, minHeight: '100dvh', maxWidth: 430, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 30 }}>

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px', background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ color: t.textPrimary, fontSize: 16, fontWeight: 800 }}>My Profile</span>
        <button onClick={handleLogout} style={{ background: t.dangerBg, border: `1px solid ${t.dangerBorder}`, borderRadius: 20, padding: '6px 12px', color: t.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Logout
        </button>
      </div>

      {/* ── PROFILE CARD ──────────────────────────────────────────────────────── */}
      <div style={{ margin: '12px 14px', background: t.bgCard, borderRadius: 20, border: `1px solid ${t.border}`, borderTop: `3px solid ${t.primary}`, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Shimmer w={72} h={72} radius={36} />
            <Shimmer w={140} h={18} />
            <Shimmer w={180} h={12} />
            <Shimmer w={120} h={32} radius={20} />
          </div>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: t.primary, border: `3px solid ${t.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', fontSize: 24, fontWeight: 800 }}>
              {initials}
            </div>
            <p style={{ color: t.textPrimary, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              {profile?.full_name || 'Trader'}
            </p>
            <p style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.primaryLight, border: `1px solid ${t.primaryBorder}`, borderRadius: 20, padding: '6px 14px' }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ color: t.primaryDark, fontSize: 13, fontWeight: 800 }}>
                ₹{(profile?.virtual_balance ?? 100000).toLocaleString('en-IN')}
              </span>
              <span style={{ color: t.textMuted, fontSize: 11 }}>available</span>
            </div>
          </>
        )}
      </div>

      {/* ── STATS GRID ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '0 14px 12px' }}>
        {isLoading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: t.bgCard, borderRadius: 14, border: `1px solid ${t.borderSubtle}`, padding: 14 }}>
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
          <div key={s.label} style={{ background: t.bgCard, borderRadius: 14, border: `1px solid ${t.borderSubtle}`, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>
              {s.icon}
            </div>
            <p style={{ color: t.textPrimary, fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{s.value}</p>
            <p style={{ color: t.textMuted, fontSize: 10 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── THEME TOGGLE ──────────────────────────────────────────────────────── */}
      <div style={{
        margin: '0 14px 12px',
        background: t.bgCard,
        borderRadius: '16px',
        border: `1px solid ${t.border}`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '12px',
            background: theme === 'dark' ? '#1A2540' : '#F8FFF8',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px'
          }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </div>
          <div>
            <div style={{ color: t.textPrimary, fontSize: '14px', fontWeight: '700' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </div>
            <div style={{ color: t.textMuted, fontSize: '11px' }}>
              {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          onClick={toggleTheme}
          style={{
            width: '52px', height: '28px',
            borderRadius: '14px',
            background: theme === 'dark' ? '#4CAF50' : '#E0E0E0',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
            flexShrink: 0
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: theme === 'dark' ? '27px' : '3px',
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left 0.3s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
          }}/>
        </div>
      </div>

      {/* ── SIMULATOR LEAGUE CARD ─────────────────────────────────────────────── */}
      <div onClick={() => navigate('/simulator')} style={{ margin: '0 14px 12px', background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}`, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 8px rgba(76,175,80,0.05)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: t.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
          🏆
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: t.textPrimary, fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Simulator League</p>
          <p style={{ color: t.textMuted, fontSize: 11, marginBottom: 6 }}>Weekly trading competition</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ background: t.primaryLight, color: t.primaryDark, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: `1px solid ${t.primaryBorder}` }}>
              Your Rank: #{stats?.weeklyRank ?? '--'}
            </span>
            <span style={{ background: t.warningBg, color: t.warning, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: `1px solid ${t.warningBorder}` }}>
              {(stats?.weeklyReturn ?? 0) >= 0 ? '+' : ''}{(stats?.weeklyReturn ?? 0).toFixed(2)}% this week
            </span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* ── MENU LIST ─────────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 14px 12px', background: t.bgCard, borderRadius: 16, border: `1px solid ${t.borderSubtle}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${t.borderSubtle}` : 'none', cursor: item.path ? 'pointer' : 'default', background: t.bgCard, transition: 'background 0.15s' }}
            onMouseEnter={e => item.path && (e.currentTarget.style.background = t.bgHover)}
            onMouseLeave={e => (e.currentTarget.style.background = t.bgCard)}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.bgHover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {item.icon}
            </div>
            <span style={{ flex: 1, color: t.textPrimary, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.path ? t.textMuted : t.borderSubtle} strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        ))}
      </div>

      {/* ── APP INFO ──────────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 14px 12px', background: t.bgCard, borderRadius: 16, border: `1px solid ${t.borderSubtle}`, padding: 16, textAlign: 'center' }}>
        <p style={{ color: t.primaryDark, fontSize: 16, fontWeight: 900, marginBottom: 2 }}>TradeBoost.AI</p>
        <p style={{ color: t.textMuted, fontSize: 11, marginBottom: 6 }}>Learn. Practice. Become a Pro.</p>
        <p style={{ color: t.textHint, fontSize: 10 }}>Version 1.0.0 · Made with ❤️ for Indian traders</p>
      </div>

      {/* ── LOGOUT BUTTON ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 14px' }}>
        <button onClick={handleLogout} style={{ width: '100%', background: t.dangerBg, border: `1px solid ${t.dangerBorder}`, borderRadius: 14, padding: 14, color: t.danger, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.danger} strokeWidth="2.5">
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
