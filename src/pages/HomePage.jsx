import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Home, TrendingUp,
  MessageCircle, User, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#F8FAF8',
  card:      '#FFFFFF',
  border:    '#E8F5E9',
  green:     '#4CAF50',
  greenDark: '#2E7D32',
  greenBg:   '#E8F5E9',
  red:       '#C62828',
  redBg:     '#FFEBEE',
  muted:     '#888888',
  medium:    '#555555',
  dark:      '#1A1A1A',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = (n) =>
  '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n))

// ─── Stock symbol lists ───────────────────────────────────────────────────────
const TOP_MOVERS_SYMBOLS = [
  { symbol: 'TATAMOTORS', description: 'Tata Motors Ltd',          sector: 'Auto'        },
  { symbol: 'RELIANCE',   description: 'Reliance Industries',       sector: 'Energy'      },
  { symbol: 'INFY',       description: 'Infosys Ltd',               sector: 'IT'          },
  { symbol: 'HDFCBANK',   description: 'HDFC Bank Ltd',             sector: 'Banking'     },
  { symbol: 'SBIN',       description: 'State Bank of India',       sector: 'Banking'     },
  { symbol: 'ZOMATO',     description: 'Zomato Ltd',                sector: 'Tech'        },
  { symbol: 'ADANIENT',   description: 'Adani Enterprises',         sector: 'Conglomerate'},
  { symbol: 'WIPRO',      description: 'Wipro Ltd',                 sector: 'IT'          },
  { symbol: 'BEL',        description: 'Bharat Electronics',        sector: 'Defence'     },
  { symbol: 'IRCTC',      description: 'Indian Railway Catering',   sector: 'Travel'      },
]

const TRENDING_SYMBOLS = [
  { symbol: 'BAJFINANCE', description: 'Bajaj Finance Ltd',         sector: 'Finance'     },
  { symbol: 'ITC',        description: 'ITC Ltd',                   sector: 'FMCG'        },
  { symbol: 'MARUTI',     description: 'Maruti Suzuki',             sector: 'Auto'        },
  { symbol: 'HCLTECH',    description: 'HCL Technologies',          sector: 'IT'          },
  { symbol: 'TITAN',      description: 'Titan Company',             sector: 'Consumer'    },
  { symbol: 'BHARTIARTL', description: 'Bharti Airtel',             sector: 'Telecom'     },
  { symbol: 'LT',         description: 'Larsen & Toubro',           sector: 'Infra'       },
  { symbol: 'AXISBANK',   description: 'Axis Bank Ltd',             sector: 'Banking'     },
]

// ─── News helpers ─────────────────────────────────────────────────────────────
const BULLISH_WORDS = ['surge','rally','gain','rise','high','record','profit','growth','boost','strong','positive','buy','bull','soar','jump','increase','beat','exceed','outperform','upgrade','recovery','optimistic','up']
const BEARISH_WORDS = ['fall','drop','decline','loss','down','low','cut','weak','sell','bear','crash','plunge','slump','decrease','miss','disappoint','concern','risk','warning','downgrade','pressure','fear','recession']

const getSentiment = (text) => {
  const lower = text.toLowerCase()
  let bull = 0, bear = 0
  BULLISH_WORDS.forEach(w => { if (lower.includes(w)) bull++ })
  BEARISH_WORDS.forEach(w => { if (lower.includes(w)) bear++ })
  if (bull > bear) return 'Bullish'
  if (bear > bull) return 'Bearish'
  return 'Update'
}

