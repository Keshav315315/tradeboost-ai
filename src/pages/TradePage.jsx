import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, Search, X, Home, TrendingUp,
  MessageCircle, User, Star, Bell, Info, RefreshCw,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import StopLossPanel from '../components/StopLossPanel'

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#F8FAF8',
  card:      '#FFFFFF',
  border:    '#E8F5E9',
  green:     '#4CAF50',
  greenDark: '#2E7D32',
  greenBg:   '#E8F5E9',
  strongBuy: '#00C853',
  red:       '#F44336',
  redDark:   '#C62828',
  redBg:     '#FFEBEE',
  hold:      '#FF9800',
  muted:     '#888888',
  medium:    '#555555',
  dark:      '#1A1A1A',
  signalBg:  '#0F1628',
}

const SIGNAL_COLORS = {
  'STRONG BUY':  '#00C853',
  'BUY':         '#4CAF50',
  'HOLD':        '#FF9800',
  'SELL':        '#F44336',
  'STRONG SELL': '#B71C1C',
}

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
const TABS = ['Overview', 'News', 'Analysis', 'Financials']

// 150+ NSE stocks — shown when search is empty; also used as instant local-search fallback
const POPULAR_STOCKS = [
  // ── Nifty 50 ──────────────────────────────────────────────────────────────
  {symbol:'RELIANCE.NS',  displaySymbol:'RELIANCE',  description:'Reliance Industries Ltd'},
  {symbol:'TCS.NS',       displaySymbol:'TCS',       description:'Tata Consultancy Services'},
  {symbol:'HDFCBANK.NS',  displaySymbol:'HDFCBANK',  description:'HDFC Bank Ltd'},
  {symbol:'INFY.NS',      displaySymbol:'INFY',      description:'Infosys Ltd'},
  {symbol:'ICICIBANK.NS', displaySymbol:'ICICIBANK', description:'ICICI Bank Ltd'},
  {symbol:'HINDUNILVR.NS',displaySymbol:'HINDUNILVR',description:'Hindustan Unilever'},
  {symbol:'ITC.NS',       displaySymbol:'ITC',       description:'ITC Ltd'},
  {symbol:'SBIN.NS',      displaySymbol:'SBIN',      description:'State Bank of India'},
  {symbol:'BHARTIARTL.NS',displaySymbol:'BHARTIARTL',description:'Bharti Airtel Ltd'},
  {symbol:'KOTAKBANK.NS', displaySymbol:'KOTAKBANK', description:'Kotak Mahindra Bank'},
  {symbol:'WIPRO.NS',     displaySymbol:'WIPRO',     description:'Wipro Ltd'},
  {symbol:'AXISBANK.NS',  displaySymbol:'AXISBANK',  description:'Axis Bank Ltd'},
  {symbol:'TATAMOTORS.NS',displaySymbol:'TATAMOTORS',description:'Tata Motors Ltd'},
  {symbol:'MARUTI.NS',    displaySymbol:'MARUTI',    description:'Maruti Suzuki India'},
  {symbol:'TATASTEEL.NS', displaySymbol:'TATASTEEL', description:'Tata Steel Ltd'},
  {symbol:'BAJFINANCE.NS',displaySymbol:'BAJFINANCE',description:'Bajaj Finance Ltd'},
  {symbol:'BAJAJFINSV.NS',displaySymbol:'BAJAJFINSV',description:'Bajaj Finserv Ltd'},
  {symbol:'HCLTECH.NS',   displaySymbol:'HCLTECH',   description:'HCL Technologies'},
  {symbol:'SUNPHARMA.NS', displaySymbol:'SUNPHARMA', description:'Sun Pharmaceutical'},
  {symbol:'ULTRACEMCO.NS',displaySymbol:'ULTRACEMCO',description:'UltraTech Cement'},
  {symbol:'TITAN.NS',     displaySymbol:'TITAN',     description:'Titan Company Ltd'},
  {symbol:'ASIANPAINT.NS',displaySymbol:'ASIANPAINT',description:'Asian Paints Ltd'},
  {symbol:'ONGC.NS',      displaySymbol:'ONGC',      description:'Oil & Natural Gas Corp'},
  {symbol:'NTPC.NS',      displaySymbol:'NTPC',      description:'NTPC Ltd'},
  {symbol:'POWERGRID.NS', displaySymbol:'POWERGRID', description:'Power Grid Corp'},
  {symbol:'ADANIENT.NS',  displaySymbol:'ADANIENT',  description:'Adani Enterprises'},
  {symbol:'ADANIPORTS.NS',displaySymbol:'ADANIPORTS',description:'Adani Ports & SEZ'},
  {symbol:'JSWSTEEL.NS',  displaySymbol:'JSWSTEEL',  description:'JSW Steel Ltd'},
  {symbol:'COALINDIA.NS', displaySymbol:'COALINDIA', description:'Coal India Ltd'},
  {symbol:'LT.NS',        displaySymbol:'LT',        description:'Larsen & Toubro Ltd'},
  // ── Midcap popular ────────────────────────────────────────────────────────
  {symbol:'DABUR.NS',     displaySymbol:'DABUR',     description:'Dabur India Ltd'},
  {symbol:'BEL.NS',       displaySymbol:'BEL',       description:'Bharat Electronics Ltd'},
  {symbol:'HAL.NS',       displaySymbol:'HAL',       description:'Hindustan Aeronautics'},
  {symbol:'IRCTC.NS',     displaySymbol:'IRCTC',     description:'Indian Railway Catering'},
  {symbol:'ZOMATO.NS',    displaySymbol:'ZOMATO',    description:'Zomato Ltd'},
  {symbol:'PAYTM.NS',     displaySymbol:'PAYTM',     description:'One97 Communications'},
  {symbol:'NYKAA.NS',     displaySymbol:'NYKAA',     description:'FSN E-Commerce (Nykaa)'},
  {symbol:'DMART.NS',     displaySymbol:'DMART',     description:'Avenue Supermarts'},
  {symbol:'TATAPOWER.NS', displaySymbol:'TATAPOWER', description:'Tata Power Co'},
  {symbol:'INDIGO.NS',    displaySymbol:'INDIGO',    description:'InterGlobe Aviation'},
  {symbol:'PIDILITIND.NS',displaySymbol:'PIDILITIND',description:'Pidilite Industries'},
  {symbol:'MUTHOOTFIN.NS',displaySymbol:'MUTHOOTFIN',description:'Muthoot Finance'},
  {symbol:'BERGEPAINT.NS',displaySymbol:'BERGEPAINT',description:'Berger Paints India'},
  {symbol:'GODREJCP.NS',  displaySymbol:'GODREJCP',  description:'Godrej Consumer Products'},
  {symbol:'MARICO.NS',    displaySymbol:'MARICO',    description:'Marico Ltd'},
  {symbol:'DRREDDY.NS',   displaySymbol:'DRREDDY',   description:"Dr Reddy's Laboratories"},
  {symbol:'CIPLA.NS',     displaySymbol:'CIPLA',     description:'Cipla Ltd'},
  {symbol:'DIVISLAB.NS',  displaySymbol:'DIVISLAB',  description:"Divi's Laboratories"},
  {symbol:'APOLLOHOSP.NS',displaySymbol:'APOLLOHOSP',description:'Apollo Hospitals'},
  {symbol:'HAVELLS.NS',   displaySymbol:'HAVELLS',   description:'Havells India Ltd'},
  {symbol:'VOLTAS.NS',    displaySymbol:'VOLTAS',    description:'Voltas Ltd'},
  {symbol:'VEDL.NS',      displaySymbol:'VEDL',      description:'Vedanta Ltd'},
  {symbol:'HINDALCO.NS',  displaySymbol:'HINDALCO',  description:'Hindalco Industries'},
  {symbol:'BPCL.NS',      displaySymbol:'BPCL',      description:'Bharat Petroleum Corp'},
  {symbol:'IOC.NS',       displaySymbol:'IOC',       description:'Indian Oil Corp'},
  {symbol:'GRASIM.NS',    displaySymbol:'GRASIM',    description:'Grasim Industries'},
  {symbol:'NESTLEIND.NS', displaySymbol:'NESTLEIND', description:'Nestle India Ltd'},
  {symbol:'BRITANNIA.NS', displaySymbol:'BRITANNIA', description:'Britannia Industries'},
  {symbol:'TECHM.NS',     displaySymbol:'TECHM',     description:'Tech Mahindra Ltd'},
  {symbol:'MPHASIS.NS',   displaySymbol:'MPHASIS',   description:'Mphasis Ltd'},
  {symbol:'PERSISTENT.NS',displaySymbol:'PERSISTENT',description:'Persistent Systems'},
  {symbol:'COFORGE.NS',   displaySymbol:'COFORGE',   description:'Coforge Ltd'},
  {symbol:'TATAELXSI.NS', displaySymbol:'TATAELXSI', description:'Tata Elxsi Ltd'},
  {symbol:'KPITTECH.NS',  displaySymbol:'KPITTECH',  description:'KPIT Technologies'},
  {symbol:'DIXON.NS',     displaySymbol:'DIXON',     description:'Dixon Technologies'},
  {symbol:'POLYCAB.NS',   displaySymbol:'POLYCAB',   description:'Polycab India Ltd'},
  {symbol:'ABCAPITAL.NS', displaySymbol:'ABCAPITAL', description:'Aditya Birla Capital'},
  {symbol:'SBICARD.NS',   displaySymbol:'SBICARD',   description:'SBI Cards & Payment'},
  {symbol:'HDFCLIFE.NS',  displaySymbol:'HDFCLIFE',  description:'HDFC Life Insurance'},
  {symbol:'SBILIFE.NS',   displaySymbol:'SBILIFE',   description:'SBI Life Insurance'},
  {symbol:'ICICIGI.NS',   displaySymbol:'ICICIGI',   description:'ICICI Lombard GIC'},
  {symbol:'LICI.NS',      displaySymbol:'LICI',      description:'Life Insurance Corp'},
  {symbol:'SAIL.NS',      displaySymbol:'SAIL',      description:'Steel Authority of India'},
  {symbol:'NHPC.NS',      displaySymbol:'NHPC',      description:'NHPC Ltd'},
  {symbol:'RECLTD.NS',    displaySymbol:'RECLTD',    description:'REC Ltd'},
  {symbol:'PFC.NS',       displaySymbol:'PFC',       description:'Power Finance Corp'},
  {symbol:'IRFC.NS',      displaySymbol:'IRFC',      description:'Indian Railway Finance'},
  {symbol:'HUDCO.NS',     displaySymbol:'HUDCO',     description:'Housing & Urban Dev Corp'},
  {symbol:'BHEL.NS',      displaySymbol:'BHEL',      description:'Bharat Heavy Electricals'},
  {symbol:'GAIL.NS',      displaySymbol:'GAIL',      description:'GAIL India Ltd'},
  {symbol:'PETRONET.NS',  displaySymbol:'PETRONET',  description:'Petronet LNG Ltd'},
  {symbol:'CONCOR.NS',    displaySymbol:'CONCOR',    description:'Container Corp of India'},
  {symbol:'BALKRISIND.NS',displaySymbol:'BALKRISIND',description:'Balkrishna Industries'},
  {symbol:'MRF.NS',       displaySymbol:'MRF',       description:'MRF Ltd'},
  {symbol:'CEAT.NS',      displaySymbol:'CEAT',      description:'CEAT Ltd'},
  {symbol:'APOLLOTYRE.NS',displaySymbol:'APOLLOTYRE',description:'Apollo Tyres Ltd'},
  {symbol:'EICHERMOT.NS', displaySymbol:'EICHERMOT', description:'Eicher Motors Ltd'},
  {symbol:'HEROMOTOCO.NS',displaySymbol:'HEROMOTOCO',description:'Hero MotoCorp Ltd'},
  {symbol:'BAJAJ-AUTO.NS',displaySymbol:'BAJAJ-AUTO',description:'Bajaj Auto Ltd'},
  {symbol:'TVSMOTOR.NS',  displaySymbol:'TVSMOTOR',  description:'TVS Motor Company'},
  {symbol:'M&M.NS',       displaySymbol:'M&M',       description:'Mahindra & Mahindra'},
  {symbol:'ASHOKLEY.NS',  displaySymbol:'ASHOKLEY',  description:'Ashok Leyland Ltd'},
  {symbol:'MOTHERSON.NS', displaySymbol:'MOTHERSON', description:'Samvardhana Motherson'},
  {symbol:'BOSCHLTD.NS',  displaySymbol:'BOSCHLTD',  description:'Bosch Ltd'},
  {symbol:'JUBLFOOD.NS',  displaySymbol:'JUBLFOOD',  description:'Jubilant Foodworks'},
  {symbol:'UBL.NS',       displaySymbol:'UBL',       description:'United Breweries Ltd'},
  {symbol:'RADICO.NS',    displaySymbol:'RADICO',    description:'Radico Khaitan Ltd'},
  {symbol:'VBL.NS',       displaySymbol:'VBL',       description:'Varun Beverages Ltd'},
  {symbol:'TRENT.NS',     displaySymbol:'TRENT',     description:'Trent Ltd'},
  {symbol:'PAGEIND.NS',   displaySymbol:'PAGEIND',   description:'Page Industries Ltd'},
  {symbol:'ZYDUSLIFE.NS', displaySymbol:'ZYDUSLIFE', description:'Zydus Lifesciences'},
  {symbol:'TORNTPHARM.NS',displaySymbol:'TORNTPHARM',description:'Torrent Pharmaceuticals'},
  {symbol:'ALKEM.NS',     displaySymbol:'ALKEM',     description:'Alkem Laboratories'},
  {symbol:'LALPATHLAB.NS',displaySymbol:'LALPATHLAB',description:'Dr Lal PathLabs'},
  {symbol:'MAXHEALTH.NS', displaySymbol:'MAXHEALTH', description:'Max Healthcare'},
  {symbol:'FORTIS.NS',    displaySymbol:'FORTIS',    description:'Fortis Healthcare'},
  {symbol:'NH.NS',        displaySymbol:'NH',        description:'Narayana Hrudayalaya'},
  {symbol:'POLICYBZR.NS', displaySymbol:'POLICYBZR', description:'PB Fintech'},
  {symbol:'DELHIVERY.NS', displaySymbol:'DELHIVERY', description:'Delhivery Ltd'},
  {symbol:'NAUKRI.NS',    displaySymbol:'NAUKRI',    description:'Info Edge India'},
  {symbol:'INDIAMART.NS', displaySymbol:'INDIAMART', description:'IndiaMART InterMESH'},
  {symbol:'OFSS.NS',      displaySymbol:'OFSS',      description:'Oracle Financial Services'},
  {symbol:'LTIM.NS',      displaySymbol:'LTIM',      description:'LTIMindtree Ltd'},
  {symbol:'ADANIGREEN.NS',displaySymbol:'ADANIGREEN',description:'Adani Green Energy'},
  {symbol:'ADANIPOWER.NS',displaySymbol:'ADANIPOWER',description:'Adani Power Ltd'},
  {symbol:'OBEROIRLTY.NS',displaySymbol:'OBEROIRLTY',description:'Oberoi Realty Ltd'},
  {symbol:'DLF.NS',       displaySymbol:'DLF',       description:'DLF Ltd'},
  {symbol:'GODREJPROP.NS',displaySymbol:'GODREJPROP',description:'Godrej Properties'},
  {symbol:'PRESTIGE.NS',  displaySymbol:'PRESTIGE',  description:'Prestige Estates Projects'},
  {symbol:'BRIGADE.NS',   displaySymbol:'BRIGADE',   description:'Brigade Enterprises'},
  {symbol:'PHOENIXLTD.NS',displaySymbol:'PHOENIXLTD',description:'Phoenix Mills Ltd'},
  {symbol:'RVNL.NS',      displaySymbol:'RVNL',      description:'Rail Vikas Nigam Ltd'},
  {symbol:'TITAGARH.NS',  displaySymbol:'TITAGARH',  description:'Titagarh Rail Systems'},
  {symbol:'CDSL.NS',      displaySymbol:'CDSL',      description:'Central Depository Services'},
  {symbol:'BSE.NS',       displaySymbol:'BSE',       description:'BSE Ltd'},
  {symbol:'MCX.NS',       displaySymbol:'MCX',       description:'Multi Commodity Exchange'},
  {symbol:'ANGELONE.NS',  displaySymbol:'ANGELONE',  description:'Angel One Ltd'},
  {symbol:'ICICIPRULI.NS',displaySymbol:'ICICIPRULI',description:'ICICI Prudential Life'},
  {symbol:'CHOLAFIN.NS',  displaySymbol:'CHOLAFIN',  description:'Cholamandalam Investment'},
  {symbol:'MANAPPURAM.NS',displaySymbol:'MANAPPURAM',description:'Manappuram Finance'},
  {symbol:'SHRIRAMFIN.NS',displaySymbol:'SHRIRAMFIN',description:'Shriram Finance Ltd'},
  {symbol:'SUNDARMFIN.NS',displaySymbol:'SUNDARMFIN',description:'Sundaram Finance'},
  {symbol:'PNBHOUSING.NS',displaySymbol:'PNBHOUSING',description:'PNB Housing Finance'},
  {symbol:'LICHSGFIN.NS', displaySymbol:'LICHSGFIN', description:'LIC Housing Finance'},
  {symbol:'PNB.NS',       displaySymbol:'PNB',       description:'Punjab National Bank'},
  {symbol:'BANKBARODA.NS',displaySymbol:'BANKBARODA',description:'Bank of Baroda'},
  {symbol:'CANBK.NS',     displaySymbol:'CANBK',     description:'Canara Bank'},
  {symbol:'UNIONBANK.NS', displaySymbol:'UNIONBANK', description:'Union Bank of India'},
  {symbol:'IDFCFIRSTB.NS',displaySymbol:'IDFCFIRSTB',description:'IDFC First Bank'},
  {symbol:'FEDERALBNK.NS',displaySymbol:'FEDERALBNK',description:'Federal Bank Ltd'},
  {symbol:'INDUSINDBK.NS',displaySymbol:'INDUSINDBK',description:'IndusInd Bank Ltd'},
  {symbol:'RBLBANK.NS',   displaySymbol:'RBLBANK',   description:'RBL Bank Ltd'},
  {symbol:'YESBANK.NS',   displaySymbol:'YESBANK',   description:'Yes Bank Ltd'},
]

