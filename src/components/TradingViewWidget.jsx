import { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ symbol }) {
  const container = useRef()
  const scriptRef = useRef()

  useEffect(() => {
    if (scriptRef.current) return

    container.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    container.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `NSE:${symbol}`,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(5, 11, 24, 0)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      hide_top_toolbar: false,
      hide_legend: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      withdateranges: true,
      allow_symbol_change: false,
      details: false,
      hotlist: false,
      watchlist: false,
      studies: [],
      show_popup_button: false,
    })
    scriptRef.current = script
    container.current.appendChild(script)

    return () => {
      if (container.current) container.current.innerHTML = ''
      scriptRef.current = null
    }
  }, [symbol])

  return (
    <div
      ref={container}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    />
  )
}

export default memo(TradingViewWidget)