const getTimeAgo = (ts) => {
  const diff = Date.now() / 1000 - ts
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const INDIA_KEYWORDS = ['india','nse','bse','nifty','sensex','rupee','rbi','sebi','tata','reliance','infosys','hdfc','market','stock','equity','adani','bajaj','wipro','irctc','zomato']

const FALLBACK_NEWS = [
  { id:1, headline:'Nifty 50 hits new all-time high amid strong FII buying',                       summary:'FIIs pumped ₹8,000 crore in a single session.',                                          source:'Economic Times',   datetime: Date.now()/1000-7200,  sentiment:'Bullish', url:'https://economictimes.indiatimes.com' },
  { id:2, headline:'RBI holds repo rate steady at 6.5%, focus on inflation',                       summary:'RBI kept rates unchanged for the sixth consecutive time.',                               source:'Moneycontrol',      datetime: Date.now()/1000-14400, sentiment:'Update',  url:'https://moneycontrol.com'             },
  { id:3, headline:'Tata Motors reports record quarterly sales, EV segment grows 45%',             summary:'Total sales crossed 2 lakh units. EV segment up 45% YoY.',                              source:'Business Standard', datetime: Date.now()/1000-21600, sentiment:'Bullish', url:'https://business-standard.com'        },
  { id:4, headline:'Reliance Industries Q3 profit declines on lower refining margins',             summary:'7% decline in net profit; Jio and retail segments strong.',                             source:'LiveMint',          datetime: Date.now()/1000-28800, sentiment:'Bearish', url:'https://livemint.com'                 },
  { id:5, headline:'SEBI introduces new F&O regulations to protect retail investors',              summary:'Stricter rules including higher margins and position limits for retail traders.',        source:'NSE India',         datetime: Date.now()/1000-36000, sentiment:'Update',  url:'https://nseindia.com'                 },
  { id:6, headline:'Infosys raises FY24 revenue guidance after strong Q3 results',                summary:'IT major upgraded annual revenue growth forecast to 1.5–2% after beating estimates.',   source:'Financial Express', datetime: Date.now()/1000-43200, sentiment:'Bullish', url:'https://financialexpress.com'         },
]

const FALLBACK_PRICES = {
  TATAMOTORS: { price: 942,   changePct:  3.2  },
  RELIANCE:   { price: 2847,  changePct: -1.4  },
  INFY:       { price: 1563,  changePct:  2.1  },
  HDFCBANK:   { price: 1820,  changePct: -0.65 },
  SBIN:       { price: 812,   changePct: -2.1  },
  ZOMATO:     { price: 234,   changePct:  3.1  },
  ADANIENT:   { price: 2456,  changePct:  4.2  },
  WIPRO:      { price: 456,   changePct:  1.3  },
  BEL:        { price: 289,   changePct:  4.3  },
  IRCTC:      { price: 867,   changePct:  2.7  },
  BAJFINANCE: { price: 7234,  changePct: -1.2  },
  ITC:        { price: 458,   changePct:  1.8  },
  MARUTI:     { price: 12450, changePct:  1.5  },
  HCLTECH:    { price: 1678,  changePct:  1.5  },
  TITAN:      { price: 3456,  changePct:  0.8  },
  BHARTIARTL: { price: 1567,  changePct:  2.3  },
  LT:         { price: 3456,  changePct:  1.3  },
  AXISBANK:   { price: 1123,  changePct:  1.4  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LearnCard({ iconBg, icon, title, subtitle, progress, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 130,
        background: C.card,
        borderRadius: 14,
        padding: 12,
        border: `1px solid ${C.border}`,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>
        {icon}
      </div>
      <p style={{ color: C.dark, fontSize: 11, fontWeight: 700, marginBottom: 3, lineHeight: 1.35 }}>{title}</p>
      <p style={{ color: C.muted, fontSize: 9, marginBottom: 8 }}>{subtitle}</p>
      <div style={{ height: 3, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: C.green, borderRadius: 2 }} />
      </div>
    </div>
  )
}


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

function ActionBtn({ emoji, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, background: '#F8FFF8', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
      <p style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</p>
      <p style={{ color: C.dark, fontSize: 10, fontWeight: 600 }}>{label}</p>
      <p style={{ color: C.muted, fontSize: 9 }}>{sub}</p>
    </button>
  )
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function StockSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < 3 ? '1px solid #F5F5F5' : 'none', opacity: 1 - i * 0.2 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F0F0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: 100, height: 11, background: '#F0F0F0', borderRadius: 4, marginBottom: 5 }} />
            <div style={{ width: 60, height: 9, background: '#F0F0F0', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18, marginRight: 8 }}>
            {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 1].map((h, j) => (
              <div key={j} style={{ width: 3, height: `${h * 18}px`, borderRadius: 1, background: '#F0F0F0' }} />
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: 55, height: 12, background: '#F0F0F0', borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 40, height: 10, background: '#F0F0F0', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Static data ──────────────────────────────────────────────────────────────
const LEARN_CARDS = [
  { iconBg: 'rgba(76,175,80,0.12)',   icon: '📊', title: 'Candlestick Charts', subtitle: 'Lesson 3 of 8',  progress: 35  },
  { iconBg: 'rgba(251,191,36,0.12)',  icon: '📉', title: 'RSI Indicator',      subtitle: 'Start now',      progress: 0   },
  { iconBg: 'rgba(33,150,243,0.12)',  icon: '🛡️', title: 'What is Stop Loss?', subtitle: 'Completed ✓',   progress: 100 },
  { iconBg: 'rgba(244,114,182,0.12)', icon: '💼', title: 'Diversification',    subtitle: 'Lesson 1 of 5', progress: 10  },
]

const TABS = [
  { id: 'movers',    label: 'Top Movers' },
  { id: 'trending',  label: 'Trending'   },
  { id: 'watchlist', label: '⭐ Watchlist' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()

  // Portfolio state
  const [userName,            setUserName]            = useState('Trader')
  const [virtualBalance,      setVirtualBalance]      = useState(100000)
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(100000)
  const [portfolioGain,       setPortfolioGain]       = useState(0)
  const [portfolioGainPct,    setPortfolioGainPct]    = useState('0.00')

  // Stock tabs state
  const [activeTab,       setActiveTab]       = useState('movers')
  const [topMovers,       setTopMovers]       = useState([])
  const [trending,        setTrending]        = useState([])
  const [watchlistStocks, setWatchlistStocks] = useState([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(false)
  const [watchlistLoaded, setWatchlistLoaded] = useState(false)

  // News state
  const [news,          setNews]          = useState([])
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [showAllNews,   setShowAllNews]   = useState(false)

  // ── Fetch live prices via Finnhub → fallback ────────────────────────────────
  const fetchStockPrices = async (symbols) => {
    const results = await Promise.allSettled(
      symbols.map(async (stock) => {
        try {
          if (FINNHUB_KEY) {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}.NS&token=${FINNHUB_KEY}`,
              { signal: AbortSignal.timeout(4000) }
            )
            const data = await res.json()
            if (data.c && data.c > 0) {
              return {
                ...stock,
                price:     data.c,
                change:    data.d  ?? 0,
                changePct: data.dp ?? 0,
                high:      data.h,
                low:       data.l,
                open:      data.o,
              }
            }
          }
        } catch { /* fall through to fallback */ }

        const fb = FALLBACK_PRICES[stock.symbol]
        const p  = fb?.price ?? 1000
        const cp = fb?.changePct ?? 0
        return { ...stock, price: p, change: Math.round(p * cp) / 100, changePct: cp }
      })
    )
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
  }

  // ── Fetch movers + trending on mount ────────────────────────────────────────
  const fetchAllStockData = async () => {
    setIsLoadingStocks(true)
    try {
      const [moversData, trendingData] = await Promise.all([
        fetchStockPrices(TOP_MOVERS_SYMBOLS),
        fetchStockPrices(TRENDING_SYMBOLS),
      ])
      const sorted = [...moversData].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      setTopMovers(sorted)
      setTrending(trendingData)
    } catch (err) {
      console.error('Stock fetch error:', err)
    } finally {
      setIsLoadingStocks(false)
    }
  }

  // ── Fetch user watchlist from Supabase ──────────────────────────────────────
  const fetchWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('watchlist').eq('id', user.id).single()

      if (profile?.watchlist && profile.watchlist.length > 0) {
        const wlSymbols = profile.watchlist.map(sym => ({
          symbol:      sym,
          description: sym,
          sector:      'NSE',
        }))
        const data = await fetchStockPrices(wlSymbols)
        setWatchlistStocks(data)
      } else {
        setWatchlistStocks([])
      }
      setWatchlistLoaded(true)
    } catch (err) {
      console.error('Watchlist fetch error:', err)
      setWatchlistLoaded(true)
    }
  }

  // ── Remove a stock from watchlist ───────────────────────────────────────────
  const removeFromWatchlist = async (symbol) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile }  = await supabase
        .from('profiles').select('watchlist').eq('id', user.id).single()

      const updated = (profile?.watchlist ?? []).filter(s => s !== symbol)
      await supabase.from('profiles').update({ watchlist: updated }).eq('id', user.id)

      setWatchlistStocks(prev => prev.filter(s => s.symbol !== symbol))
      toast('Removed from watchlist')
    } catch (err) {
      console.error(err)
      toast.error('Could not remove from watchlist')
    }
  }

  // ── Fetch real market news from Finnhub ─────────────────────────────────────
  const fetchMarketNews = async () => {
    setIsLoadingNews(true)
    try {
      if (FINNHUB_KEY) {
        const res = await fetch(
          `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        )
        const data = await res.json()

        if (Array.isArray(data) && data.length > 0) {
          const shaped = (arr) =>
            arr.map(item => ({
              id:        item.id,
              headline:  item.headline,
              summary:   item.summary,
              source:    item.source,
              url:       item.url,
              datetime:  item.datetime,
              sentiment: getSentiment((item.headline ?? '') + ' ' + (item.summary ?? '')),
            }))

          const india = data.filter(item =>
            item.headline &&
            INDIA_KEYWORDS.some(kw => item.headline.toLowerCase().includes(kw))
          ).slice(0, 6)

          setNews(shaped(india.length >= 2 ? india : data.slice(0, 6)))
          setIsLoadingNews(false)
          return
        }
      }
      setNews(FALLBACK_NEWS)
    } catch (err) {
      console.error('News fetch error:', err)
      setNews(FALLBACK_NEWS)
    } finally {
      setIsLoadingNews(false)
    }
  }

  // ── Tab change — lazy-load watchlist ────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'watchlist' && !watchlistLoaded) fetchWatchlist()
  }

  // ── Portfolio + stock data + news on mount ───────────────────────────────────
  useEffect(() => {
    loadPortfolio()
    fetchAllStockData()
    fetchMarketNews()
    const newsTimer = setInterval(fetchMarketNews, 5 * 60 * 1000)
    return () => clearInterval(newsTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPortfolio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('full_name, virtual_balance').eq('id', user.id).single()

    if (profile) {
      if (profile.full_name) setUserName(profile.full_name.split(' ')[0])
      const bal = profile.virtual_balance ?? 100000
      setVirtualBalance(bal)

      const { data: holdings } = await supabase
        .from('holdings').select('symbol, quantity, avg_price').eq('user_id', user.id)

      if (holdings && holdings.length > 0) {
        const prices = {}
        await Promise.allSettled(
          holdings.map(async (h) => {
            try {
              const res = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${FINNHUB_KEY}`
              )
              const q = await res.json()
              if (q?.c && q.c > 0) prices[h.symbol] = q.c
            } catch { /* ignore */ }
          })
        )
        const holdingsVal = holdings.reduce((sum, h) => sum + h.quantity * (prices[h.symbol] ?? h.avg_price), 0)
        const total   = bal + holdingsVal
        const gain    = total - 100000
        setTotalPortfolioValue(total)
        setPortfolioGain(gain)
        setPortfolioGainPct(((gain / 100000) * 100).toFixed(2))
      } else {
        setTotalPortfolioValue(bal)
        setPortfolioGain(bal - 100000)
        setPortfolioGainPct((((bal - 100000) / 100000) * 100).toFixed(2))
      }
    } else {
      const meta = user.user_metadata
      if (meta?.full_name) setUserName(meta.full_name.split(' ')[0])
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentStocks = activeTab === 'movers' ? topMovers
    : activeTab === 'trending' ? trending
    : watchlistStocks

  const isLoading = isLoadingStocks && (activeTab === 'movers' || activeTab === 'trending')

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', paddingBottom: 70 }}>

        {/* ── S1: HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 14px', background: '#FFFFFF', borderBottom: '1px solid #EBF5EB' }}>
          <div>
            <p style={{ color: '#1B6B1B', fontSize: 18, fontWeight: 800, lineHeight: 1, marginBottom: 3, letterSpacing: '-0.3px' }}>TradeBoost.AI</p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 0 }}>
              Good morning 👋 <span style={{ color: C.dark, fontWeight: 700 }}>{userName}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button style={{ width: 34, height: 34, borderRadius: '50%', background: '#F0F9F0', border: '1px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Bell size={16} color={C.green} strokeWidth={1.8} />
              </button>
              <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: C.red, border: '1.5px solid #FFFFFF' }} />
            </div>
            <div onClick={() => navigate('/profile')} title="My Profile" style={{ width: 34, height: 34, borderRadius: '50%', background: C.green, border: '2px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* ── S2: VIRTUAL PORTFOLIO CARD ─────────────────────────────────────── */}
        <div
          onClick={() => navigate('/portfolio')}
          style={{ margin: '12px 16px 14px', background: '#FFFFFF', borderRadius: 20, border: `1px solid ${C.border}`, borderTop: '3px solid #4CAF50', padding: 18, cursor: 'pointer', boxShadow: '0 2px 12px rgba(76,175,80,0.08)', transition: 'all 0.2s ease' }}
        >
          <p style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Virtual Portfolio</p>
          <p style={{ color: C.dark, fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 10 }}>{fmtINR(totalPortfolioValue)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ background: portfolioGain >= 0 ? C.greenBg : C.redBg, color: portfolioGain >= 0 ? C.greenDark : C.red, border: `1px solid ${portfolioGain >= 0 ? '#C8E6C9' : '#FFCDD2'}`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 9px' }}>
              {portfolioGain >= 0 ? '+' : ''}{fmtINR(Math.abs(portfolioGain))}
            </span>
            <span style={{ color: C.muted, fontSize: 11 }}>
              {portfolioGain >= 0 ? '+' : ''}{portfolioGainPct}% all time
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionBtn emoji="📈" label="Buy"       sub="Purchase" onClick={e => { e.stopPropagation(); navigate('/trade', { state: { mode: 'BUY' } }) }} />
            <ActionBtn emoji="📉" label="Sell"      sub="Sell"     onClick={e => { e.stopPropagation(); navigate('/trade', { state: { mode: 'SELL' } }) }} />
            <ActionBtn emoji="⭐"  label="Watchlist" sub="Saved"    onClick={e => { e.stopPropagation(); handleTabChange('watchlist'); setTimeout(() => document.getElementById('stock-tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }} />
            <ActionBtn emoji="📊" label="Portfolio" sub="P&L"      onClick={e => { e.stopPropagation(); navigate('/portfolio') }} />
          </div>
        </div>

        {/* ── S3: EDUCATION CARDS ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 10 }}>
            <p style={{ color: C.dark, fontSize: 14, fontWeight: 700 }}>Learn & Practice</p>
            <button onClick={() => navigate('/learn')} style={{ color: C.green, fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {LEARN_CARDS.map((c, i) => <LearnCard key={i} {...c} onClick={() => navigate('/learn')} />)}
          </div>
        </div>

        {/* ── S4: STOCK LIST + TABS ──────────────────────────────────────────── */}
        <div id="stock-tabs-section" style={{ marginBottom: 16 }}>
          <div style={{ height: 1, background: '#F0F0F0', margin: '0 16px 12px' }} />

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 12 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background:   activeTab === tab.id ? C.green : '#F0F9F0',
                  color:        activeTab === tab.id ? '#FFFFFF' : C.greenDark,
                  border:       activeTab === tab.id ? 'none' : '1px solid #C8E6C9',
                  borderRadius: 20,
                  padding:      '5px 14px',
                  fontSize:     11,
                  fontWeight:   700,
                  cursor:       'pointer',
                  fontFamily:   "'Plus Jakarta Sans', sans-serif",
                  whiteSpace:   'nowrap',
                  transition:   'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stock rows */}
          <div style={{ padding: '0 16px' }}>
            {isLoading ? (
              <StockSkeleton />
            ) : currentStocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 20px', background: '#F8FFF8', borderRadius: 14, border: '1px dashed #C8E6C9' }}>
                {activeTab === 'watchlist' ? (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
                    <p style={{ color: C.dark, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No stocks in watchlist</p>
                    <p style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>
                      Go to Trade page and tap the ⭐ icon to save stocks here
                    </p>
                    <button
                      onClick={() => navigate('/trade')}
                      style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Browse Stocks →
                    </button>
                  </>
                ) : (
                  <p style={{ color: C.muted, fontSize: 12 }}>Loading stock data...</p>
                )}
              </div>
            ) : (
              currentStocks.map((stock, idx) => {
                const isUp    = (stock.changePct ?? 0) >= 0
                const isLast  = idx === currentStocks.length - 1
                const initials = stock.symbol?.slice(0, 2).toUpperCase()

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate('/trade', { state: { symbol: stock.symbol, description: stock.description } })}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: isLast ? 'none' : '1px solid #F5F5F5', cursor: 'pointer' }}
                  >
                    {/* Left: logo + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isUp ? '#E8F5E9' : '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isUp ? C.greenDark : C.red, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: C.dark, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stock.description?.length > 22 ? stock.description.slice(0, 22) + '…' : stock.description}
                        </p>
                        <p style={{ color: C.muted, fontSize: 10 }}>{stock.symbol} · {stock.sector}</p>
                      </div>
                    </div>

                    {/* Right: mini bars + price + change */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
                        {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 1.0].map((h, j) => (
                          <div key={j} style={{ width: 3, height: `${h * 18}px`, borderRadius: 1, background: isUp ? C.green : '#F44336', opacity: 0.4 + j * 0.08 }} />
                        ))}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>
                          ₹{stock.price?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                        </p>
                        <p style={{ color: isUp ? C.greenDark : C.red, fontSize: 10, fontWeight: 700 }}>
                          {isUp ? '▲' : '▼'} {Math.abs(stock.changePct ?? 0).toFixed(2)}%
                        </p>
                      </div>

                      {activeTab === 'watchlist' && (
                        <button
                          onClick={e => { e.stopPropagation(); removeFromWatchlist(stock.symbol) }}
                          style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 6, padding: '3px 7px', color: C.red, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {/* "View all on Trade page" link */}
            {!isLoading && currentStocks.length > 0 && (
              <button
                onClick={() => navigate('/trade')}
                style={{ width: '100%', marginTop: 10, padding: '9px', background: '#F0F9F0', border: '1px solid #C8E6C9', borderRadius: 10, color: C.greenDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                View all stocks on Trade page →
              </button>
            )}
          </div>
        </div>

        {/* ── S5: NEWS ───────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 1, background: '#F0F0F0', margin: '0 16px 12px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 10 }}>
            <p style={{ color: C.dark, fontSize: 14, fontWeight: 700 }}>Today's Market News</p>
            <button
              onClick={fetchMarketNews}
              disabled={isLoadingNews}
              style={{ background: 'none', border: 'none', color: C.green, fontSize: 11, fontWeight: 600, cursor: isLoadingNews ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: isLoadingNews ? 0.6 : 1 }}
            >
              {isLoadingNews ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          <div style={{ padding: '0 16px' }}>
            {isLoadingNews && news.length === 0 ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: 70, background: '#F0F9F0', borderRadius: 12, marginBottom: 8, opacity: 1 - i * 0.25 }} />
              ))
            ) : (
              <>
                {(showAllNews ? news : news.slice(0, 3)).map((item, idx) => {
                  const isBull = item.sentiment === 'Bullish'
                  const isBear = item.sentiment === 'Bearish'
                  return (
                    <div
                      key={item.id ?? idx}
                      onClick={() => item.url && window.open(item.url, '_blank')}
                      style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #F0F0F0', padding: '11px 12px', marginBottom: 8, cursor: item.url ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => { if (item.url) e.currentTarget.style.borderColor = '#C8E6C9' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0F0F0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ flexShrink: 0, marginTop: 2, background: isBull ? '#E8F5E9' : isBear ? '#FFEBEE' : '#E3F2FD', color: isBull ? '#2E7D32' : isBear ? C.red : '#1565C0', border: `1px solid ${isBull ? '#C8E6C9' : isBear ? '#FFCDD2' : '#BBDEFB'}`, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          {isBull ? '📈 Bullish' : isBear ? '📉 Bearish' : '📊 Update'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: C.dark, fontSize: 12, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>
                            {item.headline?.length > 85 ? item.headline.slice(0, 85) + '…' : item.headline}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ color: C.muted, fontSize: 10 }}>{item.source}</span>
                            <span style={{ color: '#CCC', fontSize: 10 }}>·</span>
                            <span style={{ color: C.muted, fontSize: 10 }}>{getTimeAgo(item.datetime)}</span>
                            {item.url && (
                              <>
                                <span style={{ color: '#CCC', fontSize: 10 }}>·</span>
                                <span style={{ color: C.green, fontSize: 10, fontWeight: 600 }}>Read →</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {news.length > 3 && (
                  <button
                    onClick={() => setShowAllNews(v => !v)}
                    style={{ width: '100%', background: '#F0F9F0', border: '1px solid #C8E6C9', borderRadius: 10, padding: '9px', color: C.greenDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {showAllNews ? '▲ Show Less' : `▼ View ${news.length - 3} More News`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── S6: AI MENTOR BANNER ───────────────────────────────────────────── */}
        <div
          style={{ margin: '0 16px 14px', background: '#F0FBF0', border: '1px solid #C8E6C9', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s ease' }}
          onClick={() => navigate('/ai-mentor')}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/ai-mentor')}
        >
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#1B6B1B', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Ask AI Mentor</p>
            <p style={{ color: C.green, fontSize: 10 }}>Ask anything about stocks & market</p>
          </div>
          <ChevronRight size={18} color={C.green} style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </div>

      </div>

      {/* ── S7: BOTTOM NAVIGATION ────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#FFFFFF', borderTop: '1px solid #EBF5EB', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      active onClick={() => navigate('/home')}       />
        <NavItem icon={TrendingUp}    label="Trade"            onClick={() => navigate('/trade')}       />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyIcon size={22} color="#AAAAAA" />
          <span style={{ color: '#AAAAAA', fontSize: 9, fontWeight: 500 }}>League</span>
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor"        onClick={() => navigate('/ai-mentor')}  />
        <NavItem icon={User}          label="Profile"          onClick={() => navigate('/profile')}    />
      </div>
    </div>
  )
}
