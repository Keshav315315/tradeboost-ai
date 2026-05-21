import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { SECTIONS } from '../data/sections'
import { LESSONS_ENHANCED } from '../data/lessonsEnhanced'
import useSpeech from '../hooks/useSpeech'
import VoicePlayer from '../components/VoicePlayer'
import HighlightedContent from '../components/HighlightedContent'

const C = {
  bg:        '#F8FAF8',
  card:      '#FFFFFF',
  border:    '#E8F5E9',
  green:     '#4CAF50',
  greenDark: '#2E7D32',
  greenBg:   '#E8F5E9',
  red:       '#E53935',
  redBg:     '#FFEBEE',
  dark:      '#1A1A1A',
  muted:     '#888888',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// ── Key financial terms highlighted in lesson text ────────────────────────────
const KEY_TERMS = [
  'NSE', 'BSE', 'IPO', 'Demat', 'Nifty', 'Sensex', 'RSI', 'MACD', 'EMA', 'SMA',
  'Stop Loss', 'Bull', 'Bear', 'Intraday', 'Swing', 'Breakout', 'Support',
  'Resistance', 'Portfolio', 'Dividend', 'Market Cap', 'PE Ratio',
  'Overbought', 'Oversold', 'SEBI', 'FII', 'DII', 'F&O', 'Futures', 'Options',
  'OHLC', 'Doji', 'Hammer', 'Marubozu', 'T+1', 'GMP', 'DRHP',
]

function highlightKeyTerms(text) {
  if (!text) return text
  const pattern = KEY_TERMS
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    KEY_TERMS.includes(part)
      ? (
        <span key={i} style={{
          background: '#E8F5E9', color: '#1B6B1B', borderRadius: 4,
          padding: '1px 5px', fontSize: '0.95em', fontWeight: 700,
          border: '1px solid #C8E6C9', display: 'inline', whiteSpace: 'nowrap',
        }}>{part}</span>
      )
      : part
  )
}

// ── Convert enhanced blocks to plain text for TTS ─────────────────────────────
function blocksToSpeechText(blocks) {
  return blocks.map(b => {
    switch (b.type) {
      case 'intro':            return `${b.title}. ${b.subtitle}`
      case 'paragraph':        return b.text
      case 'steps':            return `${b.title}. ${b.steps.map(s => s.text).join('. ')}`
      case 'bullets':          return `${b.title}. ${b.items.join('. ')}`
      case 'example':          return `${b.label}. ${b.lines.join('. ')}`
      case 'takeaway':         return `Key takeaway. ${b.text}`
      case 'warning':          return `Important warning. ${b.text}`
      case 'formula':          return `${b.title}. Formula: ${b.formula}. ${b.legend ?? ''}`
      case 'visual_comparison':
        return `${b.title}. ${b.left.label}: ${b.left.points.join(', ')}. ${b.right.label}: ${b.right.points.join(', ')}.`
      case 'rsi_visual':
        return `${b.title}. ${b.zones.map(z => `${z.label}: ${z.desc}`).join('. ')}`
      case 'candlestick_visual':
        return `${b.title}. ${b.candles.map(c => c.label.replace('\n', ' ')).join('. ')}`
      default:                 return ''
    }
  }).filter(Boolean).join(' ')
}

