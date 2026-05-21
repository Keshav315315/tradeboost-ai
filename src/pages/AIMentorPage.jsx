import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Home, TrendingUp, MessageCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#F8FAF8',
  card:      '#FFFFFF',
  border:    '#E8F5E9',
  green:     '#4CAF50',
  greenDark: '#2E7D32',
  greenBg:   '#E8F5E9',
  muted:     '#888888',
  dark:      '#1A1A1A',
}

// ── Quick chips ────────────────────────────────────────────────────────────────
const CHIPS = [
  'Why did Nifty fall today?',
  'Explain RSI simply',
  'What is Stop Loss?',
  'How to read candlesticks?',
  'Intraday vs Swing trading',
  'How to manage risk?',
  'What is PE Ratio?',
  'Beginner roadmap',
]

// Fixed voice bar heights (avoids Math.random in render)
const VOICE_BAR_ANIMS = ['voiceBar1', 'voiceBar2', 'voiceBar3', 'voiceBar4', 'voiceBar5']
const VOICE_BAR_H     = [10, 18, 12, 22, 14]

// ── Welcome message ────────────────────────────────────────────────────────────
const WELCOME = {
  id:        1,
  role:      'assistant',
  content:   "Hey! 👋 I'm your AI Mentor at TradeBoost.AI!\n\nI'm powered by GPT-4 and trained specifically for Indian stock markets.\n\nAsk me anything about:\n📊 Charts & Technical Analysis\n💰 Stocks & Fundamentals\n⚡ Trading Strategies\n🧠 Market Psychology\n\nWhat would you like to learn today?",
  timestamp: new Date(),
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: C.green,
          animation: 'typingDot 1.4s infinite', animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes typingDot {
          0%,60%,100% { transform:translateY(0); opacity:0.4; }
          30%          { transform:translateY(-6px); opacity:1; }
        }
      `}</style>
    </div>
  )
}

function AIAvatar({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.green, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(76,175,80,0.25)',
    }}>🤖</div>
  )
}

function LevelBadge({ level }) {
  const map = {
    beginner:     { bg: '#E8F5E9', color: '#2E7D32', border: '#C8E6C9', label: 'Beginner 🌱' },
    intermediate: { bg: '#E3F2FD', color: '#1565C0', border: '#BBDEFB', label: 'Intermediate 📈' },
    advanced:     { bg: '#FFF8E1', color: '#E65100', border: '#FFE082', label: 'Advanced 🔥' },
  }
  const s = map[level] ?? map.beginner
  return (
    <span style={{
      fontSize: 9, background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: 20, border: `1px solid ${s.border}`, flexShrink: 0,
    }}>
      {s.label}
    </span>
  )
}

function NavItem({ icon: Icon, label, active, onClick }) {
  const color = active ? '#4CAF50' : '#AAAAAA'
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
      <Icon size={22} color={color} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ color, fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
      {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4CAF50', marginTop: -1 }} />}
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function AIMentorPage() {
  const navigate       = useNavigate()
  const inputRef       = useRef(null)
  const chatEndRef     = useRef(null)
  const recognitionRef = useRef(null)

  const [messages,            setMessages]            = useState([WELCOME])
  const [conversationHistory, setConversationHistory] = useState([])
  const [inputText,           setInputText]           = useState('')
  const [isLoading,           setIsLoading]           = useState(false)
  const [error,               setError]               = useState(null)

  // Voice state
  const [isListening,    setIsListening]    = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [isSpeaking,     setIsSpeaking]     = useState(false)
  const [autoSpeak,      setAutoSpeak]      = useState(false)

  // Context-aware level
  const [userLevel, setUserLevel] = useState('beginner')

  // ── Init speech recognition ──────────────────────────────────────────────────
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    setVoiceSupported(true)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous     = false
    rec.interimResults = true
    rec.lang           = 'en-IN'

    rec.onstart = () => setIsListening(true)
    rec.onend   = () => setIsListening(false)
    rec.onresult = (e) => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript
      setInputText(t)
      if (e.results[e.results.length - 1].isFinal) { setInputText(t); rec.stop() }
    }
    rec.onerror = (e) => {
      console.error('Speech error:', e.error)
      setIsListening(false)
      if (e.error === 'not-allowed') toast.error('Microphone permission denied.')
    }
    recognitionRef.current = rec
    return () => { recognitionRef.current?.abort() }
  }, [])

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isLoading, scrollToBottom])

  // ── Detect user level after first reply ─────────────────────────────────────
  useEffect(() => {
    if (messages.length !== 2) return
    const t = messages[1]?.content?.toLowerCase() ?? ''
    if (t.includes('option') || t.includes('future') || t.includes('derivative') ||
        t.includes('greek') || t.includes('macd')) {
      setUserLevel('advanced')
    } else if (t.includes('chart') || t.includes('rsi') ||
               t.includes('moving average') || t.includes('support')) {
      setUserLevel('intermediate')
    }
  }, [messages])

  // ── TTS helpers ──────────────────────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '')
                      .replace(/#{1,6} /g, '').replace(/\n/g, ' ').trim()
    const utt   = new SpeechSynthesisUtterance(clean)
    utt.lang    = 'en-IN'; utt.rate = 0.9; utt.pitch = 1.0; utt.volume = 1.0
    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    const go = () => {
      const voices = window.speechSynthesis.getVoices()
      utt.voice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'))
               || voices.find(v => v.lang.startsWith('en')) || null
      window.speechSynthesis.speak(utt)
    }
    window.speechSynthesis.getVoices().length > 0
      ? go()
      : (window.speechSynthesis.onvoiceschanged = go)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel(); setIsSpeaking(false)
  }, [])

  // ── Toggle voice input ───────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!voiceSupported) { toast.error('Voice not supported. Use Chrome.'); return }
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setInputText('')
      try {
        recognitionRef.current?.start()
        toast('🎤 Listening... Speak now', {
          duration: 2000,
          style: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' },
        })
      } catch (e) { console.error(e) }
    }
  }

  // ── Send message via Supabase Edge Function ──────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text ?? inputText).trim()
    if (!trimmed || isLoading) return

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, timestamp: new Date() }
    const newHistory = [...conversationHistory, { role: 'user', content: trimmed }].slice(-10)

    setMessages(prev => [...prev, userMsg])
    setConversationHistory(newHistory)
    setInputText('')
    setIsLoading(true)
    setError(null)
    scrollToBottom()

    try {
      console.log('[AI Mentor] ▶ Invoking edge function', {
        function:  'ai-mentor',
        model:     'gpt-4o-mini',
        msgCount:  newHistory.length,
        lastMsg:   trimmed.slice(0, 60),
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      })

      const { data, error: fnError } = await supabase.functions.invoke('ai-mentor', {
        body: { messages: newHistory, model: 'gpt-4o-mini' },
      })

      console.log('[AI Mentor] ◀ Raw response:', { data, fnError })

      if (fnError) {
        console.error('[AI Mentor] ✖ Function error:', fnError)
        throw new Error(fnError.message)
      }
      if (!data?.success) {
        console.error('[AI Mentor] ✖ API error:', data?.error)
        throw new Error(data?.error ?? 'Unknown error from AI service')
      }

      console.log('[AI Mentor] ✔ Success — reply length:', data.message?.length, '| model:', data.model)

      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: data.message, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      setConversationHistory(prev => [...prev, { role: 'assistant', content: data.message }])

      if (autoSpeak) speakText(data.message)

    } catch (err) {
      console.error('[AI Mentor] ✖ Caught error:', err.message, err)
      setError(err.message)
      setMessages(prev => [...prev, {
        id:        Date.now() + 1,
        role:      'assistant',
        content:   "Sorry, I'm having trouble connecting right now. Please try again! 🔄",
        timestamp: new Date(),
        isError:   true,
      }])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.bg, minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 430, height: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 60 }}>

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderBottom: '1px solid #EBF5EB',
          background: C.card, flexShrink: 0,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: 10,
              padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} color={C.dark} />
          </button>

          <AIAvatar size={36} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <p style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>TradeBoost AI Mentor</p>
              <LevelBadge level={userLevel} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
              <span style={{ color: C.green, fontSize: 9, fontWeight: 600 }}>GPT-4 · Always ready</span>
            </div>
          </div>

          {/* Auto-speak toggle */}
          <button
            onClick={() => {
              const next = !autoSpeak
              setAutoSpeak(next)
              if (!next) stopSpeaking()
              toast(next ? '🔊 Voice on' : '🔇 Voice off')
            }}
            style={{
              background: autoSpeak ? '#E8F5E9' : '#F5F9F5',
              border: autoSpeak ? '1px solid #4CAF50' : '1px solid #E0EDE0',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, fontWeight: 600,
              color: autoSpeak ? C.greenDark : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.2s',
            }}
          >
            {autoSpeak ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
        </div>

        {/* ── QUICK CHIPS ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 12px',
          overflowX: 'auto', borderBottom: '1px solid #F0F0F0',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          flexShrink: 0, background: C.card,
        }}>
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              disabled={isLoading}
              style={{
                background: '#F0FBF0', border: '1px solid #C8E6C9',
                borderRadius: 20, padding: '6px 12px',
                color: C.greenDark, fontSize: 10, fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: isLoading ? 0.5 : 1, transition: 'all 0.2s',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── ERROR BANNER ─────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: '#FFEBEE', border: '1px solid #FFCDD2',
            borderRadius: 10, padding: '10px 14px', margin: '8px 14px',
            fontSize: 12, color: '#C62828', flexShrink: 0,
          }}>
            ⚠️ {error} — Please try again
          </div>
        )}

        {/* ── CHAT AREA ────────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 12,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          background: '#F8FAF8',
        }}>
          <p style={{
            textAlign: 'center', color: C.muted, fontSize: 9,
            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Today · {fmtTime(WELCOME.timestamp)}
          </p>

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8,
              }}
            >
              {msg.role === 'assistant' && <AIAvatar size={28} />}

              <div style={{ maxWidth: '78%' }}>
                <div
                  style={{
                    background: msg.role === 'user' ? C.green : C.card,
                    color: msg.role === 'user' ? '#FFFFFF' : C.dark,
                    border: msg.role === 'user'
                      ? 'none'
                      : `1px solid ${msg.isError ? '#FFCDD2' : '#E8F5E9'}`,
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                    boxShadow: msg.role === 'user'
                      ? '0 2px 8px rgba(76,175,80,0.25)'
                      : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />

                {/* Timestamp + speak button */}
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'center', gap: 4, marginTop: 3,
                }}>
                  <span style={{ fontSize: 9, color: C.muted }}>
                    {fmtTime(msg.timestamp)}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: C.muted, fontSize: 10, padding: '0 2px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {isSpeaking ? '⏸' : '🔊'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <AIAvatar size={28} />
              <div style={{
                background: C.card, border: '1px solid #E8F5E9',
                borderRadius: '16px 16px 16px 4px', padding: '12px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── VOICE INDICATOR ──────────────────────────────────────────────── */}
        {isListening && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '8px 12px', background: '#E8F5E9', flexShrink: 0,
          }}>
            {VOICE_BAR_H.map((h, i) => (
              <div key={i} style={{
                width: 3, height: h, background: '#4CAF50', borderRadius: 2,
                animation: `${VOICE_BAR_ANIMS[i]} 0.8s ease infinite`,
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
            <span style={{ color: C.greenDark, fontSize: 11, fontWeight: 600, marginLeft: 8 }}>
              Listening...
            </span>
          </div>
        )}

        {/* ── INPUT ROW ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderTop: '1px solid #EBF5EB',
          background: C.card, flexShrink: 0,
        }}>
          {/* Mic button */}
          <button
            onClick={toggleVoice}
            title={voiceSupported ? (isListening ? 'Stop' : 'Speak') : 'Not supported'}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: isListening ? '#E8F5E9' : '#F5F9F5',
              border: isListening ? '2px solid #4CAF50' : '1px solid #C8E6C9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              animation: isListening ? 'pulse-green 1.5s infinite' : 'none',
            }}
          >
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#4CAF50">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#4CAF50" strokeWidth="2" fill="none" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="#4CAF50" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={isListening ? 'Listening...' : 'Ask anything about stocks...'}
            disabled={isLoading}
            style={{
              flex: 1, background: '#F5F9F5', border: '1px solid #E0EDE0',
              borderRadius: 20, padding: '10px 14px',
              color: C.dark, fontSize: 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', opacity: isLoading ? 0.6 : 1, transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#4CAF50')}
            onBlur={e => (e.target.style.borderColor = '#E0EDE0')}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputText.trim()}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: inputText.trim() && !isLoading ? C.green : '#E8F5E9',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: inputText.trim() && !isLoading ? '0 2px 8px rgba(76,175,80,0.3)' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={inputText.trim() && !isLoading ? '#fff' : '#4CAF50'}
              strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>

      {/* ── Animation keyframes ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(76,175,80,0); }
        }
        @keyframes voiceBar1 { 0%,100%{height:8px}  50%{height:20px} }
        @keyframes voiceBar2 { 0%,100%{height:14px} 50%{height:8px}  }
        @keyframes voiceBar3 { 0%,100%{height:10px} 50%{height:22px} }
        @keyframes voiceBar4 { 0%,100%{height:18px} 50%{height:10px} }
        @keyframes voiceBar5 { 0%,100%{height:12px} 50%{height:16px} }
      `}</style>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#FFFFFF', borderTop: '1px solid #EBF5EB', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}>
        <NavItem icon={Home}          label="Home"      onClick={() => navigate('/home')}      />
        <NavItem icon={TrendingUp}    label="Trade"     onClick={() => navigate('/trade')}     />
        <button onClick={() => navigate('/simulator')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: 'none', border: 'none', padding: '0 8px' }}>
          <TrophyIcon size={22} color="#AAAAAA" />
          <span style={{ color: '#AAAAAA', fontSize: 9, fontWeight: 500 }}>League</span>
        </button>
        <NavItem icon={MessageCircle} label="AI Mentor" active                                 />
        <NavItem icon={User}          label="Profile"   onClick={() => navigate('/profile')}   />
      </div>
    </div>
  )
}
