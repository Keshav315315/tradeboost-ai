import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import TradingViewWidget from '../components/TradingViewWidget'

export default function ChartPage() {
  const { symbol } = useParams()
  const navigate   = useNavigate()

  return (
    <div
      style={{
        background: '#F8FAF8',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #EBF5EB',
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#F5F9F5',
            border: '1px solid #E8F5E9',
            borderRadius: 10,
            padding: '7px 9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={16} color="#1A1A1A" />
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
            {symbol}
          </p>
          <p style={{ color: '#888888', fontSize: 10, marginTop: 3 }}>
            NSE · Live Chart
          </p>
        </div>

        <div
          style={{
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            borderRadius: 8,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ExternalLink size={11} color="#4CAF50" />
          <span style={{ color: '#4CAF50', fontSize: 10, fontWeight: 700 }}>TradingView</span>
        </div>
      </div>

      {/* Chart fills all remaining space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TradingViewWidget symbol={symbol} />
      </div>
    </div>
  )
}