// ── SVG Candlestick ───────────────────────────────────────────────────────────
function CandlestickSVG({ candles }) {
  const W = 280
  const H = 170
  const PAD_V = 20
  const allPrices = candles.flatMap(c => [c.open, c.high, c.low, c.close])
  const minP = Math.min(...allPrices)
  const maxP = Math.max(...allPrices)
  const range = maxP - minP || 1
  const toY = p => PAD_V + ((maxP - p) / range) * (H - PAD_V * 2)
  const slotW = W / candles.length
  const bodyW = slotW * 0.38

  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {candles.map((c, i) => {
        const cx   = slotW * i + slotW / 2
        const topBody    = toY(Math.max(c.open, c.close))
        const bottomBody = toY(Math.min(c.open, c.close))
        const bodyH      = Math.max(bottomBody - topBody, 3)
        return (
          <g key={i}>
            {/* Wick */}
            <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={c.color} strokeWidth={1.5} />
            {/* Body */}
            <rect x={cx - bodyW / 2} y={topBody} width={bodyW} height={bodyH} rx={2} fill={c.color} />
            {/* Price labels */}
            <text x={cx + bodyW / 2 + 4} y={toY(c.high) + 4}   fontSize={9} fill="#888">H: {c.high}</text>
            <text x={cx + bodyW / 2 + 4} y={toY(c.low)  + 4}   fontSize={9} fill="#888">L: {c.low}</text>
            <text x={cx - bodyW / 2 - 4} y={toY(c.open) + 4}   fontSize={9} fill="#555" textAnchor="end">O: {c.open}</text>
            <text x={cx - bodyW / 2 - 4} y={toY(c.close) + 4}  fontSize={9} fill="#555" textAnchor="end">C: {c.close}</text>
            {/* Caption */}
            {c.label && (
              <text
                x={cx} y={H - 2} textAnchor="middle" fontSize={9}
                fill={c.color} fontWeight="700"
                style={{ whiteSpace: 'pre' }}
              >
                {c.label.split('\n')[0]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Single block renderer ─────────────────────────────────────────────────────
function renderBlock(block, idx) {
  switch (block.type) {

    case 'intro':
      return (
        <div key={idx} style={{ textAlign: 'center', padding: '20px 0 10px', marginBottom: 8 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.greenBg, border: '2px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(76,175,80,0.15)' }}>
            {block.emoji}
          </div>
          <p style={{ color: C.dark, fontSize: 18, fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>{block.title}</p>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>{block.subtitle}</p>
        </div>
      )

    case 'paragraph':
      return (
        <div key={idx} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#333', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
            {highlightKeyTerms(block.text)}
          </p>
        </div>
      )

    case 'visual_comparison':
      return (
        <div key={idx} style={{ marginBottom: 12 }}>
          <p style={{ color: C.dark, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, textAlign: 'center' }}>{block.title}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[block.left, block.right].map((side, si) => (
              <div key={si} style={{ flex: 1, background: side.bg, border: `1.5px solid ${side.color}22`, borderRadius: 14, padding: '12px 10px' }}>
                <div style={{ background: side.color, color: '#fff', borderRadius: 8, padding: '3px 10px', display: 'inline-block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{side.label}</div>
                <p style={{ color: side.color, fontSize: 9.5, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>{side.full}</p>
                {side.points.map((pt, pi) => (
                  <div key={pi} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
                    <span style={{ color: side.color, fontSize: 9, flexShrink: 0, marginTop: 2 }}>●</span>
                    <span style={{ color: '#444', fontSize: 11, lineHeight: 1.4 }}>{pt}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    case 'steps':
      return (
        <div key={idx} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ color: C.dark, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>{block.title}</p>
          {block.steps.map((s, si) => (
            <div key={si} style={{ display: 'flex', gap: 10, marginBottom: si < block.steps.length - 1 ? 12 : 0, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>{s.num}</span>
              </div>
              {si < block.steps.length - 1 && (
                <div style={{ position: 'absolute', width: 2, height: 12, background: '#C8E6C9', left: 41, marginTop: 24, borderRadius: 2 }} />
              )}
              <p style={{ color: '#333', fontSize: 12.5, lineHeight: 1.6, flex: 1, margin: 0 }}>
                {highlightKeyTerms(s.text)}
              </p>
            </div>
          ))}
        </div>
      )

    case 'example':
      return (
        <div key={idx} style={{ background: '#F7FBF7', border: '1px solid #C8E6C9', borderLeft: '4px solid #4CAF50', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: C.green, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{block.ticker}</span>
            <span style={{ color: C.greenDark, fontSize: 11, fontWeight: 700 }}>{block.label}</span>
          </div>
          {block.lines.map((ln, li) => (
            <div key={li} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
              <span style={{ color: C.green, fontSize: 10, flexShrink: 0, marginTop: 3 }}>→</span>
              <span style={{ color: '#2E3A2E', fontSize: 12.5, lineHeight: 1.55, fontFamily: "'Plus Jakarta Sans', monospace" }}>
                {highlightKeyTerms(ln)}
              </span>
            </div>
          ))}
        </div>
      )

    case 'bullets':
      return (
        <div key={idx} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ color: C.dark, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{block.title}</p>
          {block.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: C.green, fontSize: 14, flexShrink: 0, marginTop: -1, fontWeight: 900 }}>•</span>
              <span style={{ color: '#333', fontSize: 12.5, lineHeight: 1.55 }}>
                {highlightKeyTerms(item)}
              </span>
            </div>
          ))}
        </div>
      )

    case 'takeaway':
      return (
        <div key={idx} style={{ background: '#F0FBF0', border: '1px solid #C8E6C9', borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ color: C.greenDark, fontSize: 11, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key Takeaway</p>
            <p style={{ color: '#2E7D32', fontSize: 12.5, lineHeight: 1.65, margin: 0 }}>
              {highlightKeyTerms(block.text)}
            </p>
          </div>
        </div>
      )

    case 'warning':
      return (
        <div key={idx} style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderLeft: '4px solid #F57C00', borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ color: '#E65100', fontSize: 11, fontWeight: 900, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Important</p>
            <p style={{ color: '#5D3A00', fontSize: 12.5, lineHeight: 1.65, margin: 0 }}>
              {highlightKeyTerms(block.text)}
            </p>
          </div>
        </div>
      )

    case 'formula':
      return (
        <div key={idx} style={{ background: '#1A1A2E', borderRadius: 14, padding: '16px', marginBottom: 10 }}>
          <p style={{ color: '#A5D6A7', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{block.title}</p>
          <div style={{ background: '#0F1020', borderRadius: 10, padding: '12px 16px', marginBottom: 10, textAlign: 'center' }}>
            <span style={{ color: '#69F0AE', fontSize: 14, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.5 }}>{block.formula}</span>
          </div>
          {block.legend && (
            <p style={{ color: '#A5D6A7', fontSize: 11, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>
              {block.legend.split('\n').map((line, li) => (
                <span key={li}>{line}{li < block.legend.split('\n').length - 1 && <br />}</span>
              ))}
            </p>
          )}
        </div>
      )

    case 'rsi_visual':
      return (
        <div key={idx} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ color: C.dark, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, textAlign: 'center' }}>{block.title}</p>
          {block.zones.map((z, zi) => (
            <div key={zi} style={{ background: z.bg, border: `1px solid ${z.color}33`, borderLeft: `4px solid ${z.color}`, borderRadius: 12, padding: '12px 14px', marginBottom: zi < block.zones.length - 1 ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ background: z.color, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{z.range}</span>
                <span style={{ color: z.color, fontSize: 12, fontWeight: 700 }}>{z.label}</span>
              </div>
              <p style={{ color: '#444', fontSize: 12, lineHeight: 1.55, margin: 0 }}>{z.desc}</p>
            </div>
          ))}
        </div>
      )

    case 'candlestick_visual':
      return (
        <div key={idx} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: '16px', marginBottom: 10 }}>
          <p style={{ color: C.dark, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, textAlign: 'center' }}>{block.title}</p>
          <CandlestickSVG candles={block.candles} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            {block.candles.map((c, ci) => (
              <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
                <span style={{ color: '#555', fontSize: 10 }}>{c.label.split('\n')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

// ── Quiz option button ────────────────────────────────────────────────────────
function QuizOption({ label, text, state, onClick }) {
  const bg = state === 'correct'  ? '#E8F5E9'
           : state === 'wrong'    ? '#FFEBEE'
           : state === 'selected' ? '#E3F2FD'
           : '#F8FAF8'

  const border = state === 'correct'  ? '#4CAF50'
               : state === 'wrong'    ? '#E53935'
               : state === 'selected' ? '#2196F3'
               : '#E0E0E0'

  const lblBg = state === 'correct'  ? '#4CAF50'
              : state === 'wrong'    ? '#E53935'
              : state === 'selected' ? '#2196F3'
              : '#EEEEEE'

  const lblColor = state === 'idle' ? '#666' : '#fff'

  return (
    <button
      onClick={onClick}
      disabled={state === 'correct' || state === 'wrong'}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderRadius: 12,
        background: bg, border: `1.5px solid ${border}`,
        cursor: (state === 'correct' || state === 'wrong') ? 'default' : 'pointer',
        textAlign: 'left', transition: 'all 0.2s', marginBottom: 8,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: lblBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
        <span style={{ color: lblColor, fontSize: 11, fontWeight: 800 }}>{label}</span>
      </div>
      <span style={{ color: C.dark, fontSize: 13, lineHeight: 1.4, flex: 1 }}>{text}</span>
      {state === 'correct' && <span style={{ fontSize: 16, flexShrink: 0 }}>✓</span>}
      {state === 'wrong'   && <span style={{ fontSize: 16, flexShrink: 0 }}>✗</span>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LessonPage() {
  const navigate      = useNavigate()
  const { sectionId } = useParams()
  const section       = SECTIONS.find(s => s.id === parseInt(sectionId))

  const speech = useSpeech()

  const [phase,           setPhase]           = useState(section?.isFinalQuiz ? 'quiz' : 'lesson')
  const [currentLesson,   setCurrentLesson]   = useState(0)
  const [autoPlay,        setAutoPlay]        = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizSubmitted,   setQuizSubmitted]   = useState(false)
  const [score,           setScore]           = useState(0)
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [alreadyDone,     setAlreadyDone]     = useState(false)

  useEffect(() => () => { speech.stop() }, [])

  useEffect(() => {
    if (section) checkAlreadyCompleted()
  }, [sectionId])

  const checkAlreadyCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('section_id', section.id)
        .maybeSingle()
      if (data?.status === 'completed') setAlreadyDone(true)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!autoPlay || phase !== 'lesson') return
    const lesson = section?.lessons[currentLesson]
    if (!lesson) return
    const enhanced = LESSONS_ENHANCED[lesson.id]
    const text = enhanced ? blocksToSpeechText(enhanced.blocks) : lesson.content
    const t = setTimeout(() => speech.play(text), 400)
    return () => clearTimeout(t)
  }, [currentLesson, autoPlay, phase])

  useEffect(() => {
    const lesson = section?.lessons[currentLesson]
    const enhanced = lesson ? LESSONS_ENHANCED[lesson.id] : null
    const text = enhanced ? blocksToSpeechText(enhanced.blocks) : lesson?.content

    const handleKey = (e) => {
      if (phase !== 'lesson' || !text) return
      if (e.code === 'Space' && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        if (speech.isPlaying)     speech.pause()
        else if (speech.isPaused) speech.resume()
        else                      speech.play(text)
      }
      if (e.code === 'Escape') speech.stop()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, currentLesson, speech.isPlaying, speech.isPaused])

  if (!section) {
    return (
      <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.dark, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Section not found</p>
          <button onClick={() => navigate('/learn')} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ← Back to Learn
          </button>
        </div>
      </div>
    )
  }

  const lessons           = section.lessons
  const quiz              = section.quiz
  const totalLessons      = lessons.length
  const totalQuiz         = quiz.length
  const currentLessonData = lessons[currentLesson]
  const enhancedData      = currentLessonData ? LESSONS_ENHANCED[currentLessonData.id] : null

  const progressPct = phase === 'lesson'
    ? totalLessons > 0 ? Math.round((currentLesson / (totalLessons + 1)) * 100) : 0
    : phase === 'quiz' ? Math.round((totalLessons / (totalLessons + 1)) * 100)
    : 100

  const goToPrevLesson = () => {
    speech.stop()
    setCurrentLesson(l => l - 1)
    window.scrollTo(0, 0)
  }

  const handleNextLesson = () => {
    speech.stop()
    if (currentLesson < totalLessons - 1) {
      setCurrentLesson(l => l + 1)
      window.scrollTo(0, 0)
    } else {
      setPhase('quiz')
      window.scrollTo(0, 0)
    }
  }

  const handleAnswerSelect = (qi, optIdx) => {
    if (quizSubmitted) return
    setSelectedAnswers(prev => ({ ...prev, [qi]: optIdx }))
  }

  const allAnswered = quiz.every((_, qi) => selectedAnswers[qi] !== undefined)

  const handleQuizSubmit = async () => {
    if (!allAnswered || isSubmitting) return
    setIsSubmitting(true)

    let correct = 0
    quiz.forEach((q, qi) => { if (selectedAnswers[qi] === q.correct) correct++ })
    setScore(correct)
    setQuizSubmitted(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('user_progress').upsert({
        user_id:          user.id,
        section_id:       section.id,
        status:           'completed',
        progress_percent: 100,
        quiz_score:       Math.round((correct / totalQuiz) * 100),
        xp_earned:        section.xp,
        completed_at:     new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'user_id,section_id' })

      if (!alreadyDone) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('total_xp, streak_days, last_active')
          .eq('id', user.id)
          .single()

        const today     = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const lastActive = typeof prof?.last_active === 'string' ? prof.last_active.split('T')[0] : null
        const newStreak  = lastActive === yesterday ? (prof?.streak_days ?? 0) + 1
                         : lastActive === today     ? (prof?.streak_days ?? 0)
                         : 1

        await supabase.from('profiles').update({
          total_xp:    (prof?.total_xp ?? 0) + section.xp,
          streak_days: newStreak,
          last_active: today,
        }).eq('id', user.id)
      }

      setTimeout(() => setPhase('complete'), 800)
    } catch (err) {
      console.error('Quiz submit error:', err)
      toast.error('Could not save progress. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', maxWidth: 430, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 30 }}>

      {/* ── TOP PROGRESS BAR ───────────────────────────────────────────────── */}
      <div style={{ height: 4, background: '#E0E0E0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ height: 4, background: C.green, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #EBF5EB', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <button
          onClick={() => { speech.stop(); navigate('/learn') }}
          style={{ background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: 10, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Section {section.id} — {section.title}
          </p>
          <p style={{ color: C.dark, fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {phase === 'lesson'  ? currentLessonData?.title
             : phase === 'quiz'  ? `Quiz · ${totalQuiz} questions`
             : 'Section Complete!'}
          </p>
        </div>

        {phase === 'lesson' && (
          <button
            onClick={() => {
              const next = !autoPlay
              setAutoPlay(next)
              if (!next) {
                speech.stop()
              } else if (currentLessonData) {
                const text = enhancedData
                  ? blocksToSpeechText(enhancedData.blocks)
                  : currentLessonData.content
                speech.play(text)
              }
            }}
            style={{
              background: autoPlay ? C.greenBg : '#F5F9F5',
              border: autoPlay ? '1px solid #4CAF50' : '1px solid #E0EDE0',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, fontWeight: 700,
              color: autoPlay ? C.greenDark : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {autoPlay ? '🔊 ON' : '🔇 OFF'}
          </button>
        )}

        <div style={{ background: C.greenBg, border: '1px solid #C8E6C9', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
          <span style={{ color: C.greenDark, fontSize: 10, fontWeight: 700 }}>+{section.xp} XP</span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PHASE: LESSON                                                       */}
      {/* ================================================================== */}
      {phase === 'lesson' && currentLessonData && (
        <div style={{ padding: '14px 14px 0' }}>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {lessons.map((_, li) => (
              <div key={li} style={{ flex: 1, height: 3, borderRadius: 2, background: li <= currentLesson ? C.green : '#E0E0E0', transition: 'background 0.3s' }} />
            ))}
          </div>

          {/* Lesson title card */}
          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.green}`, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: section.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div>
                <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Lesson {currentLesson + 1} of {totalLessons}
                </p>
                <p style={{ color: C.dark, fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>
                  {currentLessonData.title}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: '#F0F0F0', color: C.muted, fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                ⏱ {currentLessonData.duration} min read
              </span>
              {enhancedData && (
                <span style={{ background: C.greenBg, color: C.greenDark, fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, border: '1px solid #C8E6C9' }}>
                  ✦ Interactive
                </span>
              )}
              <span style={{ background: '#F0F0F0', color: C.muted, fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                ⌨ Space to play/pause
              </span>
            </div>
          </div>

          {/* Voice Player */}
          <VoicePlayer
            speech={speech}
            content={enhancedData ? blocksToSpeechText(enhancedData.blocks) : currentLessonData.content}
          />

          {/* ── Enhanced blocks or plain text ──────────────────────────── */}
          {enhancedData ? (
            <div style={{ marginBottom: 14 }}>
              {enhancedData.blocks.map((block, idx) => renderBlock(block, idx))}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', padding: '18px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <HighlightedContent
                content={currentLessonData.content}
                currentSentence={speech.currentSentence}
              />
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 20 }}>
            {currentLesson > 0 && (
              <button
                onClick={goToPrevLesson}
                style={{ flex: 1, height: 48, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 14, cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ← Previous
              </button>
            )}
            <button
              onClick={handleNextLesson}
              style={{ flex: 2, height: 48, background: C.green, border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}
            >
              {currentLesson < totalLessons - 1 ? 'Next Lesson →' : 'Take Quiz →'}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* PHASE: QUIZ                                                         */}
      {/* ================================================================== */}
      {phase === 'quiz' && (
        <div style={{ padding: '14px 14px 0' }}>

          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, borderTop: '3px solid #E65100', padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🧠</div>
              <div>
                <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Section Quiz</p>
                <p style={{ color: C.dark, fontSize: 14, fontWeight: 800 }}>{totalQuiz} Questions · +{section.xp} XP</p>
              </div>
            </div>
            {!quizSubmitted && (
              <div style={{ marginTop: 10, background: '#FFF8E1', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#633806' }}>
                📋 Answer all questions, then tap Submit to see your score.
              </div>
            )}
          </div>

          {quiz.map((q, qi) => {
            const selected  = selectedAnswers[qi]
            const submitted = quizSubmitted

            const getOptionState = (optIdx) => {
              if (!submitted) return selected === optIdx ? 'selected' : 'idle'
              if (optIdx === q.correct) return 'correct'
              if (optIdx === selected && selected !== q.correct) return 'wrong'
              return 'idle'
            }

            return (
              <div key={qi} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', padding: '14px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: C.greenBg, color: C.greenDark, borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 800, flexShrink: 0, height: 'fit-content' }}>
                    Q{qi + 1}
                  </span>
                  <p style={{ color: C.dark, fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>{q.q}</p>
                </div>

                {q.options.map((opt, optIdx) => (
                  <QuizOption
                    key={optIdx}
                    label={OPTION_LABELS[optIdx]}
                    text={opt}
                    state={getOptionState(optIdx)}
                    onClick={() => handleAnswerSelect(qi, optIdx)}
                  />
                ))}

                {submitted && (
                  <div style={{ background: '#F0FBF0', border: '1px solid #C8E6C9', borderRadius: 10, padding: '10px 12px', marginTop: 4, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                    <p style={{ color: C.greenDark, fontSize: 11, lineHeight: 1.5 }}>{q.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}

          {!quizSubmitted && (
            <button
              onClick={handleQuizSubmit}
              disabled={!allAnswered || isSubmitting}
              style={{
                width: '100%', height: 52, marginBottom: 20,
                background: allAnswered ? C.green : '#E0E0E0',
                border: 'none', borderRadius: 14,
                cursor: allAnswered ? 'pointer' : 'not-allowed',
                color: allAnswered ? '#fff' : '#AAAAAA',
                fontSize: 14, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: allAnswered ? '0 4px 14px rgba(76,175,80,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? 'Saving...' : allAnswered ? 'Submit Quiz →' : `Answer all ${totalQuiz} questions`}
            </button>
          )}

          {quizSubmitted && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #C8E6C9', padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>
                {score === totalQuiz ? '🏆' : score >= Math.ceil(totalQuiz / 2) ? '🎯' : '📚'}
              </div>
              <p style={{ color: C.dark, fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                {score}/{totalQuiz} correct
              </p>
              <p style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>
                {score === totalQuiz ? 'Perfect score!' : score >= Math.ceil(totalQuiz / 2) ? 'Good job!' : 'Keep practicing!'}
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: C.greenBg, color: C.greenDark, fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #C8E6C9' }}>
                  ⚡ +{alreadyDone ? 0 : section.xp} XP earned
                </span>
                <span style={{ background: '#FFF8E1', color: '#E65100', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #FFE082' }}>
                  {Math.round((score / totalQuiz) * 100)}% score
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* PHASE: COMPLETE                                                     */}
      {/* ================================================================== */}
      {phase === 'complete' && (
        <div style={{ padding: '30px 14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

          <div style={{ width: 90, height: 90, borderRadius: '50%', background: C.greenBg, border: '3px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 18, boxShadow: '0 8px 30px rgba(76,175,80,0.2)' }}>
            🏆
          </div>

          <p style={{ color: C.dark, fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Section Complete!</p>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 22, maxWidth: 280, lineHeight: 1.5 }}>
            You've mastered <strong style={{ color: C.dark }}>{section.title}</strong>. Keep the streak going!
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24, width: '100%', maxWidth: 320 }}>
            {[
              [String(score) + '/' + totalQuiz, 'Quiz Score'],
              ['+' + (alreadyDone ? 0 : section.xp), 'XP Earned'],
              [Math.round((score / totalQuiz) * 100) + '%', 'Accuracy'],
            ].map(([val, label], idx) => (
              <div key={idx} style={{ flex: 1, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: idx === 0 ? C.greenDark : idx === 1 ? '#E65100' : '#FF6B35', marginBottom: 4 }}>{val}</p>
                <p style={{ color: C.muted, fontSize: 10 }}>{label}</p>
              </div>
            ))}
          </div>

          {section.id < 8 && (
            <div
              onClick={() => navigate(`/learn/${section.id + 1}`)}
              style={{ width: '100%', maxWidth: 320, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12, boxShadow: '0 2px 10px rgba(76,175,80,0.08)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: SECTIONS[section.id].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {SECTIONS[section.id].icon}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Next Up</p>
                <p style={{ color: C.dark, fontSize: 13, fontWeight: 800 }}>{SECTIONS[section.id].title}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}

          <button
            onClick={() => navigate('/learn')}
            style={{ width: '100%', maxWidth: 320, height: 50, background: C.green, border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 14px rgba(76,175,80,0.3)' }}
          >
            Back to Learn ✓
          </button>
        </div>
      )}

    </div>
  )
}