const FALLBACK_PRICES = {
  'RELIANCE.NS':   { c: 2847,  d: -40,  dp: -1.38, o: 2887,  h: 2901,  l: 2831,  v: 5200000  },
  'TCS.NS':        { c: 3950,  d:  65,  dp:  1.67, o: 3885,  h: 3970,  l: 3880,  v: 2100000  },
  'HDFCBANK.NS':   { c: 1820,  d: -12,  dp: -0.65, o: 1832,  h: 1845,  l: 1814,  v: 8500000  },
  'INFY.NS':       { c: 1720,  d:  28,  dp:  1.65, o: 1692,  h: 1730,  l: 1688,  v: 3800000  },
  'TATAMOTORS.NS': { c: 842,   d:  18,  dp:  2.19, o: 824,   h: 856,   l: 818,   v: 6800000  },
  'SBIN.NS':       { c: 828,   d: -10,  dp: -1.20, o: 838,   h: 845,   l: 822,   v: 18000000 },
  'ICICIBANK.NS':  { c: 1240,  d:  15,  dp:  1.22, o: 1225,  h: 1252,  l: 1220,  v: 9200000  },
  'WIPRO.NS':      { c: 462,   d:   7,  dp:  1.54, o: 455,   h: 468,   l: 452,   v: 3200000  },
  'HINDUNILVR.NS': { c: 2460,  d: -18,  dp: -0.73, o: 2478,  h: 2490,  l: 2452,  v: 1100000  },
  'KOTAKBANK.NS':  { c: 1880,  d: -22,  dp: -1.16, o: 1902,  h: 1910,  l: 1875,  v: 2800000  },
  'BHARTIARTL.NS': { c: 1812,  d:  24,  dp:  1.34, o: 1788,  h: 1825,  l: 1780,  v: 4100000  },
  'BAJFINANCE.NS': { c: 7200,  d: 120,  dp:  1.69, o: 7080,  h: 7250,  l: 7050,  v: 900000   },
  'MARUTI.NS':     { c: 12800, d: -150, dp: -1.16, o: 12950, h: 12980, l: 12750, v: 450000   },
  'ADANIENT.NS':   { c: 3120,  d:  55,  dp:  1.79, o: 3065,  h: 3145,  l: 3050,  v: 1200000  },
  'SUNPHARMA.NS':  { c: 1720,  d:  32,  dp:  1.90, o: 1688,  h: 1728,  l: 1682,  v: 1800000  },
  'LTIM.NS':       { c: 5620,  d:  80,  dp:  1.44, o: 5540,  h: 5650,  l: 5510,  v: 380000   },
  'ASIANPAINT.NS': { c: 2920,  d: -35,  dp: -1.19, o: 2955,  h: 2968,  l: 2908,  v: 620000   },
  'AXISBANK.NS':   { c: 1180,  d:   8,  dp:  0.68, o: 1172,  h: 1192,  l: 1168,  v: 5600000  },
  'TATASTEEL.NS':  { c: 158,   d:   3,  dp:  1.93, o: 155,   h: 160,   l: 154,   v: 32000000 },
  'HCLTECH.NS':    { c: 1725,  d:  22,  dp:  1.29, o: 1703,  h: 1738,  l: 1698,  v: 2500000  },
}

