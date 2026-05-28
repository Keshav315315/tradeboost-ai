import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, TrendingUp, MessageCircle, User, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

// ── Design tokens (resolved at runtime from theme) ────────────────────────────
const mkC = (t) => ({
  bg:        t.bgPrimary,
  card:      t.bgCard,
  border:    t.border,
  green:     t.primary,
  greenDark: t.primaryDark,
  greenBg:   t.primaryLight,
  red:       t.danger,
  redDark:   t.danger,
  muted:     t.textMuted,
  dark:      t.textPrimary,
  gold:      t.warning,
  goldBg:    t.warningBg,
  goldBorder: t.warningBorder,
})

const AVATAR_COLORS = [
  { bg: '#FFF8E1', color: '#E65100' },
  { bg: '#E3F2FD', color: '#1565C0' },
  { bg: '#E8F5E9', color: '#2E7D32' },
  { bg: '#FCE4EC', color: '#880E4F' },
  { bg: '#F3E5F5', color: '#7B1FA2' },
  { bg: '#E0F2F1', color: '#004D40' },
  { bg: '#FFF3E0', color: '#BF360C' },
  { bg: '#E8EAF6', color: '#283593' },
]

const RANK_META = {
  1: { emoji: '🥇', borderColor: '#FFD700', badge: '+₹20,000', badgeBg: '#FFF8E1', badgeColor: '#E65100', badgeBorder: '#FFE082' },
  2: { emoji: '🥈', borderColor: '#C0C0C0', badge: '+₹10,000', badgeBg: '#F5F5F5', badgeColor: '#5F5E5A', badgeBorder: '#E0E0E0' },
  3: { emoji: '🥉', borderColor: '#CD7F32', badge: '+₹5,000',  badgeBg: '#FFF3E0', badgeColor: '#E65100', badgeBorder: '#FFCC80' },
}

const HOW_REWARDS = [
  { icon: '📊', text: 'Ranked by weekly return % from ₹1,00,000 start',   value: 'Fair'    },
  { icon: '🔄', text: 'Your rank updates every time you trade',            value: 'Live'    },
  { icon: '🥇', text: '1st place earns +₹20,000 virtual cash',            value: '+₹20K'  },
  { icon: '🥈', text: '2nd place earns +₹10,000 virtual cash',            value: '+₹10K'  },
  { icon: '🥉', text: '3rd place earns +₹5,000 virtual cash',             value: '+₹5K'   },
  { icon: '⏰', text: 'Leaderboard resets every Monday midnight',          value: 'Weekly' },
]

