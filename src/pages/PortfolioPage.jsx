import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, MoreHorizontal, RefreshCw,
  Home, TrendingUp, MessageCircle, User,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

// ── Design tokens ──────────────────────────────────────────────────────────────
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
  medium:    '#555555',
  dark:      '#1A1A1A',
}

const INITIAL_CAPITAL = 100000
const CHART_COLORS    = ['#4CAF50', '#2196F3', '#FF5722', '#FF9800', '#9C27B0', '#00BCD4']
const LOGO_BG         = ['#E3F2FD', '#E8F5E9', '#FFEBEE', '#FFF8E1', '#F3E5F5', '#E0F2F1']
const LOGO_FG         = ['#1565C0', '#2E7D32', '#C62828', '#E65100', '#6A1B9A', '#00695C']

// ── Helpers ───────────────────────────────────────────────────────────────────
const cleanSymbol = (sym) =>
  (sym ?? '').replace('.NS', '').replace('.BO', '').replace('.BSE', '')

const fmtINR = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

const fmtAbbr = (n) => {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + 'L'
  if (abs >= 1000)   return sign + '₹' + (abs / 1000).toFixed(1) + 'K'
  return sign + '₹' + Math.round(abs)
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now - date) / 86400000)
  if (diff === 0)
    return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  return diff + ' days ago'
}

const generateHistory = (period, currentValue) => {
  const counts = { '1W': 7, '1M': 30, '3M': 90, 'All': 180 }
  const count  = counts[period] ?? 7
  const data   = []
  let val      = currentValue * 0.88
  for (let i = 0; i < count; i++) {
    val = val + (Math.random() - 0.35) * (currentValue * 0.01)
    val = Math.max(val, currentValue * 0.82)
    data.push({ value: Math.round(val) })
  }
  data.push({ value: Math.round(currentValue) })
  return data
}

// ── Shimmer ────────────────────────────────────────────────────────────────────
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

