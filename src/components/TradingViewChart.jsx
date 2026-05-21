export default function TradingViewChart({ symbol }) {
  const clean = (symbol ?? '')
    .replace('.NS', '')
    .replace('.BSE', '')
    .toUpperCase()

  return (
    <div style={{
      width: '100%',
      height: '350px',
      borderRadius: '0 0 12px 12px',
      overflow: 'hidden',
      border: '1px solid #E8F5E9',
      borderTop: 'none',
      background: '#fff',
    }}>
      <iframe
        key={clean}
        src={`https://www.tradingview.com/widgetembed/?frameElementId=tv_${clean}&symbol=NSE%3A${clean}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=0&saveimage=0&toolbarbg=ffffff&studies=%5B%5D&theme=light&style=1&timezone=Asia%2FKolkata&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart`}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allowTransparency={true}
        scrolling="no"
        allowFullScreen={true}
        title={`${clean} Chart`}
      />
    </div>
  )
}
