import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Lightbulb, BarChart2, BrainCircuit,
  CheckCircle2, XCircle, Sparkles, Trophy, Star, ChevronRight,
} from 'lucide-react'
import ChartExercise from './ChartExercise'
import { askAI } from '../../services/aiService'

const C = {
  bg: '#F8FAF8', card: '#FFFFFF', border: '#E8F5E9',
  blue: '#4CAF50', green: '#4CAF50', red: '#E53935',
  gold: '#FBB040', purple: '#2E7D32', muted: '#888888', text: '#555555',
}

// ── Concept card (heading + paragraph) ────────────────────────────────────────
function ConceptCard({ title, text, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 9,
              background: '#E8F5E9',
              border: '1px solid #C8E6C9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={13} color={C.blue} />
          </div>
          <h3 style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{title}</h3>
        </div>
      )}
      <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>{text}</p>
    </motion.div>
  )
}

// ── Visual card (icon + concept with visual emphasis) ─────────────────────────
function VisualCard({ title, text, visual }) {
  const visuals = {
    bullish: { emoji: '📈', color: C.green, label: 'Bullish' },
    bearish: { emoji: '📉', color: C.red, label: 'Bearish' },
    neutral: { emoji: '➡️', color: C.gold, label: 'Neutral' },
    candlestick: { emoji: '🕯️', color: C.gold, label: 'Candlestick' },
    default: { emoji: '💡', color: C.blue, label: 'Concept' },
  }
  const v = visuals[visual] ?? visuals.default

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
      {/* Visual hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${v.color}18, ${v.color}08)`,
          border: `1px solid ${v.color}30`,
          borderRadius: 16,
          padding: '20px',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>{v.emoji}</div>
        <span
          style={{
            background: `${v.color}20`,
            border: `1px solid ${v.color}40`,
            borderRadius: 20, padding: '3px 12px',
            color: v.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          }}
        >
          {v.label}
        </span>
      </div>
      {title && <h3 style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{title}</h3>}
      <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>{text}</p>
    </motion.div>
  )
}

// ── Example card (real-world example with highlight) ──────────────────────────
function ExampleCard({ label, text }) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Lightbulb size={14} color={C.gold} />
        <span style={{ color: C.gold, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label ?? 'Real-World Example'}
        </span>
      </div>
      <div
        style={{
          background: 'rgba(251,176,64,0.06)',
          border: '1px solid rgba(251,176,64,0.25)',
          borderLeft: `3px solid ${C.gold}`,
          borderRadius: '0 12px 12px 0',
          padding: '14px 16px',
        }}
      >
        <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75 }}>{text}</p>
      </div>
    </motion.div>
  )
}

// ── Interactive chart card ─────────────────────────────────────────────────────
function InteractiveChartCard({ symbol }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <ChartExercise symbol={symbol} />
    </motion.div>
  )
}

// ── Quiz card (single question) ────────────────────────────────────────────────
export function QuizCard({ question, options, correct, onAnswer, isAnswered, selectedIndex }) {
  const handleSelect = (idx) => {
    if (isAnswered) return
    onAnswer(idx, idx === correct)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      {/* Quiz header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 9,
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <BrainCircuit size={13} color={C.purple} />
        </div>
        <span style={{ color: C.purple, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Quick Quiz
        </span>
      </div>

      {/* Question */}
      <p style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 18 }}>{question}</p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => {
          const isSelected = isAnswered && selectedIndex === i
          const isCorrectOpt = isAnswered && i === correct
          const isWrong = isAnswered && selectedIndex === i && i !== correct

          let border = `1.5px solid ${C.border}`
          let bg = '#F5F9F5'
          let textColor = C.text
          let icon = null

          if (isCorrectOpt) { border = `1.5px solid ${C.green}`; bg = 'rgba(76,175,80,0.08)'; textColor = C.green; icon = <CheckCircle2 size={14} color={C.green} /> }
          else if (isWrong) { border = `1.5px solid ${C.red}`; bg = 'rgba(229,57,53,0.08)'; textColor = C.red; icon = <XCircle size={14} color={C.red} /> }
          else if (!isAnswered) { border = `1.5px solid ${C.border}`; bg = '#F5F9F5' }

          return (
            <motion.button
              key={i}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              style={{
                background: bg, border, borderRadius: 12,
                padding: '12px 14px',
                cursor: isAnswered ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left', transition: 'all 0.25s',
              }}
            >
              {/* Option letter */}
              <div
                style={{
                  width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                  background: isCorrectOpt ? 'rgba(76,175,80,0.15)' : isWrong ? 'rgba(229,57,53,0.15)' : 'rgba(0,0,0,0.04)',
                  border: isCorrectOpt ? '1px solid rgba(76,175,80,0.5)' : isWrong ? '1px solid rgba(229,57,53,0.5)' : '1px solid #E0E0E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isCorrectOpt ? C.green : isWrong ? C.red : C.muted,
                  fontSize: 10, fontWeight: 700,
                }}
              >
                {icon ?? String.fromCharCode(65 + i)}
              </div>
              <span style={{ color: textColor, fontSize: 12, lineHeight: 1.5, fontWeight: isCorrectOpt || isWrong ? 600 : 400 }}>
                {opt}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 14,
              background: selectedIndex === correct ? 'rgba(76,175,80,0.07)' : 'rgba(229,57,53,0.07)',
              border: `1px solid ${selectedIndex === correct ? 'rgba(76,175,80,0.3)' : 'rgba(229,57,53,0.3)'}`,
              borderRadius: 10, padding: '10px 13px',
            }}
          >
            <p style={{ color: selectedIndex === correct ? C.green : C.red, fontSize: 12, fontWeight: 700 }}>
              {selectedIndex === correct ? '🎯 Correct! Well done.' : `❌ Not quite. The answer is: ${options[correct]}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── AI Explain card ────────────────────────────────────────────────────────────
function AIExplainCard({ topic, lessonTitle }) {
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const fetchExplanation = async () => {
    if (fetched || loading) return
    setLoading(true)
    try {
      const reply = await askAI('QUICK_EXPLAIN', [
        { role: 'user', content: `Give me a 2-3 sentence "aha moment" summary of: ${lessonTitle}. Use a relatable Indian analogy or stock market example. Keep it punchy and memorable.` }
      ])
      setExplanation(reply)
      setFetched(true)
    } catch {
      setExplanation('Connect to AI for a personalised explanation of this topic!')
      setFetched(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExplanation()
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 9,
            background: '#4CAF50',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Sparkles size={13} color="#fff" />
        </div>
        <span style={{ color: C.blue, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          AI Key Takeaway
        </span>
      </div>

      <div
        style={{
          background: '#F0FBF0',
          border: '1px solid #C8E6C9',
          borderRadius: 14, padding: '16px',
          minHeight: 80,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 85, 70].map((w, i) => (
              <div key={i} style={{ height: 10, borderRadius: 5, background: '#E0E0E0', width: `${w}%`, overflow: 'hidden' }}>
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                  style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(76,175,80,0.3), transparent)' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{explanation}</p>
        )}
      </div>
    </motion.div>
  )
}

// ── Summary card (completion) ─────────────────────────────────────────────────
function SummaryCard({ lessonTitle, xpEarned, onComplete, isCompleted, quizScore, totalQuiz }) {
  const pct = totalQuiz > 0 ? Math.round((quizScore / totalQuiz) * 100) : 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center' }}
    >
      {/* Trophy animation */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 64, marginBottom: 16 }}
      >
        {pct >= 80 ? '🏆' : pct >= 50 ? '🥈' : '📚'}
      </motion.div>

      <h2 style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
        {isCompleted ? 'Already Completed!' : 'Lesson Done!'}
      </h2>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
        {lessonTitle}
      </p>

      {/* Score */}
      {totalQuiz > 0 && (
        <div
          style={{
            background: '#F5F9F5',
            border: '1px solid #E8F5E9',
            borderRadius: 14, padding: '14px',
            marginBottom: 18,
            display: 'flex', gap: 12, justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 800 }}>{pct}%</p>
            <p style={{ color: C.muted, fontSize: 10 }}>Quiz Score</p>
          </div>
          <div style={{ width: 1, background: '#E8F5E9' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 800 }}>{quizScore}/{totalQuiz}</p>
            <p style={{ color: C.muted, fontSize: 10 }}>Correct</p>
          </div>
          <div style={{ width: 1, background: '#E8F5E9' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.gold, fontSize: 20, fontWeight: 800 }}>+{isCompleted ? 0 : xpEarned}</p>
            <p style={{ color: C.muted, fontSize: 10 }}>XP Earned</p>
          </div>
        </div>
      )}

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 * s, stiffness: 400 }}
          >
            <Star
              size={28}
              color={C.gold}
              fill={pct >= s * 33 ? C.gold : 'transparent'}
            />
          </motion.div>
        ))}
      </div>

      {/* Complete button */}
      {!isCompleted && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onComplete}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #4CAF50, #43A047)',
            border: 'none', borderRadius: 16,
            padding: '15px',
            color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(76,175,80,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Trophy size={16} color="#fff" />
          Complete & Earn {xpEarned} XP
          <ChevronRight size={16} color="#fff" />
        </motion.button>
      )}

      {isCompleted && (
        <div
          style={{
            background: 'rgba(76,175,80,0.08)',
            border: '1px solid rgba(76,175,80,0.3)',
            borderRadius: 14, padding: '12px',
            color: C.green, fontSize: 12, fontWeight: 600,
          }}
        >
          ✅ Already completed — XP already counted
        </div>
      )}
    </motion.div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function LessonCard({ card, onAnswer, onComplete }) {
  switch (card.type) {
    case 'concept':          return <ConceptCard {...card} />
    case 'visual':           return <VisualCard {...card} />
    case 'example':          return <ExampleCard {...card} />
    case 'interactive-chart': return <InteractiveChartCard {...card} />
    case 'quiz':             return <QuizCard {...card} onAnswer={onAnswer} />
    case 'ai-explain':       return <AIExplainCard {...card} />
    case 'summary':          return <SummaryCard {...card} onComplete={onComplete} />
    default:                 return <ConceptCard {...card} />
  }
}