// ── NavItem ────────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick }) {
  const color = active ? C.green : '#AAAAAA'
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
      <Icon size={22} color={color} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ color, fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
      {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, marginTop: -1 }} />}
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
export default function PortfolioPage() {
  const navigate   = useNavigate()
  const periodRef  = useRef('1W')

  const [balance,             setBalance]             = useState(0)
  const [holdings,            setHoldings]            = useState([])
  const [trades,              setTrades]              = useState([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [totalInvested,       setTotalInvested]       = useState(0)
  const [totalGain,           setTotalGain]           = useState(0)
  const [totalGainPct,        setTotalGainPct]        = useState(0)
  const [todaysPnL,           setTodaysPnL]           = useState(0)
  const [activePeriod,        setActivePeriod]        = useState('1W')
  const [chartData,           setChartData]           = useState([])
  const [isLoading,           setIsLoading]           = useState(true)
  const [refreshing,          setRefreshing]          = useState(false)
  const [aiReview,            setAiReview]            = useState(null)
  const [isLoadingReview,     setIsLoadingReview]     = useState(false)
  const [showReview,          setShowReview]          = useState(false)

  useEffect(() => {
    if (document.getElementById('shimmer-style')) return
    const s = document.createElement('style')
    s.id = 'shimmer-style'
    s.textContent = `
      @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes spin    { to{transform:rotate(360deg)} }
    `
    document.head.appendChild(s)
  }, [])

  // ── Core fetch — self-contained, gets user internally ─────────────────────────
  const fetchPortfolioData = async (period) => {
    const p = period ?? periodRef.current
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Real cash balance from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('virtual_balance')
        .eq('id', user.id)
        .single()

      const currentCash = profile?.virtual_balance ?? 0
      setBalance(currentCash)

      // 2. Holdings
      const { data: holdingsData } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)

      // 3. Recent trades (display list + today's P&L)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [tradeRes, todayRes] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('trades').select('profit_loss').eq('user_id', user.id)
          .eq('trade_type', 'SELL').gte('created_at', todayStart.toISOString()),
      ])
      setTrades(tradeRes.data ?? [])

      const todayPnL = (todayRes.data ?? []).reduce((s, t) => s + (t.profit_loss ?? 0), 0)
      setTodaysPnL(Math.round(todayPnL))

      if (!holdingsData || holdingsData.length === 0) {
        setHoldings([])
        const gain    = currentCash - INITIAL_CAPITAL
        const gainPct = (gain / INITIAL_CAPITAL) * 100
        setTotalPortfolioValue(currentCash)
        setTotalInvested(0)
        setTotalGain(Math.round(gain))
        setTotalGainPct(Math.round(gainPct * 100) / 100)
        setChartData(generateHistory(p, currentCash))
        return
      }

      // 4. Live price per holding via stock-data edge function
      const enriched = await Promise.all(
        holdingsData.map(async (h) => {
          try {
            const ds = cleanSymbol(h.symbol)
            const { data: priceData } = await supabase.functions.invoke('stock-data', {
              body: { symbol: ds, type: 'quote' },
            })
            const livePrice     = priceData?.quote?.c > 0 ? priceData.quote.c : h.avg_price
            const currentValue  = livePrice * h.quantity
            const investedValue = h.avg_price * h.quantity
            const pnl           = currentValue - investedValue
            const pnlPct        = investedValue > 0 ? (pnl / investedValue) * 100 : 0
            return {
              ...h,
              displaySymbol: ds,
              livePrice,
              currentValue:  Math.round(currentValue),
              investedValue: Math.round(investedValue),
              pnl:           Math.round(pnl),
              pnlPercent:    Math.round(pnlPct * 100) / 100,
              dayChange:     priceData?.quote?.d  ?? 0,
              dayChangePct:  priceData?.quote?.dp ?? 0,
            }
          } catch {
            const ds            = cleanSymbol(h.symbol)
            const investedValue = Math.round(h.avg_price * h.quantity)
            return {
              ...h,
              displaySymbol: ds,
              livePrice:     h.avg_price,
              currentValue:  investedValue,
              investedValue,
              pnl:           0,
              pnlPercent:    0,
              dayChange:     0,
              dayChangePct:  0,
            }
          }
        })
      )

      setHoldings(enriched)

      // 5. Portfolio totals
      const stocksValue   = enriched.reduce((s, h) => s + h.currentValue, 0)
      const stocksCost    = enriched.reduce((s, h) => s + h.investedValue, 0)
      const portfolioTotal = currentCash + stocksValue
      const gain           = portfolioTotal - INITIAL_CAPITAL
      const gainPct        = (gain / INITIAL_CAPITAL) * 100

      setTotalInvested(Math.round(stocksCost))
      setTotalPortfolioValue(Math.round(portfolioTotal))
      setTotalGain(Math.round(gain))
      setTotalGainPct(Math.round(gainPct * 100) / 100)
      setChartData(generateHistory(p, portfolioTotal))

    } catch (err) {
      console.error('Portfolio fetch error:', err)
      toast.error('Could not refresh portfolio')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const needsRefresh = localStorage.getItem('portfolio_needs_refresh')
    if (needsRefresh === 'true') localStorage.removeItem('portfolio_needs_refresh')
    fetchPortfolioData('1W')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-generate chart when period tab changes (no refetch needed)
  useEffect(() => {
    periodRef.current = activePeriod
    if (!isLoading && totalPortfolioValue > 0) {
      setChartData(generateHistory(activePeriod, totalPortfolioValue))
    }
  }, [activePeriod]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (refreshing || isLoading) return
    setRefreshing(true)
    await fetchPortfolioData(activePeriod)
    setRefreshing(false)
    toast.success('Portfolio refreshed!')
  }

  const getAIPortfolioReview = async () => {
    if (isLoadingReview || holdings.length === 0) return
    setIsLoadingReview(true)
    setAiReview(null)
    setShowReview(false)
    try {
      const winners = holdings.filter(h => h.pnl >= 0).length
      const losers  = holdings.filter(h => h.pnl < 0).length
      const holdingsSummary = holdings.map(h => {
        const pnlSymbol = h.pnl >= 0 ? '+' : ''
        return `${h.displaySymbol} (${h.company_name || h.symbol}): ${h.quantity} shares, Avg buy: ₹${h.avg_price?.toFixed(2)}, Current: ₹${h.livePrice?.toFixed(2)}, P&L: ${pnlSymbol}₹${Math.round(h.pnl)} (${pnlSymbol}${h.pnlPercent?.toFixed(2)}%)`
      }).join('\n')

      const prompt = `You are an expert Indian stock market portfolio analyst. Analyze this virtual trading portfolio and give actionable feedback.

Portfolio Summary:
- Total Portfolio Value: ₹${totalPortfolioValue.toLocaleString('en-IN')}
- Cash Balance: ₹${balance.toLocaleString('en-IN')}
- Stocks Invested: ₹${totalInvested.toLocaleString('en-IN')}
- Overall P&L: ${totalGain >= 0 ? '+' : ''}₹${Math.abs(totalGain).toLocaleString('en-IN')} (${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%)
- Winners: ${winners} | Losers: ${losers}

Holdings:
${holdingsSummary}

Please provide a structured analysis with:
1. **Portfolio Health Score** (X/10 with reason)
2. **Diversification Analysis** (sector concentration risks)
3. **Top Performer** (what's working and why)
4. **Biggest Risk** (your most dangerous holding and why)
5. **3 Specific Action Items** (what to buy, sell, or rebalance)
6. **Key Insight** (one contrarian or non-obvious observation)

Be direct, specific, and use Indian market context. Keep each section concise (2-3 sentences max).`

      const { data, error: fnErr } = await supabase.functions.invoke('ai-mentor', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o-mini',
        },
      })
      if (fnErr) throw new Error(fnErr.message)
      setAiReview(data?.message ?? null)
      setShowReview(true)
    } catch (err) {
      console.error('Portfolio review error:', err)
      toast.error('Could not get AI review')
    } finally {
      setIsLoadingReview(false)
    }
  }

  const renderReviewSection = (text) => {
    if (!text) return null
    return text.split('\n').filter(line => line.trim()).map((line, i) => {
      const isBold = /^\*\*/.test(line.trim()) || /^\d+\.\s*\*\*/.test(line.trim())
      if (isBold) {
        const cleaned = line.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '')
        return (
          <div key={i} style={{ borderLeft: '3px solid #4CAF50', background: '#F0FFF0', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 8 }}>
            <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 700 }}>{cleaned}</p>
          </div>
        )
      }
      return (
        <p key={i} style={{ color: C.medium, fontSize: 11, lineHeight: 1.7, marginBottom: 6, paddingLeft: 4 }}>
          {line}
        </p>
      )
    })
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isUp                 = totalGain >= 0
  const holdingsCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const donutData            = holdings.map((h, i) => ({
    symbol: h.displaySymbol,
    value:  h.currentValue,
    color:  CHART_COLORS[i % CHART_COLORS.length],
  }))

  const chartStart     = chartData[0]?.value ?? 0
  const chartCurrent   = chartData[chartData.length - 1]?.value ?? 0
  const chartChange    = chartCurrent - chartStart
  const chartChangePct = chartStart > 0 ? ((chartChange / chartStart) * 100).toFixed(2) : '0.00'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 70 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #EBF5EB', position: 'sticky', top: 0, zIndex: 20, background: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <button onClick={() => navigate('/home')} style={{ background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: 10, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} color={C.dark} />
          </button>
          <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: C.dark, fontSize: 15, fontWeight: 700, pointerEvents: 'none' }}>
            My Portfolio
          </p>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              title="Refresh live prices"
              style={{ width: 28, height: 28, borderRadius: '50%', background: refreshing ? '#E8F5E9' : '#F5F9F5', border: '1px solid #E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (refreshing || isLoading) ? 'not-allowed' : 'pointer', opacity: (refreshing || isLoading) ? 0.5 : 1 }}
            >
              <RefreshCw size={13} color={C.muted} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F9F5', border: '1px solid #E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <MoreHorizontal size={16} color={C.muted} />
            </button>
          </div>
        </div>

        {/* ── SUMMARY CARD ────────────────────────────────────────────────────── */}
        <div style={{ margin: '12px 12px 0', background: '#FFFFFF', border: `1px solid ${C.border}`, borderTop: '4px solid #4CAF50', borderRadius: 18, padding: 16, boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Shimmer w={130} h={10} />
              <Shimmer w={200} h={32} />
              <Shimmer w={160} h={14} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Shimmer h={56} radius={10} />
                <Shimmer h={56} radius={10} />
                <Shimmer h={56} radius={10} />
              </div>
              <Shimmer h={32} radius={8} />
            </div>
          ) : (
            <>
              <p style={{ color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
                Total Portfolio Value
              </p>

              <p style={{ color: C.dark, fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 8 }}>
                ₹{totalPortfolioValue.toLocaleString('en-IN')}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ background: isUp ? C.greenBg : C.redBg, color: isUp ? C.greenDark : C.redDark, border: `1px solid ${isUp ? '#C8E6C9' : '#FFCDD2'}`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>
                  {isUp ? '+' : ''}₹{Math.abs(totalGain).toLocaleString('en-IN')}
                </span>
                <span style={{ color: C.muted, fontSize: 11 }}>
                  {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}% all time
                </span>
              </div>

              {/* 3-stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Cash Left', value: `₹${balance.toLocaleString('en-IN')}`,                                                                     color: C.dark },
                  { label: 'In Stocks', value: `₹${totalInvested.toLocaleString('en-IN')}`,                                                               color: C.dark },
                  { label: "Today's P&L", value: `${todaysPnL >= 0 ? '+' : ''}₹${Math.abs(todaysPnL).toLocaleString('en-IN')}`,                           color: todaysPnL >= 0 ? C.greenDark : C.redDark },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#F8FFF8', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #E8F5E9' }}>
                    <p style={{ color: C.muted, fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{stat.label}</p>
                    <p style={{ color: stat.color, fontSize: 12, fontWeight: 800 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Initial capital footer */}
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#F0F9F0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: C.muted, fontSize: 10 }}>Initial Capital</span>
                <span style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>₹1,00,000</span>
              </div>
            </>
          )}
        </div>

        {/* ── PERFORMANCE CHART ───────────────────────────────────────────────── */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, margin: '12px 12px 0', padding: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>Portfolio Performance</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1W', '1M', '3M', 'All'].map(p => (
                <button key={p} onClick={() => setActivePeriod(p)}
                  style={{ background: activePeriod === p ? C.green : '#F5F9F5', color: activePeriod === p ? '#FFFFFF' : C.muted, border: activePeriod === p ? 'none' : `1px solid ${C.border}`, borderRadius: 20, padding: '3px 8px', fontSize: 8, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.2s ease' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Shimmer h={90} radius={8} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Shimmer w={80} h={10} /><Shimmer w={60} h={10} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ height: 90 }}>
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portGradUp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4CAF50" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="portGradDown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#E53935" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#E53935" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={isUp ? C.green : C.red} strokeWidth={2}
                      fill={`url(#${isUp ? 'portGradUp' : 'portGradDown'})`} dot={false}
                      activeDot={{ r: 3, fill: isUp ? C.green : C.red, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <p style={{ color: C.dark, fontSize: 10, fontWeight: 700 }}>{fmtINR(chartCurrent)}</p>
                <span style={{ color: chartChange >= 0 ? C.greenDark : C.redDark, fontSize: 9, fontWeight: 600 }}>
                  {chartChange >= 0 ? '+' : ''}{fmtAbbr(chartChange)} ({chartChange >= 0 ? '+' : ''}{chartChangePct}%) this period
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── ASSET ALLOCATION DONUT ──────────────────────────────────────────── */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, margin: '12px 12px 0', padding: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>Asset Allocation</p>
            <span style={{ color: C.muted, fontSize: 9 }}>
              {isLoading ? '—' : `${holdings.length} stock${holdings.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Shimmer w={90} h={90} radius={45} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Shimmer h={12} /><Shimmer h={12} /><Shimmer h={12} />
              </div>
            </div>
          ) : holdings.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: '16px 0' }}>No stocks held yet</p>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                <PieChart width={90} height={90}>
                  <Pie data={donutData} cx={44} cy={44} innerRadius={28} outerRadius={40}
                    dataKey="value" paddingAngle={donutData.length > 1 ? 2 : 0}
                    strokeWidth={0} startAngle={90} endAngle={-270}>
                    {donutData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{ color: C.dark, fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}>{fmtAbbr(holdingsCurrentValue)}</p>
                  <p style={{ color: C.muted, fontSize: 7 }}>Stocks</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {donutData.map(entry => {
                  const pct = holdingsCurrentValue > 0
                    ? ((entry.value / holdingsCurrentValue) * 100).toFixed(1) : '0'
                  return (
                    <div key={entry.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                        <span style={{ color: C.dark, fontSize: 9, fontWeight: 600 }}>{entry.symbol}</span>
                      </div>
                      <span style={{ color: C.muted, fontSize: 9 }}>{pct}% · {fmtAbbr(entry.value)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── MY HOLDINGS ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>My Holdings</p>
            <button onClick={() => navigate('/trade')} style={{ color: C.green, fontSize: 9, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              Trade →
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: '#FFFFFF', borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Shimmer w={40} h={40} radius={12} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Shimmer w={60} h={11} /><Shimmer w={100} h={9} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <Shimmer w={70} h={14} /><Shimmer w={80} h={11} />
                    </div>
                  </div>
                  <Shimmer h={3} radius={2} />
                </div>
              ))}
            </div>
          ) : holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: 16, border: '1px dashed #C8E6C9' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <p style={{ color: C.dark, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No Holdings Yet</p>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Buy your first stock to start building your portfolio!</p>
              <button onClick={() => navigate('/trade')} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Start Trading →
              </button>
            </div>
          ) : (
            holdings.map((h, idx) => {
              const isProfit  = h.pnl >= 0
              const weight    = holdingsCurrentValue > 0 ? (h.currentValue / holdingsCurrentValue) * 100 : 0
              const bgColor   = LOGO_BG[idx % LOGO_BG.length]
              const fgColor   = LOGO_FG[idx % LOGO_FG.length]
              const initials  = h.displaySymbol.slice(0, 2).toUpperCase()

              return (
                <div key={h.symbol}
                  style={{ background: '#FFFFFF', borderRadius: 14, padding: '14px', marginBottom: 8, border: '1px solid #F0F0F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#C8E6C9')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F0F0')}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fgColor, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <p style={{ color: C.dark, fontSize: 14, fontWeight: 700, marginBottom: 1 }}>{h.displaySymbol}</p>
                        <p style={{ color: C.muted, fontSize: 11 }}>{h.company_name ?? h.displaySymbol}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: C.dark, fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                        ₹{h.currentValue.toLocaleString('en-IN')}
                      </p>
                      <span style={{ background: isProfit ? C.greenBg : C.redBg, color: isProfit ? C.greenDark : C.redDark, border: `1px solid ${isProfit ? '#C8E6C9' : '#FFCDD2'}`, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {isProfit ? '+' : '−'}₹{Math.abs(h.pnl).toLocaleString('en-IN')} ({isProfit ? '+' : ''}{h.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Detail row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ color: C.muted, fontSize: 11 }}>
                      {h.quantity} shares · Avg ₹{h.avg_price.toLocaleString('en-IN')} · LTP ₹{h.livePrice.toLocaleString('en-IN')}
                    </p>
                    <span style={{ color: h.dayChangePct >= 0 ? '#4CAF50' : '#F44336', fontSize: 10, fontWeight: 600 }}>
                      {h.dayChangePct >= 0 ? '▲' : '▼'} {Math.abs(h.dayChangePct).toFixed(2)}% today
                    </span>
                  </div>

                  {/* P&L progress bar */}
                  <div style={{ height: 3, background: '#F0F0F0', borderRadius: 2, marginBottom: 10 }}>
                    <div style={{ height: 3, background: isProfit ? '#4CAF50' : '#F44336', borderRadius: 2, width: `${Math.min(weight, 100)}%`, transition: 'width 0.5s ease' }} />
                  </div>

                  {/* Buy More / Sell */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate('/trade', { state: { symbol: h.displaySymbol, description: h.company_name ?? h.displaySymbol, mode: 'BUY' } })}
                      style={{ flex: 1, background: C.greenBg, border: '1px solid #C8E6C9', borderRadius: 8, padding: '7px', color: C.greenDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      + Buy More
                    </button>
                    <button
                      onClick={() => navigate('/trade', { state: { symbol: h.displaySymbol, description: h.company_name ?? h.displaySymbol, mode: 'SELL' } })}
                      style={{ flex: 1, background: C.redBg, border: '1px solid #FFCDD2', borderRadius: 8, padding: '7px', color: C.redDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      − Sell
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── AI PORTFOLIO REVIEW ─────────────────────────────────────────────── */}
        {!isLoading && (
          <div style={{ padding: '0 12px 4px' }}>
            <button
              onClick={getAIPortfolioReview}
              disabled={isLoadingReview || holdings.length === 0}
              style={{
                width: '100%', padding: '13px 16px',
                background: isLoadingReview ? C.greenBg : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                color: isLoadingReview ? C.greenDark : '#FFFFFF',
                border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 700,
                cursor: (isLoadingReview || holdings.length === 0) ? 'not-allowed' : 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: holdings.length === 0 ? 0.45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: isLoadingReview ? 'none' : '0 4px 14px rgba(46,125,50,0.28)',
              }}
            >
              {isLoadingReview ? (
                <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #C8E6C9', borderTopColor: C.green, animation: 'spin 0.7s linear infinite' }} /> Analyzing your portfolio...</>
              ) : (
                holdings.length === 0 ? '🤖 AI Review (buy stocks first)' : '🤖 Get AI Portfolio Review'
              )}
            </button>

            {showReview && aiReview && (
              <div style={{ marginTop: 12, background: '#FFFFFF', border: '1px solid #C8E6C9', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(76,175,80,0.1)', marginBottom: 4 }}>
                {/* Card header */}
                <div style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <div>
                      <p style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>AI Portfolio Review</p>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9 }}>Powered by GPT-4o mini</p>
                    </div>
                  </div>
                  <button
                    onClick={getAIPortfolioReview}
                    disabled={isLoadingReview}
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 10px', color: '#FFFFFF', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RefreshCw size={9} color="#FFFFFF" style={{ animation: isLoadingReview ? 'spin 0.8s linear infinite' : 'none' }} />
                    Refresh
                  </button>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  {renderReviewSection(aiReview)}

                  {/* Disclaimer */}
                  <div style={{ marginTop: 12, background: '#FFFDE7', border: '1px solid #FFD54F', borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: '#6D4C41', fontSize: 9, lineHeight: 1.65 }}>
                      ⚠️ <strong>Disclaimer:</strong> AI-generated analysis for educational purposes only. Not financial advice. Past performance does not guarantee future results.
                    </p>
                  </div>

                  <button onClick={() => setShowReview(false)} style={{ color: C.muted, fontSize: 9, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Dismiss ×
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECENT TRADES ────────────────────────────────────────────────────── */}
        <div style={{ padding: '12px 12px 12px' }}>
          <p style={{ color: C.dark, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Recent Trades</p>
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #F0F0F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {isLoading ? (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Shimmer w={28} h={28} radius={8} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Shimmer w={60} h={10} /><Shimmer w={100} h={8} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <Shimmer w={60} h={10} /><Shimmer w={50} h={8} />
                    </div>
                  </div>
                ))}
              </div>
            ) : trades.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: '24px 0' }}>No trades yet. Start trading!</p>
            ) : (
              trades.map((trade, i) => {
                const isBuy  = trade.trade_type === 'BUY'
                const isLast = i === trades.length - 1
                const sym    = cleanSymbol(trade.symbol)
                return (
                  <div key={trade.id ?? i}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: isLast ? 'none' : '1px solid #F5F9F5' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isBuy ? C.greenBg : C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isBuy ? C.greenDark : C.redDark, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {isBuy ? 'B' : 'S'}
                      </div>
                      <div>
                        <p style={{ color: C.dark, fontSize: 10, fontWeight: 700, marginBottom: 1 }}>{sym}</p>
                        <p style={{ color: C.muted, fontSize: 8 }}>{trade.quantity} shares @ {fmtINR(trade.price)}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: isBuy ? C.redDark : C.greenDark, fontSize: 10, fontWeight: 700, marginBottom: 1 }}>
                        {isBuy ? '−' : '+'}{fmtINR(trade.total_amount)}
                      </p>
                      <p style={{ color: C.muted, fontSize: 8 }}>{trade.created_at ? formatDate(trade.created_at) : '—'}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* ── BOTTOM NAV ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#FFFFFF', borderTop: '1px solid #EBF5EB', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      onClick={() => navigate('/home')}      />
        <NavItem icon={TrendingUp}    label="Trade"     onClick={() => navigate('/trade')}     />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyIcon size={22} color="#AAAAAA" />
          <span style={{ color: '#AAAAAA', fontSize: 9, fontWeight: 500 }}>League</span>
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor" onClick={() => navigate('/ai-mentor')} />
        <NavItem icon={User}          label="Profile"   onClick={() => navigate('/profile')}   />
      </div>
    </div>
  )
}
