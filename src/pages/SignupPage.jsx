import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

function mapError(msg = '') {
  if (msg.includes('User already registered'))      return 'This email is already registered!'
  if (msg.includes('Password should be at least'))  return 'Password must be at least 6 characters!'
  if (msg.includes('Invalid email'))                return 'Please enter a valid email address!'
  if (msg.includes('Email not confirmed'))          return 'Please verify your email first!'
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Please check your internet connection!'
  return msg || 'Something went wrong. Please try again.'
}

// ── Shared input style ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name.trim())            { toast.error('Please enter your full name!'); return }
    if (!email.includes('@'))    { toast.error('Please enter a valid email!'); return }
    if (password.length < 6)    { toast.error('Password must be at least 6 characters!'); return }

    setLoading(true)
    const { data, error } = await signUp({
      email: email.trim(),
      password,
      fullName: name.trim(),
    })

    if (error) {
      setLoading(false)
      toast.error(mapError(error.message))
      return
    }

    if (data?.user) {
      await supabase.from('profiles').upsert(
        {
          id:              data.user.id,
          full_name:       name.trim(),
          email:           email.trim(),
          virtual_balance: 100000,
        },
        { onConflict: 'id' }
      )
    }

    setLoading(false)

    if (!data?.session) {
      toast.success('Account created! Check your email to confirm, then sign in.')
      navigate('/login', { replace: true })
      return
    }

    toast.success('Account created! Welcome to TradeBoost.AI 🎉')
    navigate('/home', { replace: true })
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    setGoogleLoading(false)
    if (error) toast.error(mapError(error.message))
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
      {/* ── Background subtle orbs ─────────────────────────────────────── */}
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
        {/* ── Logo ─────────────────────────────────────────────────────── */}
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

        {/* ── Card ─────────────────────────────────────────────────────── */}
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
          <h2 style={{ color: '#1A1A1A', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Create your account 🚀
          </h2>
          <p style={{ color: '#888888', fontSize: 13, marginBottom: 28 }}>
            Join free and start your trading journey today
          </p>

          <form onSubmit={handleSignup} noValidate>

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888888', fontSize: 10.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><User size={16} /></span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
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

            {/* Password */}
            <div style={{ marginBottom: 26 }}>
              <label style={{ display: 'block', color: '#888888', fontSize: 10.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><Lock size={16} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  style={{ ...inputBase, paddingRight: 46 }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#AAAAAA', display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Create account button */}
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
              {loading ? <LoadingSpinner size={18} color="#fff" /> : 'Create Account'}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
            <span style={{ color: '#AAAAAA', fontSize: 12 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
          </div>

          {/* Google */}
          <motion.button
            onClick={handleGoogle}
            disabled={googleLoading}
            whileHover={{ scale: googleLoading ? 1 : 1.01 }}
            whileTap={{ scale: googleLoading ? 1 : 0.99 }}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 14,
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
              color: '#1A1A1A',
              fontSize: 14,
              fontWeight: 600,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'background 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {googleLoading ? (
              <LoadingSpinner size={17} color="#888888" />
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"/>
                  <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24Z"/>
                  <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z"/>
                  <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"/>
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888888', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4CAF50', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </motion.div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#AAAAAA', marginTop: 20 }}>
          © 2025 TradeBoost.AI · Virtual trading for learning only
        </p>
      </motion.div>
    </div>
  )
}