const LOGO_STYLES = [
  { bg: '#E3F2FD', fg: '#1565C0' },
  { bg: '#FFEBEE', fg: '#C62828' },
  { bg: '#E8F5E9', fg: '#2E7D32' },
  { bg: '#FFF8E1', fg: '#E65100' },
  { bg: '#F3E5F5', fg: '#6A1B9A' },
  { bg: '#E0F2F1', fg: '#00695C' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtINR = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

const fmtVolume = (v) => {
  if (!v) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K'
  return String(v)
}

const getSignalColor = (signal) =>
  SIGNAL_COLORS[signal] ?? '#FF9800'

const parseAISignal = (text) => {
  try {
    const match = (text ?? '').match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no json')
    const p = JSON.parse(match[0])
    if (!SIGNAL_COLORS[p.signal]) p.signal = 'HOLD'
    if (typeof p.confidence !== 'number') p.confidence = 55
    return p
  } catch {
    return { signal: 'HOLD', confidence: 55, trend: 'Neutral', momentum: 'Moderate', volatility: 'Moderate', risk: 'Medium', reason: 'Insufficient data for analysis' }
  }
}

// ── IST market status helpers ──────────────────────────────────────────────────
const getISTTime = () => {
  const now = new Date()
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + (5.5 * 60 * 60 * 1000))
}

const isIndianMarketOpen = () => {
  const ist = getISTTime()
  const day = ist.getDay()
  if (day === 0 || day === 6) return false
  const t = ist.getHours() * 60 + ist.getMinutes()
  return t >= 555 && t <= 930   // 9:15 AM – 3:30 PM
}

const getMarketStatus = () => {
  const ist = getISTTime()
  const day = ist.getDay()
  const t   = ist.getHours() * 60 + ist.getMinutes()

  if (day === 0 || day === 6)
    return { isOpen: false, label: 'Market Closed · Opens Monday 9:15 AM IST', color: '#FF9800' }
  if (t < 540)
    return { isOpen: false, label: 'Market Opens at 9:15 AM IST · Pre-market', color: '#FF9800' }
  if (t < 555)
    return { isOpen: false, label: 'Pre-open Session · Opens at 9:15 AM IST', color: '#FBB040' }
  if (t <= 930)
    return { isOpen: true,  label: 'Market Open · 9:15 AM – 3:30 PM IST',     color: '#4CAF50' }
  if (t <= 960)
    return { isOpen: false, label: 'Post-market Session · Closed',             color: '#FF9800' }
  return   { isOpen: false, label: 'Market Closed · Opens 9:15 AM IST',        color: '#FF9800' }
}

const getCountdownToOpen = () => {
  const ist = getISTTime()
  const day = ist.getDay()
  const t   = ist.getHours() * 60 + ist.getMinutes()

  // Build next open datetime in IST
  const open = new Date(ist)
  open.setSeconds(0, 0)

  if (day === 0) {          // Sunday → Monday
    open.setDate(ist.getDate() + 1)
  } else if (day === 6) {   // Saturday → Monday
    open.setDate(ist.getDate() + 2)
  } else if (t > 930) {     // After close
    if (day === 5) open.setDate(ist.getDate() + 3)  // Friday → Monday
    else           open.setDate(ist.getDate() + 1)
  }
  open.setHours(9, 15, 0, 0)

  const diff = open - ist
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `Opens in ${h}h ${m}m`
}

const getSentiment = (headline) => {
  const h = headline.toLowerCase()
  const pos = ['profit', 'growth', 'record', 'surge', 'rally', 'beat', 'gain', 'strong', 'rise', 'boost']
  const neg = ['loss', 'drop', 'fall', 'crash', 'miss', 'concern', 'decline', 'weak', 'cut', 'risk']
  if (pos.some(w => h.includes(w))) return 'Positive'
  if (neg.some(w => h.includes(w))) return 'Negative'
  return 'Neutral'
}

// ── Shimmer ────────────────────────────────────────────────────────────────────
function Shimmer({ w = '100%', h = 12, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,#F0F0F0 25%,#E8F5E9 50%,#F0F0F0 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite',
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

// ── Confidence Ring ────────────────────────────────────────────────────────────
function ConfidenceRing({ confidence, color, size = 68 }) {
  const [count, setCount] = useState(0)
  const r    = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (count / 100) * circ

  useEffect(() => {
    setCount(0)
    let frame = 0
    const timer = setInterval(() => {
      frame++
      setCount(Math.round((frame / 45) * confidence))
      if (frame >= 45) clearInterval(timer)
    }, 22)
    return () => clearInterval(timer)
  }, [confidence])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: size * 0.20, fontWeight: 800 }}>{count}%</span>
      </div>
    </div>
  )
}

