import { useEffect, useRef, memo } from 'react'

function TradingViewMiniWidget({ symbol }) {
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: `NSE:${symbol}`,
      width: '100%',
      height: 150,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      trendLineColor: 'rgba(82, 130, 255, 1)',
      underLineColor: 'rgba(82, 130, 255, 0.1)',
      underLineBottomColor: 'rgba(5, 11, 24, 0)',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      noTimeScale: false,
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
        height: '150px',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
    />
  )
}

export default memo(TradingViewMiniWidget)
