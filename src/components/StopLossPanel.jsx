import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function StopLossPanel({ selectedStock, quote, holdings, onTradeExecuted }) {
  const [stopLoss,     setStopLoss]     = useState('')
  const [target,       setTarget]       = useState('')
  const [activeTab,    setActiveTab]    = useState('both')
  const [activeAlerts, setActiveAlerts] = useState([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [quantity,     setQuantity]     = useState(1)

  const currentPrice = quote?.c ?? 0

  // Match holdings by symbol (RELIANCE.NS) or displaySymbol fallback
  const holding = holdings?.find(h =>
    h.symbol === selectedStock?.symbol ||
    h.symbol === selectedStock?.displaySymbol + '.NS'
  )
  const maxQty = holding?.quantity ?? 0

  // Auto-fill SL / Target whenever stock or price changes
  useEffect(() => {
    if (currentPrice > 0) {
      setStopLoss((currentPrice * 0.95).toFixed(2))
      setTarget((currentPrice * 1.08).toFixed(2))
    }
    if (holding) setQuantity(holding.quantity)
    else         setQuantity(1)
  }, [selectedStock?.symbol, currentPrice])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchActiveAlerts() }, [selectedStock?.symbol])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchActiveAlerts = async () => {
    if (!selectedStock) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setActiveAlerts(data ?? [])
    } catch { /* ignore */ }
  }

  // Derived calculations (keep as numbers for rrRatio)
  const slNum  = parseFloat(stopLoss)  || 0
  const tgtNum = parseFloat(target)    || 0

  const slPct  = currentPrice > 0 && slNum  ? (((slNum  - currentPrice) / currentPrice) * 100).toFixed(1) : '0'
  const tgtPct = currentPrice > 0 && tgtNum ? (((tgtNum - currentPrice) / currentPrice) * 100).toFixed(1) : '0'

  const maxLoss   = slNum  && quantity ? Math.abs((currentPrice - slNum)  * quantity) : 0
  const maxProfit = tgtNum && quantity ? Math.abs((tgtNum - currentPrice) * quantity) : 0
  const rrRatio   = maxLoss > 0 && maxProfit > 0 ? (maxProfit / maxLoss).toFixed(1) : '0'

  const setQuickSL     = (pct) => setStopLoss((currentPrice * (1 + pct / 100)).toFixed(2))
  const setQuickTarget = (pct) => setTarget  ((currentPrice * (1 + pct / 100)).toFixed(2))

  const handleSetAlerts = async () => {
    if (!selectedStock || !holding) {
      toast.error('You must hold this stock to set Stop Loss!')
      return
    }
    if ((activeTab === 'stop_loss' || activeTab === 'both') && slNum >= currentPrice) {
      toast.error('Stop Loss must be BELOW current price!')
      return
    }
    if ((activeTab === 'target' || activeTab === 'both') && tgtNum <= currentPrice) {
      toast.error('Target must be ABOVE current price!')
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const alerts = []

      if (activeTab === 'stop_loss' || activeTab === 'both') {
        alerts.push({
          user_id: user.id, symbol: selectedStock.displaySymbol,
          company_name: selectedStock.description,
          alert_type: 'stop_loss', trigger_price: slNum,
          quantity, avg_buy_price: holding.avg_price, status: 'active',
        })
      }
      if (activeTab === 'target' || activeTab === 'both') {
        alerts.push({
          user_id: user.id, symbol: selectedStock.displaySymbol,
          company_name: selectedStock.description,
          alert_type: 'target', trigger_price: tgtNum,
          quantity, avg_buy_price: holding.avg_price, status: 'active',
        })
      }

      const { error } = await supabase.from('price_alerts').insert(alerts)
      if (error) throw error

      toast.success(
        activeTab === 'both'       ? `✅ SL ₹${stopLoss} & Target ₹${target} set!`
        : activeTab === 'stop_loss' ? `🛡️ Stop Loss set at ₹${stopLoss}`
        :                             `🎯 Target set at ₹${target}`
      )
      fetchActiveAlerts()
    } catch (err) {
      toast.error('Failed to set alert: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelAlert = async (alertId) => {
    await supabase.from('price_alerts').update({ status: 'cancelled' }).eq('id', alertId)
    toast('Alert cancelled')
    fetchActiveAlerts()
  }

  // ── Shared button style ───────────────────────────────────────────────────────
  const qBtn = (bg, color, border) => ({
    flex: 1, padding: '4px 0', borderRadius: 20,
    fontSize: 9, fontWeight: 700, cursor: 'pointer',
    background: bg, color, border: `1px solid ${border}`,
  })

  return (
    <div style={{ margin: '0 12px 12px' }}>

      {/* ── MAIN PANEL ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8F5E9', overflow: 'hidden', marginBottom: 10 }}>

        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 800 }}>🛡️ Stop Loss & Target</span>
          {!holding && (
            <span style={{ background: '#FFF8E1', color: '#E65100', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: '1px solid #FFE082' }}>
              Buy stock first
            </span>
          )}
        </div>

        <div style={{ padding: '12px 14px' }}>

          {/* Order type tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { id: 'stop_loss', label: '📉 Stop Loss', ac: '#C62828', bg: '#FFEBEE', br: '#FFCDD2' },
              { id: 'target',    label: '🎯 Target',    ac: '#2E7D32', bg: '#E8F5E9', br: '#C8E6C9' },
              { id: 'both',      label: '📊 Both',      ac: '#1565C0', bg: '#E3F2FD', br: '#BBDEFB' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 4px', borderRadius: 10,
                  fontSize: 10, fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? tab.bg : '#F5F5F5',
                  color:      activeTab === tab.id ? tab.ac : '#888',
                  border:     `1px solid ${activeTab === tab.id ? tab.br : '#E0E0E0'}`,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quantity selector */}
          {holding && (
            <div style={{ background: '#F8FFF8', borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E8F5E9' }}>
              <span style={{ color: '#888', fontSize: 10 }}>Quantity to protect</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {[
                  { label: '−', fn: () => setQuantity(q => Math.max(1, q - 1)) },
                  { label: '+', fn: () => setQuantity(q => Math.min(maxQty, q + 1)) },
                ].reduce((acc, btn, i) => {
                  const el = (
                    <button key={btn.label} onClick={btn.fn}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {btn.label}
                    </button>
                  )
                  if (i === 0) return [el,
                    <span key="qty" style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{quantity}</span>
                  ]
                  return [...acc, el]
                }, [])}
                <span style={{ color: '#888', fontSize: 10 }}>/ {maxQty} shares</span>
              </div>
            </div>
          )}

          {/* Stop Loss input */}
          {(activeTab === 'stop_loss' || activeTab === 'both') && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#C62828', fontSize: 11, fontWeight: 700 }}>🛡️ Stop Loss Price</span>
                <span style={{ color: '#888', fontSize: 10 }}>{slPct}% from current</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, background: '#F8FAF8', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#888', fontSize: 13 }}>₹</span>
                  <input
                    type="number" value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#C62828', fontSize: 14, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '6px 10px', color: '#C62828', fontSize: 11, fontWeight: 800 }}>{slPct}%</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[-2, -5, -8, -10].map(p => (
                  <button key={p} onClick={() => setQuickSL(p)} style={qBtn('#FFEBEE', '#C62828', '#FFCDD2')}>{p}%</button>
                ))}
              </div>
            </div>
          )}

          {/* Target input */}
          {(activeTab === 'target' || activeTab === 'both') && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#2E7D32', fontSize: 11, fontWeight: 700 }}>🎯 Target Price</span>
                <span style={{ color: '#888', fontSize: 10 }}>+{tgtPct}% from current</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, background: '#F8FAF8', border: '1px solid #C8E6C9', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#888', fontSize: 13 }}>₹</span>
                  <input
                    type="number" value={target}
                    onChange={e => setTarget(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#2E7D32', fontSize: 14, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 8, padding: '6px 10px', color: '#2E7D32', fontSize: 11, fontWeight: 800 }}>+{tgtPct}%</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[3, 5, 8, 10].map(p => (
                  <button key={p} onClick={() => setQuickTarget(p)} style={qBtn('#E8F5E9', '#2E7D32', '#C8E6C9')}>+{p}%</button>
                ))}
              </div>
            </div>
          )}

          {/* Price level visualisation */}
          {currentPrice > 0 && (stopLoss || target) && (
            <div style={{ background: '#F8FAF8', borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: '1px solid #F0F0F0' }}>
              <div style={{ color: '#888', fontSize: 9, textAlign: 'center', marginBottom: 16, fontWeight: 600, letterSpacing: '0.06em' }}>
                PRICE LEVEL VISUALIZATION
              </div>

              {/* Track */}
              <div style={{ position: 'relative', height: 6, background: '#E0E0E0', borderRadius: 3, margin: '0 16px 28px' }}>
                {/* SL dot */}
                {(activeTab === 'stop_loss' || activeTab === 'both') && stopLoss && (
                  <div style={{ position: 'absolute', left: '8%', top: -5, width: 16, height: 16, borderRadius: '50%', background: '#C62828', border: '2px solid #fff' }}>
                    <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', color: '#C62828', fontSize: 8, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      SL ₹{slNum.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
                {/* Current price dot */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -6, width: 18, height: 18, borderRadius: '50%', background: '#4CAF50', border: '2px solid #fff' }}>
                  <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: '#4CAF50', fontSize: 8, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                {/* Target dot */}
                {(activeTab === 'target' || activeTab === 'both') && target && (
                  <div style={{ position: 'absolute', right: '8%', top: -5, width: 16, height: 16, borderRadius: '50%', background: '#2E7D32', border: '2px solid #fff' }}>
                    <div style={{ position: 'absolute', top: 18, right: '50%', transform: 'translateX(50%)', color: '#2E7D32', fontSize: 8, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      TGT ₹{tgtNum.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Risk/Reward boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ color: '#C62828', fontSize: 12, fontWeight: 800 }}>-₹{Math.round(maxLoss).toLocaleString('en-IN')}</div>
                  <div style={{ color: '#EF9A9A', fontSize: 8 }}>Max Loss</div>
                </div>
                <div style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ color: '#1565C0', fontSize: 12, fontWeight: 800 }}>1:{rrRatio}</div>
                  <div style={{ color: '#90CAF9', fontSize: 8 }}>Risk/Reward</div>
                </div>
                <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ color: '#2E7D32', fontSize: 12, fontWeight: 800 }}>+₹{Math.round(maxProfit).toLocaleString('en-IN')}</div>
                  <div style={{ color: '#A5D6A7', fontSize: 8 }}>Max Profit</div>
                </div>
              </div>
            </div>
          )}

          {/* Set button */}
          <button
            onClick={handleSetAlerts}
            disabled={isLoading || !holding}
            style={{
              width: '100%', background: holding ? '#4CAF50' : '#E0E0E0',
              color: holding ? '#fff' : '#888', border: 'none',
              borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 800,
              cursor: holding ? 'pointer' : 'not-allowed',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {isLoading      ? 'Setting...'
              : !holding    ? 'Buy this stock first to set alerts'
              : activeTab === 'both'       ? '✅ Set Stop Loss & Target'
              : activeTab === 'stop_loss'  ? '🛡️ Set Stop Loss'
              :                              '🎯 Set Target Price'}
          </button>

          {!holding && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 10, marginTop: 6 }}>
              You need to hold {selectedStock?.displaySymbol} shares to set price alerts
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE ALERTS LIST ──────────────────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8F5E9', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 800 }}>Active Alerts ({activeAlerts.length})</span>
            <span style={{ color: '#4CAF50', fontSize: 10, fontWeight: 600 }}>🟢 Monitoring</span>
          </div>

          {activeAlerts.map((alert, idx) => (
            <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: idx < activeAlerts.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: alert.alert_type === 'stop_loss' ? '#FFEBEE' : '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {alert.alert_type === 'stop_loss' ? '🛡️' : '🎯'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1A1A1A', fontSize: 12, fontWeight: 700 }}>
                  {alert.symbol}
                  <span style={{ background: alert.alert_type === 'stop_loss' ? '#FFEBEE' : '#E8F5E9', color: alert.alert_type === 'stop_loss' ? '#C62828' : '#2E7D32', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20, marginLeft: 6 }}>
                    {alert.alert_type === 'stop_loss' ? 'STOP LOSS' : 'TARGET'}
                  </span>
                </div>
                <div style={{ color: '#888', fontSize: 10, marginTop: 2 }}>
                  Sell {alert.quantity} shares if price {alert.alert_type === 'stop_loss' ? '≤' : '≥'} ₹{Number(alert.trigger_price).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: alert.alert_type === 'stop_loss' ? '#C62828' : '#2E7D32', fontSize: 13, fontWeight: 800 }}>
                  ₹{Number(alert.trigger_price).toLocaleString('en-IN')}
                </div>
                <button
                  onClick={() => cancelAlert(alert.id)}
                  style={{ background: '#F5F5F5', border: '1px solid #E0E0E0', borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#888', cursor: 'pointer', marginTop: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Cancel ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
