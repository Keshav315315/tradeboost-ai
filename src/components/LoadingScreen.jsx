import { TrendingUp } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F8FAF8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            padding: 8,
            borderRadius: 12,
            background: '#4CAF50',
            display: 'flex',
            boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
          }}
        >
          <TrendingUp size={20} color="#fff" />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1B6B1B' }}>Trade</span>
          <span style={{ color: '#4CAF50' }}>Boost</span>
          <span style={{ color: '#1B6B1B' }}>.AI</span>
        </span>
      </div>

      {/* Spinner */}
      <LoadingSpinner size={28} color="#4CAF50" />

      <p style={{ color: '#888888', fontSize: 12, fontWeight: 500 }}>Loading your dashboard...</p>
    </div>
  )
}
