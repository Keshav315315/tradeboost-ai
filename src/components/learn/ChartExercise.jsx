import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import { CheckCircle2, XCircle, Target } from 'lucide-react'

// Simulated price data for the exercise
const CHART_DATA = [
  { t: 'Day 1', p: 1480 }, { t: 'Day 2', p: 1510 }, { t: 'Day 3', p: 1495 },
  { t: 'Day 4', p: 1530 }, { t: 'Day 5', p: 1515 }, { t: 'Day 6', p: 1500 },
  { t: 'Day 7', p: 1525 }, { t: 'Day 8', p: 1540 }, { t: 'Day 9', p: 1520 },
  { t: 'Day 10', p: 1505 }, { t: 'Day 11', p: 1495 }, { t: 'Day 12', p: 1510 },
  { t: 'Day 13', p: 1530 }, { t: 'Day 14', p: 1555 },
]

const SUPPORT = 1495  // ~floor level
const RESISTANCE = 1540  // ~ceiling level

const ZONES = [
  { id: 'support', label: 'Support Zone', desc: 'Price bounces up from this level multiple times', price: SUPPORT, correct: true },
  { id: 'resistance', label: 'Resistance Zone', desc: 'Price struggles to break above this ceiling', price: RESISTANCE, correct: false },
  { id: 'neither', label: 'Neither — it\'s trending', desc: 'No clear support or resistance visible', correct: false },
]

const QUESTION = 'Looking at the chart, identify the SUPPORT level where the price bounced multiple times:'

export default function ChartExercise({ symbol = 'HDFC BANK' }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (zone) => {
    if (answered) return
    setSelected(zone.id)
    setAnswered(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Chart label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Target size={13} color="#4CAF50" />
        <span style={{ color: '#4CAF50', fontSize: 11, fontWeight: 700 }}>Interactive Chart</span>
        <span style={{ color: '#888888', fontSize: 10 }}>· {symbol}</span>
      </div>

      {/* Chart */}
      <div
        style={{
          background: '#F5F9F5',
          border: '1px solid #E8F5E9',
          borderRadius: 12,
          padding: '12px 4px 8px',
          height: 160,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CHART_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fontSize: 7, fill: '#888888' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 7, fill: '#888888' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E8F5E9', borderRadius: 8, fontSize: 10 }}
              labelStyle={{ color: '#888888' }}
              itemStyle={{ color: '#4CAF50' }}
            />
            <ReferenceLine
              y={SUPPORT}
              stroke={answered ? '#4CAF50' : '#C8E6C9'}
              strokeDasharray="4 3"
              label={{ value: answered ? 'SUPPORT ✓' : '?', fill: answered ? '#4CAF50' : '#C8E6C9', fontSize: 9, position: 'insideTopLeft' }}
            />
            <ReferenceLine
              y={RESISTANCE}
              stroke={answered ? '#E53935' : '#C8E6C9'}
              strokeDasharray="4 3"
              label={{ value: answered ? 'RESISTANCE' : '?', fill: answered ? '#E53935' : '#C8E6C9', fontSize: 9, position: 'insideTopLeft' }}
            />
            <Area type="monotone" dataKey="p" stroke="#4CAF50" strokeWidth={2} fill="url(#chartGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Question */}
      <p style={{ color: '#1A1A1A', fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>{QUESTION}</p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ZONES.map(zone => {
          const isSelected = selected === zone.id
          const showResult = answered && isSelected
          const isCorrect = zone.correct

          let borderColor = '#E8F5E9'
          let bg = '#F5F9F5'
          let labelColor = '#555555'

          if (answered) {
            if (isSelected && isCorrect) { borderColor = '#4CAF50'; bg = 'rgba(76,175,80,0.08)'; labelColor = '#4CAF50' }
            else if (isSelected && !isCorrect) { borderColor = '#E53935'; bg = 'rgba(229,57,53,0.08)'; labelColor = '#E53935' }
            else if (!isSelected && isCorrect) { borderColor = 'rgba(76,175,80,0.5)'; bg = 'rgba(76,175,80,0.05)' }
          } else if (isSelected) {
            borderColor = '#4CAF50'; bg = 'rgba(76,175,80,0.08)'
          }

          return (
            <motion.button
              key={zone.id}
              whileTap={!answered ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(zone)}
              style={{
                background: bg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 10,
                padding: '10px 12px',
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ marginTop: 1, flexShrink: 0 }}>
                {answered && isSelected && isCorrect && <CheckCircle2 size={15} color="#4CAF50" />}
                {answered && isSelected && !isCorrect && <XCircle size={15} color="#E53935" />}
                {answered && !isSelected && isCorrect && <CheckCircle2 size={15} color="rgba(76,175,80,0.5)" />}
                {!answered && (
                  <div style={{
                    width: 15, height: 15, borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#4CAF50' : '#D0D0D0'}`,
                    background: isSelected ? '#4CAF50' : 'transparent',
                  }} />
                )}
              </div>
              <div>
                <p style={{ color: labelColor, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{zone.label}</p>
                {zone.price && (
                  <p style={{ color: '#888888', fontSize: 10 }}>Price level: ₹{zone.price}</p>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: selected === 'support' ? 'rgba(76,175,80,0.08)' : 'rgba(229,57,53,0.08)',
              border: `1px solid ${selected === 'support' ? 'rgba(76,175,80,0.3)' : 'rgba(229,57,53,0.3)'}`,
              borderRadius: 10, padding: '10px 12px',
            }}
          >
            <p style={{ color: selected === 'support' ? '#4CAF50' : '#E53935', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>
              {selected === 'support' ? '🎯 Correct! Great eye for charts!' : '❌ Not quite — look again'}
            </p>
            <p style={{ color: '#888888', fontSize: 10, lineHeight: 1.5 }}>
              The support level is ₹{SUPPORT} — price bounced up from this zone 3 times. Resistance at ₹{RESISTANCE} is where price kept getting rejected and couldn't break above.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
