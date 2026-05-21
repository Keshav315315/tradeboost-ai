import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, X, Send, Loader2 } from 'lucide-react'
import { askAI } from '../../services/aiService'

export default function AIDoubtButton({ lessonTitle = '' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: `Hey! Got a doubt about "${lessonTitle}"? Ask me anything — I'll explain it simply! 🤓`,
      }])
    }
  }, [open, lessonTitle, messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    const userMsg = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const history = [
        ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: trimmed },
      ]
      const reply = await askAI('QUICK_EXPLAIN', history,
        `You are a friendly stock market tutor. The student is studying: "${lessonTitle}". Answer doubts simply, use Indian examples (NSE stocks, INR), keep replies under 120 words.`
      )
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't connect right now. Try again! 🔄" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={open ? {} : { y: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: open ? 0 : Infinity, ease: 'easeInOut' }}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 16,
          width: 48, height: 48,
          borderRadius: '50%',
          background: '#4CAF50',
          border: 'none',
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(76,175,80,0.5)',
          zIndex: 500,
        }}
      >
        <BrainCircuit size={22} color="#fff" />
      </motion.button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600 }}
            />
            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 35 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: '#FFFFFF',
                border: '1px solid #E8F5E9',
                borderRadius: '20px 20px 0 0',
                height: '60dvh',
                display: 'flex', flexDirection: 'column',
                zIndex: 700,
                maxWidth: 430, margin: '0 auto',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 16px',
                  borderBottom: '1px solid #E8F5E9',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32,
                    borderRadius: 10,
                    background: '#4CAF50',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <BrainCircuit size={16} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#1A1A1A', fontSize: 12, fontWeight: 700 }}>AI Doubt Solver</p>
                  <p style={{ color: '#4CAF50', fontSize: 9, fontWeight: 600 }}>● Always ready</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: '#F5F9F5', border: 'none', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={14} color="#888888" />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        background: msg.role === 'user' ? '#4CAF50' : '#F5F9F5',
                        border: msg.role === 'assistant' ? '1px solid #E8F5E9' : 'none',
                        borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        padding: '8px 12px',
                        maxWidth: '85%',
                        color: msg.role === 'user' ? '#FFFFFF' : '#1A1A1A',
                        fontSize: 11,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ background: '#F5F9F5', border: '1px solid #E8F5E9', borderRadius: '14px 14px 14px 4px', padding: '10px 14px' }}>
                      <Loader2 size={13} color="#4CAF50" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  display: 'flex', gap: 8, padding: '10px 14px',
                  borderTop: '1px solid #E8F5E9', flexShrink: 0,
                  paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
                }}
              >
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Ask your doubt..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: '#F5F9F5',
                    border: '1px solid #E8F5E9',
                    borderRadius: 20,
                    padding: '9px 14px',
                    color: '#1A1A1A',
                    fontSize: 11,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: loading || !input.trim() ? '#E8F5E9' : '#4CAF50',
                    border: 'none',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={14} color="#fff" />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
