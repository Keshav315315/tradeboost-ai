import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, TrendingUp, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#F5F9F5',
  border: '1.5px solid #C8E6C9',
  borderRadius: 14,
  paddingTop: 14,
  paddingBottom: 14,
  paddingLeft: 46,
  paddingRight: 16,
  color: '#1A1A1A',
  fontSize: 14,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const iconWrap = {
  position: 'absolute',
  left: 15,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#AAAAAA',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
}

const onFocus = e => {
  e.target.style.borderColor = '#4CAF50'
  e.target.style.boxShadow   = '0 0 0 3px rgba(76,175,80,0.12)'
}
const onBlur = e => {
  e.target.style.borderColor = '#C8E6C9'
  e.target.style.boxShadow   = 'none'
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) { toast.error('Please enter a valid email address!'); return }
    setLoading(true)
    const { error } = await resetPassword(email.trim())
    setLoading(false)
    if (error) { toast.error(error.message) } else { setSent(true) }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F9F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background subtle orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 60%)',
          top: '-160px', right: '-120px',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(46,125,50,0.06) 0%, transparent 60%)',
          bottom: '-140px', left: '-100px',
        }} />
      </div>

      <motion.div
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{
              display: 'inline-flex',
              padding: 15,
              borderRadius: 20,
              background: '#4CAF50',
              boxShadow: '0 8px 32px rgba(76,175,80,0.35)',
              marginBottom: 18,
            }}
          >
            <TrendingUp size={28} color="#fff" strokeWidth={2.2} />
          </motion.div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 8, lineHeight: 1 }}>
            <span style={{ color: '#1B6B1B' }}>Trade</span>
            <span style={{ color: '#4CAF50' }}>Boost</span>
            <span style={{ color: '#1B6B1B' }}>.AI</span>
          </h1>
          <p style={{ color: '#555555', fontSize: 13, fontWeight: 400 }}>
            Learn. Practice.{' '}
            <span style={{ color: '#4CAF50', fontWeight: 600 }}>Become a Pro.</span>
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8F5E9',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(76,175,80,0.1)',
          }}
        >
          {sent ? (
            <motion.div
              style={{ textAlign: 'center', padding: '16px 0' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{
                display: 'inline-flex',
                padding: 18,
                borderRadius: 20,
                background: '#E8F5E9',
                border: '1px solid #C8E6C9',
                marginBottom: 20,
              }}>
                <CheckCircle2 size={36} color="#4CAF50" />
              </div>
              <h2 style={{ color: '#1A1A1A', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
                Reset link sent!
              </h2>
              <p style={{ color: '#888888', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                We've sent a password reset link to{' '}
                <strong style={{ color: '#4CAF50' }}>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#4CAF50',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#888888',
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: 'none',
                  marginBottom: 22,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#4CAF50'}
                onMouseLeave={e => e.currentTarget.style.color = '#888888'}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </Link>

              <h2 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                Reset your password
              </h2>
              <p style={{ color: '#888888', fontSize: 13, marginBottom: 28 }}>
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 26 }}>
                  <label style={{ display: 'block', color: '#888888', fontSize: 10.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><Mail size={16} /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  style={{
                    width: '100%',
                    padding: '15px 0',
                    borderRadius: 14,
                    background: loading
                      ? 'rgba(76,175,80,0.5)'
                      : 'linear-gradient(135deg, #4CAF50 0%, #43A047 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(76,175,80,0.35)',
                    transition: 'box-shadow 0.2s, background 0.2s',
                    letterSpacing: '0.01em',
                  }}
                >
                  {loading ? <LoadingSpinner size={18} color="#fff" /> : 'Send Reset Link'}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#AAAAAA', marginTop: 20 }}>
          © 2025 TradeBoost.AI · Virtual trading for learning only
        </p>
      </motion.div>
    </div>
  )
}