const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const getWeekBounds = () => {
  const now    = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekNum = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))
  const fmt = (d, opts) => d.toLocaleDateString('en-IN', opts)
  return {
    weekNum,
    monday,
    sunday,
    startLabel: fmt(monday, { day: 'numeric', month: 'short' }),
    endLabel:   fmt(sunday, { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

// ── Shimmer ────────────────────────────────────────────────────────────────────
function Shimmer({ w = '100%', h = 12, radius = 6 }) {
  const { t } = useTheme()
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: `linear-gradient(90deg,${t.borderSubtle} 25%,${t.border} 50%,${t.borderSubtle} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────────
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

function TrophyIcon({ size = 22, color = '#AAAAAA' }) {
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

// ─────────────────────────────────────────────────────────────────────────────
export default function SimulatorPage() {
  const navigate      = useNavigate()
  const { t }         = useTheme()
  const C             = mkC(t)
  const currentUserRef = useRef(null)

  const [leaderboard,  setLeaderboard]  = useState([])
  const [myEntry,      setMyEntry]      = useState(null)
  const [timeLeft,     setTimeLeft]     = useState('')
  const [isLoading,    setIsLoading]    = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [weekInfo,     setWeekInfo]     = useState({})
  const [lastUpdated,  setLastUpdated]  = useState(null)

  // ── Intraday league state ─────────────────────────────────────────────────────
  const [activeLeague,        setActiveLeague]        = useState('weekly')
  const [intradayLeaderboard, setIntradayLeaderboard] = useState([])
  const [intradayRank,        setIntradayRank]        = useState(null)
  const [intradayReturn,      setIntradayReturn]      = useState(0)
  const [intradayTrades,      setIntradayTrades]      = useState(0)
  const [intradayPnL,         setIntradayPnL]         = useState(0)
  const [currentUserId,       setCurrentUserId]       = useState(null)

  useEffect(() => {
    if (!document.getElementById('sim-styles')) {
      const s = document.createElement('style')
      s.id = 'sim-styles'
      s.textContent = `
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
      `
      document.head.appendChild(s)
    }
    initPage()
    calculateTimeLeft()
    const clockTimer   = setInterval(calculateTimeLeft, 60000)
    const refreshTimer = setInterval(() => refreshLeaderboard(false), 30000)
    return () => {
      clearInterval(clockTimer)
      clearInterval(refreshTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateTimeLeft = () => {
    const now    = new Date()
    const next   = new Date(now)
    const days   = (8 - now.getDay()) % 7 || 7
    next.setDate(now.getDate() + days)
    next.setHours(0, 0, 0, 0)
    const diff   = next - now
    const d      = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h      = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m      = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeLeft(`${d}d ${h}h ${m}m`)
  }

  const initPage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login', { replace: true }); return }
      currentUserRef.current = user
      await upsertMyEntry(user)
      await fetchLeaderboard(user)
    } catch (err) {
      console.error('Init error:', err)
      toast.error('Could not load leaderboard')
      setIsLoading(false)
    }
  }

  const upsertMyEntry = async (user) => {
    try {
      const wb = getWeekBounds()

      const [profRes, holdRes, tradesRes] = await Promise.all([
        supabase.from('profiles').select('virtual_balance, full_name, email').eq('id', user.id).single(),
        supabase.from('holdings').select('avg_price, quantity').eq('user_id', user.id),
        supabase.from('trades').select('*').eq('user_id', user.id)
          .gte('created_at', wb.monday.toISOString()),
      ])

      const profile    = profRes.data
      const holdings   = holdRes.data  ?? []
      const weekTrades = tradesRes.data ?? []

      const holdingsValue = holdings.reduce((s, h) => s + h.avg_price * h.quantity, 0)
      const totalValue    = (profile?.virtual_balance ?? 100000) + holdingsValue
      const weeklyReturn  = Math.round(((totalValue - 100000) / 100000) * 10000) / 100
      const weeklyPnl     = Math.round(totalValue - 100000)

      const bestTrade = weekTrades
        .filter(t => t.trade_type === 'SELL')
        .reduce((best, t) => (!best || (t.profit_loss ?? 0) > (best.profit_loss ?? 0) ? t : best), null)

      await supabase.from('leaderboard').upsert({
        user_id:               user.id,
        full_name:             profile?.full_name || user.email?.split('@')[0] || 'Trader',
        email:                 profile?.email || user.email,
        week_number:           wb.weekNum,
        week_start:            wb.monday.toISOString().split('T')[0],
        week_end:              wb.sunday.toISOString().split('T')[0],
        total_portfolio_value: Math.round(totalValue),
        starting_value:        100000,
        weekly_return_pct:     weeklyReturn,
        weekly_pnl:            weeklyPnl,
        trade_count:           weekTrades.length,
        best_trade_symbol:     bestTrade?.symbol?.replace(/\.(NS|BO)$/i, '') ?? null,
        best_trade_pct:        bestTrade?.profit_loss
          ? Math.round((bestTrade.profit_loss / (bestTrade.price * bestTrade.quantity)) * 10000) / 100
          : 0,
        last_updated:          new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false })
    } catch (err) {
      console.error('Upsert entry error:', err)
    }
  }

  const fetchLeaderboard = async (user) => {
    setIsLoading(true)
    try {
      const uid = (user ?? currentUserRef.current)?.id
      const { data: entries, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('weekly_return_pct', { ascending: false })
        .limit(50)

      if (error) throw error

      const ranked = (entries ?? []).map((e, idx) => ({ ...e, rank: idx + 1 }))
      setLeaderboard(ranked)

      const mine = ranked.find(e => e.user_id === uid) ?? null
      setMyEntry(mine)

      if (ranked.length > 0) {
        const first = ranked[0]
        const wb    = getWeekBounds()
        setWeekInfo({
          weekNum:    first.week_number ?? wb.weekNum,
          startLabel: first.week_start
            ? new Date(first.week_start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : wb.startLabel,
          endLabel: first.week_end
            ? new Date(first.week_end + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : wb.endLabel,
        })
      } else {
        const wb = getWeekBounds()
        setWeekInfo({ weekNum: wb.weekNum, startLabel: wb.startLabel, endLabel: wb.endLabel })
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Fetch leaderboard error:', err)
      toast.error('Could not load leaderboard')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshLeaderboard = async (showToast = true) => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await upsertMyEntry(currentUserRef.current)
    await fetchLeaderboard(currentUserRef.current)
    if (showToast) toast.success('Leaderboard refreshed!')
  }

  const getInitials = (name) =>
    (name ?? 'TR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    const diff = Math.floor((new Date() - lastUpdated) / 1000)
    if (diff < 60)  return 'just now'
    if (diff < 120) return '1 min ago'
    return `${Math.floor(diff / 60)}m ago`
  }

  // ── getTimeToMarketClose — IST countdown to 3:30 PM ──────────────────────────
  const getTimeToMarketClose = () => {
    const now = new Date()
    const ist = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + (5.5 * 60 * 60 * 1000))
    const close = new Date(ist)
    close.setHours(15, 30, 0, 0)
    const diff = close - ist
    if (diff <= 0) return 'Market Closed'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`
  }

  // ── fetchIntradayLeaderboard — today's intraday trades grouped by user ────────
  const fetchIntradayLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayTrades } = await supabase
        .from('trades')
        .select('user_id, profit_loss, trade_type, price, quantity, total_amount')
        .eq('trade_mode', 'intraday')
        .gte('created_at', today.toISOString())

      if (!todayTrades || todayTrades.length === 0) {
        setIntradayLeaderboard([])
        setIntradayRank(null)
        setIntradayReturn(0)
        setIntradayTrades(0)
        setIntradayPnL(0)
        return
      }

      // Aggregate per user
      const stats = {}
      for (const tr of todayTrades) {
        if (!stats[tr.user_id]) {
          stats[tr.user_id] = { user_id: tr.user_id, intraday_pnl: 0, intraday_trades: 0 }
        }
        stats[tr.user_id].intraday_pnl    += (tr.profit_loss ?? 0)
        stats[tr.user_id].intraday_trades += 1
      }

      // Enrich with profile names
      const uids = Object.keys(stats)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uids)

      const board = (profiles ?? []).map(p => ({
        ...stats[p.id],
        full_name:       p.full_name ?? 'Trader',
        intraday_return: ((stats[p.id]?.intraday_pnl ?? 0) / 100000) * 100,
      }))
      board.sort((a, b) => b.intraday_return - a.intraday_return)
      setIntradayLeaderboard(board)

      const myIdx   = board.findIndex(r => r.user_id === user.id)
      const myStats = board[myIdx]
      setIntradayRank(myIdx >= 0 ? myIdx + 1 : null)
      setIntradayReturn(myStats?.intraday_return ?? 0)
      setIntradayTrades(myStats?.intraday_trades ?? 0)
      setIntradayPnL(myStats?.intraday_pnl ?? 0)
    } catch (err) {
      console.error('Intraday leaderboard error:', err)
    }
  }

  // Auto-refresh intraday every 30s
  useEffect(() => {
    fetchIntradayLeaderboard()
    const id = setInterval(fetchIntradayLeaderboard, 30000)
    return () => clearInterval(id)
  }, [activeLeague]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bgPrimary, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, paddingBottom: 80 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${t.headerBorder}`, position: 'sticky', top: 0, zIndex: 20, background: t.headerBg, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <button onClick={() => navigate('/home')} style={{ background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 10, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: C.dark, fontSize: 15, fontWeight: 700, pointerEvents: 'none' }}>
            Simulator League
          </p>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => refreshLeaderboard(true)}
              disabled={isRefreshing || isLoading}
              title="Refresh rankings"
              style={{ width: 28, height: 28, borderRadius: '50%', background: t.bgInput, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isRefreshing || isLoading) ? 'not-allowed' : 'pointer', opacity: (isRefreshing || isLoading) ? 0.5 : 1 }}
            >
              <RefreshCw size={13} color={C.muted} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <span style={{ background: C.goldBg, color: C.gold, border: `1px solid ${C.goldBorder}`, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              ⏰ {timeLeft || '—'}
            </span>
          </div>
        </div>

        {/* ── LEAGUE TAB TOGGLE ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', margin: '10px 12px', background: t.bgInput, borderRadius: 12, padding: 3, border: `1px solid ${t.border}` }}>
          <button
            onClick={() => setActiveLeague('weekly')}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: activeLeague === 'weekly' ? '#4CAF50' : 'transparent', color: activeLeague === 'weekly' ? '#fff' : t.textMuted }}
          >
            📅 Weekly League
          </button>
          <button
            onClick={() => setActiveLeague('intraday')}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: activeLeague === 'intraday' ? '#E65100' : 'transparent', color: activeLeague === 'intraday' ? '#fff' : t.textMuted }}
          >
            ⚡ Intraday League
          </button>
        </div>

        {activeLeague === 'weekly' && (<>
        {/* ── TOURNAMENT BANNER ───────────────────────────────────────────────── */}
        <div style={{ margin: '12px 12px 0', background: t.bgCard, border: `1px solid ${t.border}`, borderTop: `3px solid ${t.primary}`, borderRadius: 18, padding: '16px', boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ color: C.dark, fontSize: 17, fontWeight: 800, marginBottom: 3 }}>
                Week {weekInfo.weekNum ?? '—'} Tournament
              </p>
              <p style={{ color: C.green, fontSize: 11, fontWeight: 600 }}>
                {weekInfo.startLabel} – {weekInfo.endLabel}
              </p>
            </div>
            <span style={{ background: C.goldBg, color: C.gold, border: `1px solid ${C.goldBorder}`, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              ⏰ {timeLeft} left
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '🥇', place: '1st Place', prize: '+₹20,000', bg: '#FFF8E1', border: '#FFE082', color: '#E65100' },
              { icon: '🥈', place: '2nd Place', prize: '+₹10,000', bg: '#F5F5F5', border: '#E0E0E0', color: '#5F5E5A' },
              { icon: '🥉', place: '3rd Place', prize: '+₹5,000',  bg: '#FFF3E0', border: '#FFCC80', color: '#BF360C' },
            ].map(p => (
              <div key={p.place} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</p>
                <p style={{ color: C.muted, fontSize: 9, fontWeight: 600, marginBottom: 2 }}>{p.place}</p>
                <p style={{ color: p.color, fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>{p.prize}</p>
                <p style={{ color: C.muted, fontSize: 9 }}>Virtual Cash</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MY STANDING ─────────────────────────────────────────────────────── */}
        <div style={{ margin: '10px 12px 0', background: myEntry && myEntry.rank <= 3 ? t.successBg : t.primaryLight, border: `1px solid ${myEntry && myEntry.rank <= 3 ? t.successBorder : t.border}`, borderRadius: 16, padding: '14px 16px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Shimmer w={160} h={14} /><Shimmer w={80} h={22} radius={11} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Shimmer h={44} radius={10} /><Shimmer h={44} radius={10} /><Shimmer h={44} radius={10} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: C.greenDark, fontSize: 13, fontWeight: 700 }}>Your Standing This Week</p>
                <span style={{ background: t.bgCard, color: C.greenDark, border: `1px solid ${t.primaryBorder}`, borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '3px 10px' }}>
                  {myEntry ? `#${myEntry.rank}` : 'Not ranked'} {myEntry?.rank <= 3 ? '🏆' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Weekly Return', value: myEntry ? `${(myEntry.weekly_return_pct ?? 0) >= 0 ? '+' : ''}${(myEntry.weekly_return_pct ?? 0).toFixed(2)}%` : '0.00%' },
                  { label: 'Portfolio',     value: fmtINR(myEntry?.total_portfolio_value ?? 100000) },
                  { label: 'Trades',        value: `${myEntry?.trade_count ?? 0}` },
                ].map(s => (
                  <div key={s.label} style={{ background: t.bgCard, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${t.primaryBorder}` }}>
                    <p style={{ color: C.muted, fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ color: C.greenDark, fontSize: 12, fontWeight: 800 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {myEntry && myEntry.rank <= 3 && (
                <div style={{ marginTop: 10, background: t.bgCard, borderRadius: 8, padding: '8px 12px', textAlign: 'center', color: C.greenDark, fontSize: 11, fontWeight: 700 }}>
                  🎉 You are in prize position! Keep trading!
                </div>
              )}
              {!myEntry && (
                <div style={{ marginTop: 10, background: t.bgCard, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                  <p style={{ color: C.muted, fontSize: 11 }}>Trade any stock to appear on the leaderboard →</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── LEADERBOARD ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ color: C.dark, fontSize: 14, fontWeight: 800 }}>Leaderboard</p>
              {!isLoading && leaderboard.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                  <span style={{ color: C.muted, fontSize: 9 }}>
                    Live · {leaderboard.length} trader{leaderboard.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <span style={{ color: C.muted, fontSize: 10 }}>
              {lastUpdated ? `Updated ${formatLastUpdated()}` : 'By weekly return %'}
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ background: t.bgCard, borderRadius: 14, padding: '12px 14px', border: `1px solid ${t.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 10, opacity: 1 - i * 0.12 }}>
                  <Shimmer w={24} h={24} radius={12} />
                  <Shimmer w={36} h={36} radius={10} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Shimmer w={100} h={12} /><Shimmer w={140} h={9} />
                  </div>
                  <Shimmer w={50} h={14} />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: t.bgCard, borderRadius: 16, border: `1px dashed ${t.primaryBorder}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <p style={{ color: C.dark, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Be the first trader!</p>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Buy or sell any stock to join the leaderboard</p>
              <button
                onClick={() => navigate('/trade')}
                style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start Trading →
              </button>
            </div>
          ) : (
            leaderboard.map((entry, idx) => {
              const isMe     = entry.user_id === currentUserRef.current?.id
              const meta     = RANK_META[entry.rank]
              const av       = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const retPct   = entry.weekly_return_pct ?? 0
              const initials = getInitials(entry.full_name)
              const displayName = isMe
                ? `You (${entry.full_name?.split(' ')[0] ?? 'Trader'})`
                : entry.full_name?.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ')

              return (
                <div key={entry.id ?? entry.user_id ?? idx}
                  style={{
                    background: isMe ? t.bgHover : t.bgCard,
                    borderRadius: 14,
                    border: isMe ? `1.5px solid ${t.primary}` : meta ? `1px solid ${meta.borderColor}` : t.borderSubtle,
                    borderTop: meta ? `3px solid ${meta.borderColor}` : isMe ? `1.5px solid ${t.primary}` : t.borderSubtle,
                    padding: '12px 14px', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'fadeIn 0.3s ease both',
                    animationDelay: `${Math.min(idx * 0.04, 0.3)}s`,
                  }}
                >
                  {/* Rank */}
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {meta ? (
                      <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                    ) : (
                      <span style={{ color: C.muted, fontSize: 13, fontWeight: 700 }}>{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: isMe ? t.primaryLight : av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMe ? C.greenDark : av.color, fontSize: 12, fontWeight: 800, flexShrink: 0, border: isMe ? `2px solid ${t.primary}` : 'none' }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: isMe ? C.greenDark : C.dark, fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </p>
                    <p style={{ color: C.muted, fontSize: 10 }}>
                      {entry.trade_count ?? 0} trades
                      {entry.best_trade_symbol ? ` · Best: ${entry.best_trade_symbol}` : ''}
                      {entry.best_trade_pct > 0 ? ` +${entry.best_trade_pct?.toFixed(1)}%` : ''}
                    </p>
                  </div>

                  {/* Return + prize badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: retPct >= 0 ? C.greenDark : C.redDark, fontSize: 14, fontWeight: 800, marginBottom: meta ? 4 : 0 }}>
                      {retPct >= 0 ? '+' : ''}{retPct.toFixed(2)}%
                    </p>
                    <p style={{ color: C.muted, fontSize: 9, marginBottom: meta ? 3 : 0 }}>
                      {fmtINR(entry.total_portfolio_value ?? 100000)}
                    </p>
                    {meta && (
                      <span style={{ background: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeBorder}`, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {meta.badge}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── HOW RANKINGS WORK ───────────────────────────────────────────────── */}
        <div style={{ margin: '12px 12px 0', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <p style={{ color: C.dark, fontSize: 13, fontWeight: 800, marginBottom: 12 }}>How Rankings Work</p>
          {HOW_REWARDS.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < HOW_REWARDS.length - 1 ? 10 : 0, marginBottom: i < HOW_REWARDS.length - 1 ? 10 : 0, borderBottom: i < HOW_REWARDS.length - 1 ? t.borderSubtle : 'none' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{row.icon}</span>
              <span style={{ flex: 1, color: C.muted, fontSize: 11 }}>{row.text}</span>
              <span style={{ color: C.dark, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ── START TRADING CTA ───────────────────────────────────────────────── */}
        <div style={{ padding: '12px 12px 0' }}>
          <button
            onClick={() => navigate('/trade')}
            style={{ width: '100%', background: 'linear-gradient(135deg,#4CAF50,#2E7D32)', border: 'none', borderRadius: 14, padding: '14px', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 16px rgba(76,175,80,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
            Start Trading to Climb the Ranks
          </button>
        </div>
        </>)}

        {/* ── INTRADAY LEAGUE SECTION ──────────────────────────────────────────── */}
        {activeLeague === 'intraday' && (<>

          {/* Header card */}
          <div style={{ margin: '0 12px', background: 'linear-gradient(135deg,#E65100,#BF360C)', borderRadius: 18, padding: '16px', boxShadow: '0 4px 20px rgba(230,81,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, marginBottom: 3 }}>Today's Intraday League</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>Rankings reset daily at 3:30 PM IST</p>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                ⏰ {getTimeToMarketClose()}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: '🥇', place: '1st Place', prize: '+500 XP', bg: 'rgba(255,215,0,0.25)', border: 'rgba(255,215,0,0.4)', color: '#FFD700' },
                { icon: '🥈', place: '2nd Place', prize: '+300 XP', bg: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.3)', color: '#fff' },
                { icon: '🥉', place: '3rd Place', prize: '+200 XP', bg: 'rgba(255,152,0,0.2)', border: 'rgba(255,152,0,0.4)', color: '#FFB74D' },
              ].map(p => (
                <div key={p.place} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 600, marginBottom: 2 }}>{p.place}</p>
                  <p style={{ color: p.color, fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>{p.prize}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your intraday stats */}
          <div style={{ margin: '10px 12px 0', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>Your Intraday Today</p>
              <span style={{ background: intradayRank ? '#FFF3E0' : t.bgInput, color: intradayRank ? '#E65100' : C.muted, border: `1px solid ${intradayRank ? '#FFCC80' : t.border}`, borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '3px 10px' }}>
                {intradayRank ? `#${intradayRank}` : 'Not ranked'}{intradayRank && intradayRank <= 3 ? ' 🏆' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Intraday Return', value: `${intradayReturn >= 0 ? '+' : ''}${intradayReturn.toFixed(2)}%`, color: intradayReturn >= 0 ? C.greenDark : C.red },
                { label: 'Trades Today',   value: `${intradayTrades}`,                                             color: C.dark },
                { label: 'Net P&L',        value: `${intradayPnL >= 0 ? '+' : ''}${fmtINR(intradayPnL)}`,        color: intradayPnL >= 0 ? C.greenDark : C.red },
              ].map(s => (
                <div key={s.label} style={{ background: t.bgInput, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${t.border}` }}>
                  <p style={{ color: C.muted, fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 12, fontWeight: 800 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Intraday leaderboard */}
          <div style={{ padding: '10px 12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ color: C.dark, fontSize: 14, fontWeight: 800 }}>Today's Rankings</p>
                {intradayLeaderboard.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E65100', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                    <span style={{ color: C.muted, fontSize: 9 }}>
                      Live · {intradayLeaderboard.length} trader{intradayLeaderboard.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <span style={{ color: C.muted, fontSize: 10 }}>By intraday return %</span>
            </div>

            {intradayLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: t.bgCard, borderRadius: 16, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <p style={{ color: C.dark, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No intraday trades yet!</p>
                <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Buy and sell stocks today to appear on the intraday leaderboard</p>
                <button
                  onClick={() => navigate('/trade')}
                  style={{ background: '#E65100', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Start Intraday Trading →
                </button>
              </div>
            ) : (
              intradayLeaderboard.map((entry, idx) => {
                const rank      = idx + 1
                const isMe      = entry.user_id === currentUserId
                const av        = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                const retPct    = entry.intraday_return ?? 0
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
                const xpBadge   = rank === 1 ? '+500 XP' : rank === 2 ? '+300 XP' : rank === 3 ? '+200 XP' : null
                const xpColor   = rank === 1 ? '#E65100' : rank === 2 ? '#5F5E5A' : '#BF360C'
                const xpBg      = rank === 1 ? '#FFF8E1' : rank === 2 ? '#F5F5F5' : '#FFF3E0'
                const xpBorder  = rank === 1 ? '#FFE082' : rank === 2 ? '#E0E0E0' : '#FFCC80'
                const topBorder = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : null
                const initials  = getInitials(entry.full_name)
                const displayName = isMe
                  ? `You (${entry.full_name?.split(' ')[0] ?? 'Trader'})`
                  : entry.full_name?.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ')

                return (
                  <div key={entry.user_id ?? idx}
                    style={{
                      background: isMe ? '#FFF3E0' : t.bgCard,
                      borderRadius: 14,
                      border: isMe ? `1.5px solid #E65100` : topBorder ? `1px solid ${topBorder}` : `1px solid ${t.borderSubtle}`,
                      borderTop: topBorder ? `3px solid ${topBorder}` : isMe ? `1.5px solid #E65100` : `1px solid ${t.borderSubtle}`,
                      padding: '12px 14px', marginBottom: 6,
                      display: 'flex', alignItems: 'center', gap: 10,
                      animation: 'fadeIn 0.3s ease both',
                      animationDelay: `${Math.min(idx * 0.04, 0.3)}s`,
                    }}
                  >
                    <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {rankEmoji
                        ? <span style={{ fontSize: 20 }}>{rankEmoji}</span>
                        : <span style={{ color: C.muted, fontSize: 13, fontWeight: 700 }}>{rank}</span>
                      }
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: isMe ? '#FFE0B2' : av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMe ? '#E65100' : av.color, fontSize: 12, fontWeight: 800, flexShrink: 0, border: isMe ? `2px solid #E65100` : 'none' }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: isMe ? '#E65100' : C.dark, fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </p>
                      <p style={{ color: C.muted, fontSize: 10 }}>
                        {entry.intraday_trades} trade{entry.intraday_trades !== 1 ? 's' : ''} · {fmtINR(entry.intraday_pnl ?? 0)} P&L
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: retPct >= 0 ? C.greenDark : C.redDark, fontSize: 14, fontWeight: 800, marginBottom: xpBadge ? 4 : 0 }}>
                        {retPct >= 0 ? '+' : ''}{retPct.toFixed(2)}%
                      </p>
                      {xpBadge && (
                        <span style={{ background: xpBg, color: xpColor, border: `1px solid ${xpBorder}`, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {xpBadge}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Intraday CTA */}
          <div style={{ padding: '12px 12px 0' }}>
            <button
              onClick={() => navigate('/trade')}
              style={{ width: '100%', background: 'linear-gradient(135deg,#E65100,#BF360C)', border: 'none', borderRadius: 14, padding: '14px', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 16px rgba(230,81,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              ⚡ Trade Intraday to Climb the Ranks
            </button>
          </div>

        </>)}

      </div>

      {/* ── BOTTOM NAV ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: t.navBg, borderTop: `1px solid ${t.navBorder}`, padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      onClick={() => navigate('/home')}       />
        <NavItem icon={TrendingUp}    label="Trade"     onClick={() => navigate('/trade')}      />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyIcon size={22} color={t.primary} />
          <span style={{ color: t.primary, fontSize: 9, fontWeight: 700 }}>League</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.primary, marginTop: -1 }} />
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor" onClick={() => navigate('/ai-mentor')}  />
        <NavItem icon={User}          label="Profile"   onClick={() => navigate('/profile')}    />
      </div>
    </div>
  )
}