// ── Quantity Modal ─────────────────────────────────────────────────────────────
function QuantityModal({ show, mode, stock, quote, balance, holding, onConfirm, onClose, isTrading }) {
  const [qty, setQty] = useState(1)
  const price  = quote?.c ?? 0
  const total  = parseFloat((qty * price).toFixed(2))
  const isBuy  = mode === 'BUY'
  const maxQty = isBuy ? Math.floor(balance / (price || 1)) : (holding?.quantity ?? 0)
  const canGo  = qty > 0 && price > 0 && (isBuy ? total <= balance : holding && qty <= holding.quantity)

  useEffect(() => { if (show) setQty(1) }, [show])

  if (!show) return null

  const adjQty = (delta) => setQty(q => Math.max(1, Math.min(maxQty || 9999, q + delta)))

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#FFFFFF', borderRadius: '20px 20px 0 0', padding: '20px 16px 44px', animation: 'slideUp 0.28s ease' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <p style={{ color: C.dark, fontSize: 16, fontWeight: 800 }}>
            {isBuy ? '📈' : '📉'} {mode} {stock?.displaySymbol}
          </p>
          <button onClick={onClose} style={{ background: '#F5F5F5', border: 'none', borderRadius: 10, padding: '5px 6px', cursor: 'pointer', display: 'flex' }}>
            <X size={14} color={C.muted} />
          </button>
        </div>

        {/* Balance row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAF8', borderRadius: 12, padding: '10px 14px', marginBottom: 18 }}>
          <div>
            <p style={{ color: C.muted, fontSize: 10, marginBottom: 2 }}>{isBuy ? 'Available Balance' : 'Shares Owned'}</p>
            <p style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>
              {isBuy ? fmtINR(balance) : `${holding?.quantity ?? 0} shares`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: C.muted, fontSize: 10, marginBottom: 2 }}>Price per share</p>
            <p style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>{fmtINR(price)}</p>
          </div>
        </div>

        {/* Qty stepper */}
        <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quantity</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => adjQty(-1)}
            style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F9F5', border: '1px solid #E8F5E9', fontSize: 22, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dark, flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            −
          </button>
          <input
            type="number" min="1" max={maxQty || 9999} value={qty}
            onChange={e => setQty(Math.max(1, Math.min(maxQty || 9999, parseInt(e.target.value) || 1)))}
            style={{ flex: 1, textAlign: 'center', background: '#F5F9F5', border: '1px solid #C8E6C9', borderRadius: 12, padding: '10px 0', color: C.dark, fontSize: 20, fontWeight: 700, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button onClick={() => adjQty(1)}
            style={{ width: 44, height: 44, borderRadius: 12, background: isBuy ? C.green : C.red, border: 'none', fontSize: 22, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            +
          </button>
        </div>

        {/* Quick pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[1, 5, 10, 25].map(n => (
            <button key={n} onClick={() => setQty(Math.min(maxQty || n, n))}
              style={{ flex: 1, background: qty === n ? (isBuy ? '#E8F5E9' : '#FFEBEE') : '#F5F9F5', border: `1px solid ${qty === n ? (isBuy ? '#C8E6C9' : '#FFCDD2') : '#E0E0E0'}`, borderRadius: 10, padding: '7px 0', color: qty === n ? (isBuy ? C.greenDark : C.redDark) : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {n}
            </button>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isBuy ? '#F0FBF0' : '#FFF0F0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: `1px solid ${isBuy ? '#C8E6C9' : '#FFCDD2'}` }}>
          <p style={{ color: C.muted, fontSize: 12 }}>Total Amount</p>
          <p style={{ color: isBuy ? C.greenDark : C.redDark, fontSize: 16, fontWeight: 800 }}>{fmtINR(total)}</p>
        </div>

        {isBuy && total > balance && (
          <p style={{ color: C.red, fontSize: 11, textAlign: 'center', marginBottom: 10 }}>⚠️ Insufficient balance</p>
        )}

        <button
          disabled={!canGo || isTrading}
          onClick={() => canGo && !isTrading && onConfirm(qty)}
          style={{ width: '100%', height: 54, borderRadius: 14, border: 'none', background: isBuy ? 'linear-gradient(135deg,#4CAF50,#43A047)' : 'linear-gradient(135deg,#F44336,#C62828)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: !canGo || isTrading ? 'not-allowed' : 'pointer', opacity: !canGo || isTrading ? 0.5 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: canGo && !isTrading ? (isBuy ? '0 4px 16px rgba(76,175,80,0.35)' : '0 4px 16px rgba(244,67,54,0.35)') : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {isTrading ? (
            <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
          ) : `Confirm ${mode} — ${fmtINR(total)}`}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TradePage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const searchRef     = useRef(null)
  const searchTimeout = useRef(null)

  // ── Stock selection ──────────────────────────────────────────────────────────
  const [selectedStock, setSelectedStock] = useState(() => {
    if (location.state?.symbol) {
      const found = POPULAR_STOCKS.find(
        s => s.symbol === location.state.symbol || s.displaySymbol === location.state.symbol
      )
      if (found) return found
      const ds = location.state.symbol.replace('.NS', '').replace('.BO', '')
      return { symbol: location.state.symbol, displaySymbol: ds, description: location.state.description || ds }
    }
    return POPULAR_STOCKS[0]
  })

  // ── Trading state ────────────────────────────────────────────────────────────
  const [quote,          setQuote]          = useState(null)
  const [tradeMode,      setTradeMode]      = useState(location.state?.mode || 'BUY')
  const [quantity,       setQuantity]       = useState(1)
  const [balance,        setBalance]        = useState(0)
  const [holdings,       setHoldings]       = useState([])
  const [liveQuotes,     setLiveQuotes]     = useState({})
  const [isTrading,      setIsTrading]      = useState(false)
  const [isLoadingQuote, setIsLoadingQuote] = useState(true)
  const [userId,         setUserId]         = useState(null)
  const [pageLoading,    setPageLoading]    = useState(true)

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState([])
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [isSearching,    setIsSearching]    = useState(false)

  // ── New feature state ────────────────────────────────────────────────────────
  const [aiSignal,          setAiSignal]          = useState(null)
  const [isLoadingSignal,   setIsLoadingSignal]   = useState(false)
  const [showModal,         setShowModal]         = useState(false)
  const [activeTab,         setActiveTab]         = useState('Overview')
  const [isWatchlisted,     setIsWatchlisted]     = useState(false)
  const [news,              setNews]              = useState(null)
  const [isLoadingNews,     setIsLoadingNews]     = useState(false)
  const [analysisText,      setAnalysisText]      = useState(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  // ── Chart state ──────────────────────────────────────────────────────────────
  const [chartData,         setChartData]         = useState([])
  const [activePeriod,      setActivePeriod]      = useState('1D')
  const [isLoadingChart,    setIsLoadingChart]    = useState(false)
  const [isGeneratedData,   setIsGeneratedData]   = useState(false)
  const [marketStatus,      setMarketStatus]      = useState(getMarketStatus)
  const [istTime,           setIstTime]           = useState('')
  const refreshIntervalRef = useRef(null)

  // ── CSS injection ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('tb-trade-styles')) return
    const s = document.createElement('style')
    s.id = 'tb-trade-styles'
    s.textContent = `
      @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes spin      { to{transform:rotate(360deg)} }
      @keyframes slideUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
      @keyframes fadeIn    { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
    `
    document.head.appendChild(s)
  }, [])

  // ── Market status — refresh every minute ─────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setMarketStatus(getMarketStatus()), 60000)
    return () => clearInterval(id)
  }, [])

  // ── IST clock — update every 30 seconds ──────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const ist  = getISTTime()
      const h    = ist.getHours()
      const m    = ist.getMinutes().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      setIstTime(`${h % 12 || 12}:${m} ${ampm} IST`)
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  // ── Auto-refresh quote every 30s when market is open ─────────────────────────
  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    if (!selectedStock) return
    if (marketStatus.isOpen) {
      refreshIntervalRef.current = setInterval(() => {
        fetchQuote(selectedStock.displaySymbol, selectedStock)
      }, 15000)
      toast('🔴 Live prices updating every 15s', {
        duration: 2000,
        style: { background: '#E8F5E9', color: '#2E7D32' },
      })
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [selectedStock, marketStatus.isOpen])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login', { replace: true }); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('virtual_balance').eq('id', user.id).single()
      if (profile) setBalance(profile.virtual_balance)
      await loadHoldings(user.id)
      setPageLoading(false)
    }
    init()

    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [navigate])

  // ── Fetch when stock changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStock) return
    setAiSignal(null)
    setQuote(null)
    setChartData([])
    setNews(null)
    setAnalysisText(null)
    setActiveTab('Overview')
    setActivePeriod('1D')
    fetchQuote(selectedStock.displaySymbol, selectedStock)
    fetchChart(selectedStock.displaySymbol, '1D')
  }, [selectedStock])

  // ── Re-fetch chart when period changes ───────────────────────────────────────
  useEffect(() => {
    if (selectedStock && activePeriod) {
      fetchChart(selectedStock.displaySymbol, activePeriod)
    }
  }, [activePeriod])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check if current stock is in watchlist ────────────────────────────────────
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!selectedStock) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles').select('watchlist').eq('id', user.id).single()
        setIsWatchlisted(profile?.watchlist?.includes(selectedStock.displaySymbol) ?? false)
      } catch { /* ignore */ }
    }
    checkWatchlist()
  }, [selectedStock])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check price alerts every time quote updates ───────────────────────────────
  useEffect(() => {
    if (quote?.c && selectedStock && userId) {
      checkAndExecuteAlerts(quote.c, selectedStock.displaySymbol)
    }
  }, [quote?.c])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── loadHoldings — uses Yahoo via edge fn for live P&L ───────────────────────
  const loadHoldings = async (uid) => {
    const { data } = await supabase.from('holdings').select('*').eq('user_id', uid)
    if (!data) return
    setHoldings(data)
    const quotes = {}
    await Promise.allSettled(
      data.map(async (h) => {
        try {
          const sym = h.symbol.replace('.NS', '')
          const { data: qd } = await supabase.functions.invoke('stock-data', {
            body: { symbol: sym, type: 'quote' },
          })
          if (qd?.success && qd.quote?.c > 0) quotes[h.symbol] = qd.quote.c
          else if (FALLBACK_PRICES[h.symbol]) quotes[h.symbol] = FALLBACK_PRICES[h.symbol].c
        } catch {
          if (FALLBACK_PRICES[h.symbol]) quotes[h.symbol] = FALLBACK_PRICES[h.symbol].c
        }
      })
    )
    setLiveQuotes(prev => ({ ...prev, ...quotes }))
  }

  // ── fetchQuote — Google Finance (primary) → Yahoo Finance (fallback) ──────────
  const fetchQuote = async (displaySymbol, stock) => {
    setIsLoadingQuote(true)
    // Strip exchange suffix so edge function always receives a clean symbol
    const cleanSym = displaySymbol.replace(/\.(NS|BO)$/i, '')
    try {
      console.log('[Quote] ▶ Fetching', cleanSym)
      const { data, error: fnErr } = await supabase.functions.invoke('stock-data', {
        body: { symbol: cleanSym, type: 'quote' },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (!data?.success) throw new Error(data?.error ?? 'No quote data')

      const q = data.quote
      console.log('[Quote] ✔', q.c, q.dp + '%', 'src:', q.source)
      setQuote(q)
      setLiveQuotes(prev => ({ ...prev, [stock?.symbol ?? displaySymbol]: q.c }))
      fetchAISignal(stock, q)
    } catch (err) {
      console.error('[Quote] ✖', err.message)
      const fb = FALLBACK_PRICES[stock?.symbol] ?? FALLBACK_PRICES[cleanSym + '.NS']
      if (fb) {
        setQuote({ ...fb, source: 'cached' })
        setLiveQuotes(prev => ({ ...prev, [stock?.symbol ?? displaySymbol]: fb.c }))
        fetchAISignal(stock, fb)
      }
    } finally {
      setIsLoadingQuote(false)
    }
  }

  // ── fetchChart — Yahoo Finance via stock-data edge function ───────────────────
  const fetchChart = async (displaySymbol, period = '1D') => {
    setIsLoadingChart(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('stock-data', {
        body: { symbol: displaySymbol, type: 'chart', period },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (!data?.success || !data.chartData?.length) throw new Error('No chart data')
      setChartData(data.chartData)
      setIsGeneratedData(false)
    } catch (err) {
      console.error('[Chart] ✖', err.message)
      generateFallbackChart()
    } finally {
      setIsLoadingChart(false)
    }
  }

  const generateFallbackChart = () => {
    const base = quote?.c || 1000
    const pts  = Array.from({ length: 30 }, (_, i) => ({
      price: parseFloat((base * (0.94 + Math.random() * 0.12)).toFixed(2)),
      time:  i,
    }))
    pts[pts.length - 1].price = base
    setChartData(pts)
    setIsGeneratedData(true)
  }

  // ── fetchAISignal — uses Supabase Edge Function, NOT direct OpenAI ────────────
  const fetchAISignal = useCallback(async (stock, q) => {
    if (!stock || !q?.c) return
    setIsLoadingSignal(true)
    setAiSignal(null)
    try {
      console.log('[AI Signal] ▶ Fetching for', stock.displaySymbol, 'at', q.c)

      const { data, error: fnErr } = await supabase.functions.invoke('ai-mentor', {
        body: {
          messages: [{
            role: 'user',
            content: `Analyze this Indian stock and give a trading signal:
Stock: ${stock.displaySymbol}
Company: ${stock.description}
Current Price: ₹${q.c}
Today's Change: ${(q.dp ?? 0).toFixed(2)}%
Open: ₹${q.o}
High: ₹${q.h}
Low: ₹${q.l}

Respond ONLY in this exact JSON format, no other text:
{
  "signal": "STRONG BUY",
  "confidence": 87,
  "trend": "Bullish",
  "momentum": "Strong",
  "volatility": "Moderate",
  "risk": "Low",
  "reason": "One line reason max 10 words"
}

Signal must be exactly one of: STRONG BUY, BUY, HOLD, SELL, STRONG SELL`,
          }],
          model: 'gpt-4o-mini',
        },
      })

      if (fnErr) throw new Error(fnErr.message)
      console.log('[AI Signal] ◀ Raw:', data?.message?.slice(0, 120))

      const parsed = parseAISignal(data?.message ?? '')
      setAiSignal(parsed)
      console.log('[AI Signal] ✔', parsed.signal, parsed.confidence + '%')
    } catch (err) {
      console.error('[AI Signal] ✖', err.message)
      setAiSignal({ signal: 'HOLD', confidence: 50, trend: 'Neutral', momentum: 'Moderate', volatility: 'Moderate', risk: 'Medium', reason: 'Could not analyze — try again' })
    } finally {
      setIsLoadingSignal(false)
    }
  }, [])

  // ── fetchNews ─────────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async (symbol) => {
    const sym   = symbol.replace('.NS', '')
    const today = new Date().toISOString().split('T')[0]
    const week  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    setIsLoadingNews(true)
    try {
      const res  = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${week}&to=${today}&token=${FINNHUB_KEY}`)
      const data = await res.json()
      setNews(Array.isArray(data) ? data.slice(0, 10) : [])
    } catch {
      setNews([])
    } finally {
      setIsLoadingNews(false)
    }
  }, [])

  // ── fetchAnalysis ─────────────────────────────────────────────────────────────
  const fetchAnalysis = useCallback(async (stock, q) => {
    if (!stock || !q?.c) return
    setIsLoadingAnalysis(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-mentor', {
        body: {
          messages: [{
            role: 'user',
            content: `Give technical analysis for ${stock.description} (${stock.displaySymbol}) NSE:
Price ₹${q.c}, Change ${(q.dp ?? 0).toFixed(2)}%, High ₹${q.h}, Low ₹${q.l}, Vol ${fmtVolume(q.v)}.
Provide 5 short bullet points covering: trend, support, resistance, RSI estimate, outlook.`,
          }],
          model: 'gpt-4o-mini',
        },
      })
      if (fnErr) throw fnErr
      setAnalysisText(data?.message ?? null)
    } catch {
      setAnalysisText(null)
    } finally {
      setIsLoadingAnalysis(false)
    }
  }, [])

  // ── Tab handler ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'News'     && news         === null) fetchNews(selectedStock.symbol)
    if (tab === 'Analysis' && analysisText === null) fetchAnalysis(selectedStock, quote)
  }

  // ── handleBuy ─────────────────────────────────────────────────────────────────
  const handleBuy = async (qty) => {
    if (qty <= 0)  { toast.error('Invalid quantity!'); return }
    if (!quote?.c) { toast.error('Price unavailable.'); return }
    const price     = quote.c
    const totalCost = parseFloat((qty * price).toFixed(2))
    if (totalCost > balance) { toast.error('Insufficient balance!'); return }
    setIsTrading(true)
    try {
      const newBalance = parseFloat((balance - totalCost).toFixed(2))
      await supabase.from('profiles').update({ virtual_balance: newBalance }).eq('id', userId)
      const existing = holdings.find(h => h.symbol === selectedStock.symbol)
      if (existing) {
        const newQty = existing.quantity + qty
        const newAvg = parseFloat(((existing.quantity * existing.avg_price + qty * price) / newQty).toFixed(2))
        await supabase.from('holdings').update({ quantity: newQty, avg_price: newAvg, total_invested: parseFloat((newQty * newAvg).toFixed(2)), updated_at: new Date().toISOString() }).eq('user_id', userId).eq('symbol', selectedStock.symbol)
      } else {
        await supabase.from('holdings').insert({ user_id: userId, symbol: selectedStock.symbol, company_name: selectedStock.description, quantity: qty, avg_price: price, total_invested: totalCost })
      }
      await supabase.from('trades').insert({ user_id: userId, symbol: selectedStock.symbol, company_name: selectedStock.description, trade_type: 'BUY', quantity: qty, price, total_amount: totalCost })
      setBalance(newBalance)
      await loadHoldings(userId)
      setQuantity(1)
      localStorage.setItem('tb_balance', newBalance.toString())
      localStorage.setItem('tb_balance_updated', Date.now().toString())
      localStorage.setItem('tb_holdings_updated', Date.now().toString())
      localStorage.setItem('last_trade_time', Date.now().toString())
      localStorage.setItem('last_trade_amount', newBalance.toString())
      localStorage.setItem('portfolio_needs_refresh', 'true')
      setShowModal(false)
      await updateLeaderboard()
      toast.success(`✅ ${qty} shares of ${selectedStock.displaySymbol} purchased! ${fmtINR(totalCost)} deducted`)
      setTimeout(() => toast.custom(t => (
        <div style={{ background:'#FFFFFF', border:'1px solid #C8E6C9', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, fontFamily:"'Plus Jakarta Sans',sans-serif", opacity: t.visible?1:0, transition:'opacity 0.2s', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
          <span style={{ color:'#888', fontSize:12 }}>Holdings updated</span>
          <button onClick={() => { toast.dismiss(t.id); navigate('/portfolio') }} style={{ background:'#E8F5E9', border:'1px solid #C8E6C9', borderRadius:8, padding:'4px 10px', color:'#2E7D32', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:'nowrap' }}>View Portfolio →</button>
        </div>
      ), { duration: 4000 }), 1500)
    } catch (err) {
      console.error(err); toast.error('Something went wrong!')
    } finally {
      setIsTrading(false)
    }
  }

  // ── handleSell ────────────────────────────────────────────────────────────────
  const handleSell = async (qty) => {
    if (qty <= 0)  { toast.error('Invalid quantity!'); return }
    if (!quote?.c) { toast.error('Price unavailable.'); return }
    const holding = holdings.find(h => h.symbol === selectedStock.symbol)
    if (!holding)         { toast.error(`You don't own any ${selectedStock.displaySymbol}!`); return }
    if (qty > holding.quantity) { toast.error(`Only ${holding.quantity} shares available!`); return }
    const price      = quote.c
    const saleAmount = parseFloat((qty * price).toFixed(2))
    const pnl        = parseFloat(((price - holding.avg_price) * qty).toFixed(2))
    const newBalance = parseFloat((balance + saleAmount).toFixed(2))
    const remaining  = holding.quantity - qty
    setIsTrading(true)
    try {
      await supabase.from('profiles').update({ virtual_balance: newBalance }).eq('id', userId)
      if (remaining === 0) {
        await supabase.from('holdings').delete().eq('user_id', userId).eq('symbol', selectedStock.symbol)
      } else {
        await supabase.from('holdings').update({ quantity: remaining, total_invested: parseFloat((holding.avg_price * remaining).toFixed(2)), updated_at: new Date().toISOString() }).eq('user_id', userId).eq('symbol', selectedStock.symbol)
      }
      await supabase.from('trades').insert({ user_id: userId, symbol: selectedStock.symbol, company_name: selectedStock.description, trade_type: 'SELL', quantity: qty, price, total_amount: saleAmount, profit_loss: pnl })
      setBalance(newBalance)
      await loadHoldings(userId)
      setQuantity(1)
      localStorage.setItem('tb_balance', newBalance.toString())
      localStorage.setItem('tb_balance_updated', Date.now().toString())
      localStorage.setItem('tb_holdings_updated', Date.now().toString())
      localStorage.setItem('last_trade_time', Date.now().toString())
      localStorage.setItem('last_trade_amount', newBalance.toString())
      localStorage.setItem('portfolio_needs_refresh', 'true')
      setShowModal(false)
      await updateLeaderboard()
      pnl >= 0 ? toast.success(`🎉 Profit! You earned ${fmtINR(pnl)}!`) : toast(`📉 Loss of ${fmtINR(Math.abs(pnl))}`, { icon: '📉' })
      setTimeout(() => toast.custom(t => (
        <div style={{ background:'#FFFFFF', border:'1px solid #C8E6C9', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:t.visible?1:0, transition:'opacity 0.2s', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
          <span style={{ color:'#888', fontSize:12 }}>Portfolio updated</span>
          <button onClick={() => { toast.dismiss(t.id); navigate('/portfolio') }} style={{ background:'#E8F5E9', border:'1px solid #C8E6C9', borderRadius:8, padding:'4px 10px', color:'#2E7D32', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:'nowrap' }}>View Portfolio →</button>
        </div>
      ), { duration: 4000 }), 1500)
    } catch (err) {
      console.error(err); toast.error('Something went wrong!')
    } finally {
      setIsTrading(false)
    }
  }

  // ── Update leaderboard after every trade ─────────────────────────────────────
  const updateLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('virtual_balance, full_name, email').eq('id', user.id).single()

      const { data: allHoldings } = await supabase
        .from('holdings').select('*').eq('user_id', user.id)

      const now     = new Date()
      const monday  = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const weekNum = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))

      const { data: weekTrades } = await supabase
        .from('trades').select('*').eq('user_id', user.id)
        .gte('created_at', monday.toISOString())

      const holdingsValue = (allHoldings ?? []).reduce((sum, h) => sum + (h.avg_price * h.quantity), 0)
      const totalValue    = (profile?.virtual_balance ?? 100000) + holdingsValue
      const weeklyReturn  = Math.round(((totalValue - 100000) / 100000) * 10000) / 100
      const weeklyPnl     = Math.round(totalValue - 100000)

      const bestTrade = (weekTrades ?? [])
        .filter(t => t.trade_type === 'SELL')
        .reduce((best, t) => (!best || (t.profit_loss ?? 0) > (best.profit_loss ?? 0) ? t : best), null)

      await supabase.from('leaderboard').upsert({
        user_id:               user.id,
        full_name:             profile?.full_name || user.email?.split('@')[0] || 'Trader',
        email:                 profile?.email || user.email,
        week_number:           weekNum,
        week_start:            monday.toISOString().split('T')[0],
        week_end:              sunday.toISOString().split('T')[0],
        total_portfolio_value: Math.round(totalValue),
        starting_value:        100000,
        weekly_return_pct:     weeklyReturn,
        weekly_pnl:            weeklyPnl,
        trade_count:           (weekTrades ?? []).length,
        best_trade_symbol:     bestTrade?.symbol?.replace(/\.(NS|BO)$/i, '') ?? null,
        best_trade_pct:        bestTrade?.profit_loss
          ? Math.round((bestTrade.profit_loss / (bestTrade.price * bestTrade.quantity)) * 10000) / 100
          : 0,
        last_updated:          new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false })
    } catch (err) {
      console.error('Leaderboard update error:', err)
    }
  }

  // ── Refresh balance + holdings (called after auto-sell) ──────────────────────
  const fetchUserData = useCallback(async () => {
    if (!userId) return
    await loadHoldings(userId)
    const { data: prof } = await supabase.from('profiles').select('virtual_balance').eq('id', userId).single()
    if (prof) setBalance(prof.virtual_balance)
  }, [userId])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-execute a single alert when price crosses threshold ──────────────────
  const executeAlertSell = async (alert, currentPrice) => {
    try {
      const saleAmount = parseFloat((currentPrice * alert.quantity).toFixed(2))
      const pnl        = parseFloat(((currentPrice - alert.avg_buy_price) * alert.quantity).toFixed(2))

      const { data: prof } = await supabase.from('profiles').select('virtual_balance').eq('id', userId).single()
      const newBalance = parseFloat(((prof?.virtual_balance ?? 0) + saleAmount).toFixed(2))

      await supabase.from('profiles').update({ virtual_balance: newBalance }).eq('id', userId)

      const fullSym  = alert.symbol + '.NS'
      const { data: h } = await supabase.from('holdings').select('*').eq('user_id', userId).eq('symbol', fullSym).maybeSingle()
      if (h) {
        const remaining = h.quantity - alert.quantity
        if (remaining <= 0) await supabase.from('holdings').delete().eq('id', h.id)
        else                await supabase.from('holdings').update({ quantity: remaining, total_invested: parseFloat((h.avg_price * remaining).toFixed(2)), updated_at: new Date().toISOString() }).eq('id', h.id)
      }

      await supabase.from('trades').insert({
        user_id: userId, symbol: fullSym,
        company_name: alert.company_name,
        trade_type: 'SELL', quantity: alert.quantity,
        price: currentPrice, total_amount: saleAmount, profit_loss: pnl,
      })

      await supabase.from('price_alerts').update({
        status: 'triggered', triggered_at: new Date().toISOString(),
        triggered_price: currentPrice, profit_loss: pnl,
      }).eq('id', alert.id)

      if (alert.alert_type === 'stop_loss') {
        toast.error(`🛡️ Stop Loss triggered for ${alert.symbol}!\nSold ${alert.quantity} shares @ ₹${currentPrice}\n${pnl >= 0 ? 'Profit' : 'Loss'}: ₹${Math.abs(pnl).toFixed(0)}`, { duration: 5000 })
      } else {
        toast.success(`🎯 Target hit for ${alert.symbol}!\nSold ${alert.quantity} shares @ ₹${currentPrice}\nProfit: ₹${Math.abs(pnl).toFixed(0)} 🎉`, { duration: 5000 })
      }

      setBalance(newBalance)
      localStorage.setItem('portfolio_needs_refresh', 'true')
      await loadHoldings(userId)
    } catch (err) {
      console.error('[Alert execute] ✖', err.message)
    }
  }

  // ── Check all active alerts for the current symbol ────────────────────────────
  const checkAndExecuteAlerts = async (currentPrice, symbol) => {
    try {
      const { data: alerts } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .eq('status', 'active')

      if (!alerts?.length) return
      for (const alert of alerts) {
        const triggered =
          (alert.alert_type === 'stop_loss' && currentPrice <= alert.trigger_price) ||
          (alert.alert_type === 'target'    && currentPrice >= alert.trigger_price)
        if (triggered) await executeAlertSell(alert, currentPrice)
      }
    } catch (err) {
      console.error('[Alert check] ✖', err.message)
    }
  }

  // ── Search handlers ───────────────────────────────────────────────────────────
  const searchStocks = useCallback(async (query) => {
    const q = query.trim()
    if (!q) {
      setSearchResults(POPULAR_STOCKS.slice(0, 8))
      setShowDropdown(true)
      setIsSearching(false)
      return
    }
    // Instant local filter shown immediately
    const lower = q.toLowerCase()
    const local = POPULAR_STOCKS.filter(s =>
      s.displaySymbol.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower)
    ).slice(0, 4)
    setSearchResults(local)
    setShowDropdown(true)

    // Live search via edge function (Google Finance / Yahoo Finance)
    setIsSearching(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('stock-data', {
        body: { type: 'search', query: q },
      })
      if (!fnErr && data?.success && data.results?.length > 0) {
        const apiSyms = new Set(data.results.map(r => r.displaySymbol))
        const merged  = [
          ...data.results,
          ...local.filter(l => !apiSyms.has(l.displaySymbol)),
        ].slice(0, 8)
        setSearchResults(merged)
      }
    } catch { /* keep local results */ }
    finally { setIsSearching(false) }
  }, [])

  const handleSearchInput = (val) => {
    setSearchQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!val.trim()) {
      setSearchResults(POPULAR_STOCKS.slice(0, 8))
      setShowDropdown(true)
      setIsSearching(false)
      return
    }
    // Show local results immediately, then debounce API call
    const lower = val.trim().toLowerCase()
    const local = POPULAR_STOCKS.filter(s =>
      s.displaySymbol.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower)
    ).slice(0, 8)
    setSearchResults(local)
    setShowDropdown(true)
    searchTimeout.current = setTimeout(() => searchStocks(val), 300)
  }

  const selectStock = (stock) => {
    setSelectedStock(stock); setSearchQuery(''); setShowDropdown(false); setQuantity(1)
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const isUp      = (quote?.dp ?? 0) >= 0
  const holding   = holdings.find(h => h.symbol === selectedStock?.symbol)
  const stockIdx  = POPULAR_STOCKS.findIndex(s => s.symbol === selectedStock?.symbol)
  const logoStyle = LOGO_STYLES[Math.max(stockIdx, 0) % LOGO_STYLES.length]

  if (pageLoading) return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E8F5E9', borderTopColor: C.green, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, paddingBottom: 130 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #EBF5EB', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', gap: 10 }}>
          <button onClick={() => navigate('/home')} style={{ background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: 10, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronLeft size={16} color={C.dark} />
          </button>
          <p style={{ flex: 1, textAlign: 'center', color: C.dark, fontSize: 15, fontWeight: 700 }}>Trade</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <div style={{ background: C.greenBg, border: '1px solid #C8E6C9', borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ color: C.greenDark, fontSize: 10, fontWeight: 700 }}>{fmtINR(balance)}</span>
              </div>
              {istTime && (
                <span style={{ color: marketStatus.isOpen ? C.green : '#888', fontSize: 9, fontWeight: 600 }}>
                  {istTime} {marketStatus.isOpen ? '🟢' : '🔴'}
                </span>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  const { data: profile }  = await supabase
                    .from('profiles').select('watchlist').eq('id', user.id).single()
                  const current = profile?.watchlist ?? []
                  const sym     = selectedStock?.displaySymbol
                  if (!sym) return
                  if (current.includes(sym)) {
                    await supabase.from('profiles').update({ watchlist: current.filter(s => s !== sym) }).eq('id', user.id)
                    setIsWatchlisted(false)
                    toast('Removed from watchlist')
                  } else {
                    await supabase.from('profiles').update({ watchlist: [...current, sym] }).eq('id', user.id)
                    setIsWatchlisted(true)
                    toast.success(`${sym} added to watchlist ⭐`)
                  }
                } catch { toast.error('Could not update watchlist') }
              }}
              style={{ background: isWatchlisted ? '#FFF8E1' : '#F5F9F5', border: `1px solid ${isWatchlisted ? '#FFE082' : '#E8F5E9'}`, borderRadius: 10, padding: '5px 6px', cursor: 'pointer', display: 'flex' }}
            >
              <Star size={14} color={isWatchlisted ? '#FBB040' : C.muted} fill={isWatchlisted ? '#FBB040' : 'none'} />
            </button>
            <button style={{ background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: 10, padding: '5px 6px', cursor: 'pointer', display: 'flex' }}>
              <Bell size={14} color={C.muted} />
            </button>
          </div>
        </div>

        {/* ── SEARCH ──────────────────────────────────────────────────────────── */}
        <div ref={searchRef} style={{ padding: '10px 12px', borderBottom: '1px solid #F0F0F0', position: 'relative', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F9F5', border: `1px solid ${searchFocused ? '#4CAF50' : '#E0EDE0'}`, borderRadius: 14, padding: '10px 14px', gap: 8, transition: 'border-color 0.2s' }}>
            <Search size={14} color={C.muted} style={{ flexShrink: 0 }} />
            <input
              type="text" value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              onFocus={() => {
                setSearchFocused(true)
                if (!searchQuery.trim()) {
                  setSearchResults(POPULAR_STOCKS.slice(0, 8))
                  setShowDropdown(true)
                }
              }}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search any NSE stock… TCS, BEL, RELIANCE"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.dark, fontSize: 11, fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            />
            {isSearching && (
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #E8F5E9', borderTopColor: C.green, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            )}
            {searchQuery && !isSearching && (
              <button onClick={() => { setSearchQuery(''); setShowDropdown(false); setIsSearching(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={14} color={C.muted} />
              </button>
            )}
          </div>
          {showDropdown && (searchResults.length > 0 || isSearching) && (
            <div style={{ position: 'absolute', top: 'calc(100% - 2px)', left: 12, right: 12, background: '#FFFFFF', border: '1px solid #E8F5E9', borderRadius: 14, maxHeight: 280, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 4px' }}>
                <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : 'Popular Stocks'}
                </p>
                {isSearching && <span style={{ color: C.green, fontSize: 9, fontWeight: 600 }}>Searching…</span>}
              </div>
              {searchResults.map((r, i) => {
                const ls      = LOGO_STYLES[i % LOGO_STYLES.length]
                const initials = (r.displaySymbol ?? r.symbol.replace('.NS','')).slice(0, 2).toUpperCase()
                return (
                  <div key={r.symbol} onClick={() => selectStock(r)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < searchResults.length - 1 ? '1px solid #F5F5F5' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FBF0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: ls.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ls.fg, fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
                      <div>
                        <p style={{ color: C.dark, fontSize: 13, fontWeight: 700, marginBottom: 1 }}>{r.displaySymbol}</p>
                        <p style={{ color: C.muted, fontSize: 10 }}>{r.description}</p>
                      </div>
                    </div>
                    <span style={{ background: '#E8F5E9', color: C.greenDark, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
                      {r.exchange ?? 'NSE'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── STOCK INFO ──────────────────────────────────────────────────────── */}
        <div style={{ margin: '12px 12px 0', background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: '14px 14px 12px', boxShadow: '0 2px 12px rgba(76,175,80,0.06)' }}>

          {/* Logo + name + market status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: logoStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: logoStyle.fg, fontWeight: 800, fontSize: 12, flexShrink: 0, boxShadow: `0 2px 8px ${logoStyle.bg}` }}>
                {selectedStock.displaySymbol?.slice(0, 2).toUpperCase() ?? selectedStock.symbol.slice(0, 2)}
              </div>
              <div>
                <p style={{ color: C.dark, fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{selectedStock.description}</p>
                <p style={{ color: C.muted, fontSize: 10 }}>{selectedStock.displaySymbol} · NSE</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: marketStatus.color, animation: marketStatus.isOpen ? 'pulse-dot 1.5s infinite' : 'none' }} />
                  <span style={{ color: marketStatus.color, fontSize: 10, fontWeight: 600 }}>{marketStatus.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price + change */}
          <div style={{ marginBottom: 14 }}>
            {isLoadingQuote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Shimmer w={140} h={44} radius={8} />
                <Shimmer w={100} h={22} radius={20} />
              </div>
            ) : quote ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <p style={{ color: C.dark, fontSize: 42, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>
                    {fmtINR(quote.c)}
                  </p>
                  {marketStatus.isOpen && (
                    <div style={{ background: '#E8F5E9', border: '1px solid #4CAF50', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', animation: 'pulse-dot 1s infinite' }} />
                      <span style={{ color: '#2E7D32', fontSize: 9, fontWeight: 800 }}>LIVE</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: isUp ? '#E8F5E9' : '#FFEBEE', color: isUp ? C.greenDark : C.redDark, border: `1px solid ${isUp ? '#C8E6C9' : '#FFCDD2'}`, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {isUp ? '▲' : '▼'} {isUp ? '+' : ''}₹{Math.abs(quote.d ?? 0).toFixed(0)} ({isUp ? '+' : ''}{(quote.dp ?? 0).toFixed(2)}%)
                  </span>
                  {quote?.source && (
                    <span style={{ background: '#F0F9F0', border: '1px solid #C8E6C9', borderRadius: 4, padding: '1px 6px', color: '#2E7D32', fontSize: 8, fontWeight: 700 }}>
                      {quote.source === 'google' ? '📊 Google Finance'
                        : quote.source === 'yahoo' ? '📈 Yahoo Finance'
                        : '💾 Cached'}
                    </span>
                  )}
                </div>
                {!marketStatus.isOpen && (
                  <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '6px 10px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12 }}>⏰</span>
                    <span style={{ color: '#E65100', fontSize: 10, fontWeight: 700 }}>{getCountdownToOpen() || 'Market Closed'}</span>
                    <span style={{ color: '#888', fontSize: 10, marginLeft: 'auto' }}>Last: {fmtINR(quote.c)}</span>
                  </div>
                )}
              </>
            ) : <p style={{ color: C.muted }}>No data</p>}
          </div>

          {/* High / Low / Vol */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'High',   value: quote ? fmtINR(quote.h) : '—', color: C.green },
              { label: 'Low',    value: quote ? fmtINR(quote.l) : '—', color: C.red   },
              { label: 'Volume', value: quote ? fmtVolume(quote.v) : '—', color: C.dark },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#F8FFF8', border: '1px solid #E8F5E9', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
                {isLoadingQuote ? <Shimmer h={10} /> : <p style={{ color: stat.color, fontSize: 11, fontWeight: 700 }}>{stat.value}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ── CHART SECTION ───────────────────────────────────────────────────── */}
        <div style={{ margin: '10px 12px 0', background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: '12px 14px 10px' }}>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {['1D', '1W', '1M', '3M', '1Y'].map(p => (
              <button key={p} onClick={() => setActivePeriod(p)}
                style={{ padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', background: activePeriod === p ? C.green : '#F0F9F0', color: activePeriod === p ? '#fff' : C.muted, fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.2s' }}>
                {p}
              </button>
            ))}
          </div>

          {/* OHLC bar */}
          <div style={{ display: 'flex', gap: 14, fontSize: 11, marginBottom: 10 }}>
            {quote ? (
              <>
                <span><span style={{ color: C.muted }}>O </span><span style={{ color: C.dark, fontWeight: 700 }}>{fmtINR(quote.o)}</span></span>
                <span><span style={{ color: C.muted }}>H </span><span style={{ color: C.green, fontWeight: 700 }}>{fmtINR(quote.h)}</span></span>
                <span><span style={{ color: C.muted }}>L </span><span style={{ color: C.red, fontWeight: 700 }}>{fmtINR(quote.l)}</span></span>
                <span><span style={{ color: C.muted }}>C </span><span style={{ color: '#1565C0', fontWeight: 700 }}>{fmtINR(quote.c)}</span></span>
              </>
            ) : <Shimmer w={200} h={10} />}
          </div>

          {/* recharts area chart */}
          {isLoadingChart ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #E8F5E9', borderTopColor: C.green, animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: C.muted, fontSize: 12 }}>Loading chart...</span>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={isUp ? C.green : C.red} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={isUp ? C.green : C.red} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div style={{ background: '#1A1A2E', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#fff', border: 'none' }}>
                          {fmtINR(payload[0].value)}
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="price"
                    stroke={isUp ? C.green : C.red} strokeWidth={2}
                    fill="url(#chartGrad)" dot={false}
                    activeDot={{ r: 4, fill: isUp ? C.green : C.red, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {isGeneratedData && (
                <div style={{ textAlign: 'center', color: '#888', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>
                  {marketStatus.isOpen ? 'Fetching live data...' : 'Showing simulated data · Market closed'}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: C.muted, fontSize: 12 }}>No chart data</span>
            </div>
          )}
        </div>

        {/* ── AI SIGNAL CARD ──────────────────────────────────────────────────── */}
        <div style={{ margin: '10px 12px 0', background: C.signalBg, borderRadius: 16, padding: 16, boxShadow: '0 4px 24px rgba(15,22,40,0.3)', animation: aiSignal ? 'fadeIn 0.4s ease' : undefined }}>

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Signal</span>
              <Info size={11} color="rgba(255,255,255,0.35)" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>GPT-4o-mini</span>
          </div>

          {isLoadingSignal ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: C.green, animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Analyzing with AI...</span>
            </div>
          ) : aiSignal ? (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>

                {/* Left: signal + ring */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 72 }}>
                  <p style={{ color: getSignalColor(aiSignal.signal), fontSize: 13, fontWeight: 900, textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                    {aiSignal.signal}
                  </p>
                  <ConfidenceRing confidence={aiSignal.confidence} color={getSignalColor(aiSignal.signal)} size={68} />
                </div>

                {/* Middle: metrics */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    ['Trend',      aiSignal.trend,      aiSignal.trend === 'Bullish' ? C.strongBuy : aiSignal.trend === 'Bearish' ? C.red : C.muted],
                    ['Momentum',   aiSignal.momentum,   aiSignal.momentum === 'Strong' ? C.green : aiSignal.momentum === 'Weak' ? C.red : '#FF9800'],
                    ['Volatility', aiSignal.volatility, aiSignal.volatility === 'Low' ? C.green : aiSignal.volatility === 'High' ? C.red : '#FF9800'],
                    ['Risk',       aiSignal.risk,       aiSignal.risk === 'Low' ? C.green : aiSignal.risk === 'High' ? C.red : '#FF9800'],
                  ].map(([label, val, col]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{label}</span>
                      <span style={{ color: col, fontSize: 10, fontWeight: 700 }}>{val} ›</span>
                    </div>
                  ))}
                </div>

                {/* Right: targets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 70 }}>
                  {[
                    ['T1', (quote?.c * 1.03)],
                    ['T2', (quote?.c * 1.06)],
                    ['T3', (quote?.c * 1.12)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, marginBottom: 1 }}>{label}</p>
                      <p style={{ color: C.strongBuy, fontSize: 10, fontWeight: 800 }}>₹{Number((val ?? 0).toFixed(0)).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, marginBottom: 1 }}>Stop Loss</p>
                    <p style={{ color: C.red, fontSize: 10, fontWeight: 800 }}>₹{Number(((quote?.c ?? 0) * 0.95).toFixed(0)).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Reason pill */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11 }}>💡</span>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 1.4, flex: 1 }}>{aiSignal.reason} — <em>Educational only</em></p>
                <button onClick={() => fetchAISignal(selectedStock, quote)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <RefreshCw size={12} color="rgba(255,255,255,0.3)" />
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 10 }}>Could not load AI signal</p>
              <button onClick={() => fetchAISignal(selectedStock, quote)} style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 20, padding: '6px 16px', color: C.green, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Retry Analysis
              </button>
            </div>
          )}
        </div>

        {/* ── TABS ────────────────────────────────────────────────────────────── */}
        <div style={{ margin: '10px 12px 0', background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                style={{ flex: 1, padding: '11px 4px', border: 'none', background: 'transparent', borderBottom: activeTab === tab ? `2px solid ${C.green}` : '2px solid transparent', color: activeTab === tab ? C.greenDark : C.muted, fontSize: 10, fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.2s' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 14 }}>

            {/* ── OVERVIEW ── */}
            {activeTab === 'Overview' && (
              <div>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Stock Details</p>
                {[
                  ['Company',      selectedStock.description],
                  ['Symbol',       `${selectedStock.displaySymbol} (NSE)`],
                  ['Sector',       'Equity'],
                  ['Open Price',   quote ? fmtINR(quote.o) : '—'],
                  ['Day High',     quote ? fmtINR(quote.h) : '—'],
                  ['Day Low',      quote ? fmtINR(quote.l) : '—'],
                  ['Volume',       quote ? fmtVolume(quote.v) : '—'],
                  ['Your Holdings', holding ? `${holding.quantity} shares @ ${fmtINR(holding.avg_price)}` : 'None'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, borderBottom: '1px solid #F5F5F5', marginBottom: 9 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
                    <span style={{ color: C.dark, fontSize: 11, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── NEWS ── */}
            {activeTab === 'News' && (
              <div>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>News & Sentiment</p>
                {isLoadingNews ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Shimmer h={12} /><Shimmer w="70%" h={10} /></div>)}
                  </div>
                ) : !news || news.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>📰</p>
                    <p style={{ color: C.muted, fontSize: 12 }}>No recent news found</p>
                  </div>
                ) : news.map((article, i) => {
                  const sentiment = getSentiment(article.headline)
                  const sColor = sentiment === 'Positive' ? C.greenDark : sentiment === 'Negative' ? C.redDark : C.muted
                  const sBg    = sentiment === 'Positive' ? '#E8F5E9' : sentiment === 'Negative' ? '#FFEBEE' : '#F5F5F5'
                  const sEmoji = sentiment === 'Positive' ? '😊' : sentiment === 'Negative' ? '😟' : '😐'
                  return (
                    <div key={i} style={{ paddingBottom: 12, borderBottom: i < news.length - 1 ? '1px solid #F0F0F0' : 'none', marginBottom: 12 }}>
                      <p style={{ color: C.dark, fontSize: 12, fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>{article.headline}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ background: sBg, color: sColor, border: `1px solid ${sBg}`, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{sEmoji} {sentiment}</span>
                        <span style={{ color: C.muted, fontSize: 9 }}>{article.source} · {new Date(article.datetime * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ANALYSIS ── */}
            {activeTab === 'Analysis' && (
              <div>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Technical Analysis</p>
                {isLoadingAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} w={i % 2 === 0 ? '80%' : '100%'} h={11} />)}
                  </div>
                ) : analysisText ? (
                  <div style={{ background: '#F8FAF8', borderRadius: 12, padding: 12 }}>
                    {analysisText.split('\n').filter(l => l.trim()).map((line, i) => (
                      <p key={i} style={{ color: C.dark, fontSize: 12, lineHeight: 1.7, marginBottom: 4 }}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Analysis not loaded</p>
                    <button onClick={() => fetchAnalysis(selectedStock, quote)} style={{ background: C.greenBg, border: `1px solid #C8E6C9`, borderRadius: 20, padding: '6px 16px', color: C.greenDark, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      Generate Analysis
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── FINANCIALS ── */}
            {activeTab === 'Financials' && (
              <div>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Key Metrics</p>
                {[
                  ['Current Price',  quote ? fmtINR(quote.c) : '—'],
                  ['Day Change',     quote ? `${(quote.dp ?? 0) >= 0 ? '+' : ''}${(quote.dp ?? 0).toFixed(2)}%` : '—'],
                  ['Day Range',      quote ? `${fmtINR(quote.l)} – ${fmtINR(quote.h)}` : '—'],
                  ['Day Volume',     quote ? fmtVolume(quote.v) : '—'],
                  ['Prev Close',     quote ? fmtINR(quote.pc ?? quote.o) : '—'],
                  ['Exchange',       'NSE (National Stock Exchange)'],
                  ['Currency',       'Indian Rupee (₹ INR)'],
                  ['Market Hours',   '9:15 AM – 3:30 PM IST'],
                  ['Settlement',     'T+1 Rolling Settlement'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, borderBottom: '1px solid #F5F5F5', marginBottom: 9 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
                    <span style={{ color: C.dark, fontSize: 11, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── STOP LOSS & TARGET PANEL ────────────────────────────────────────── */}
        <StopLossPanel
          selectedStock={selectedStock}
          quote={quote}
          holdings={holdings}
          balance={balance}
          onTradeExecuted={fetchUserData}
        />

        {/* ── MY HOLDINGS ─────────────────────────────────────────────────────── */}
        {holdings.length > 0 && (
          <div style={{ padding: '14px 12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: C.dark, fontSize: 12, fontWeight: 700 }}>My Holdings</p>
              <button onClick={() => navigate('/portfolio')} style={{ color: C.green, fontSize: 9, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
            </div>
            {holdings.map((h, idx) => {
              const livePrice  = liveQuotes[h.symbol] ?? h.avg_price
              const currentVal = parseFloat((h.quantity * livePrice).toFixed(2))
              const pnl        = parseFloat((currentVal - h.total_invested).toFixed(2))
              const pnlPct     = h.total_invested > 0 ? ((pnl / h.total_invested) * 100).toFixed(2) : '0.00'
              const isProfit   = pnl >= 0
              const ls = LOGO_STYLES[idx % LOGO_STYLES.length]
              return (
                <div key={h.symbol}
                  onClick={() => {
                    const stock = POPULAR_STOCKS.find(s => s.symbol === h.symbol)
                    const ds    = h.symbol.replace('.NS', '').replace('.BO', '')
                    setSelectedStock(stock ?? { symbol: h.symbol, displaySymbol: ds, description: h.company_name ?? ds })
                    setQuantity(1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid #F0F0F0', borderRadius: 16, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#C8E6C9')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F0F0')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: ls.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ls.fg, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{h.symbol.slice(0, 2)}</div>
                      <p style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>{h.symbol.replace('.NS', '')}</p>
                    </div>
                    <p style={{ color: C.dark, fontSize: 11, fontWeight: 700 }}>{fmtINR(currentVal)}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: C.muted, fontSize: 9 }}>{h.quantity} shares · Avg {fmtINR(h.avg_price)}</p>
                    <span style={{ background: isProfit ? C.greenBg : C.redBg, color: isProfit ? C.greenDark : C.redDark, border: `1px solid ${isProfit ? '#C8E6C9' : '#FFCDD2'}`, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
                      {isProfit ? '+' : ''}{fmtINR(Math.abs(pnl))} ({isProfit ? '+' : ''}{pnlPct}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* ── BUY / SELL SPLIT BUTTON (fixed, above nav) ──────────────────────── */}
      <div style={{ position: 'fixed', bottom: 56, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, display: 'flex', zIndex: 90, boxShadow: '0 -2px 16px rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => { setTradeMode('BUY'); setShowModal(true) }}
          disabled={!quote?.c}
          style={{ flex: 1, height: 56, background: quote?.c ? 'linear-gradient(135deg,#4CAF50,#43A047)' : '#A5D6A7', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: quote?.c ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          ↗ BUY {quote?.c ? fmtINR(quote.c) : ''}
        </button>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <button
          onClick={() => { setTradeMode('SELL'); setShowModal(true) }}
          disabled={!quote?.c}
          style={{ flex: 1, height: 56, background: quote?.c ? 'linear-gradient(135deg,#F44336,#C62828)' : '#EF9A9A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: quote?.c ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          ↘ SELL {quote?.c ? fmtINR(quote.c) : ''}
        </button>
      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#FFFFFF', borderTop: '1px solid #EBF5EB', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      onClick={() => navigate('/home')}      />
        <NavItem icon={TrendingUp}    label="Trade"     active                                 />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyIcon size={22} color="#AAAAAA" />
          <span style={{ color: '#AAAAAA', fontSize: 9, fontWeight: 500 }}>League</span>
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor" onClick={() => navigate('/ai-mentor')} />
        <NavItem icon={User}          label="Profile"   onClick={() => navigate('/profile')}   />
      </div>

      {/* ── QUANTITY MODAL ──────────────────────────────────────────────────────── */}
      <QuantityModal
        show={showModal}
        mode={tradeMode}
        stock={selectedStock}
        quote={quote}
        balance={balance}
        holding={holding}
        onConfirm={qty => { setQuantity(qty); tradeMode === 'BUY' ? handleBuy(qty) : handleSell(qty) }}
        onClose={() => setShowModal(false)}
        isTrading={isTrading}
      />
    </div>
  )
}
