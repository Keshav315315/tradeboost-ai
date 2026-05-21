// Enhanced lesson content with rich block types for 5 key lessons.
// Other lesson IDs fall back to plain text (HighlightedContent).

export const LESSONS_ENHANCED = {

  // ── Section 1, Lesson 1 ─────────────────────────────────────────────────────
  '1-1': {
    blocks: [
      {
        type: 'intro',
        emoji: '🏛️',
        title: 'What is the Stock Market?',
        subtitle: 'The world\'s largest marketplace — where businesses meet investors.',
      },
      {
        type: 'paragraph',
        text: 'The stock market is a platform where buyers and sellers trade shares of publicly listed companies. When you buy a share, you own a small piece of that company — its profits, losses, and future growth.',
      },
      {
        type: 'visual_comparison',
        title: 'India\'s Two Major Exchanges',
        left: {
          label: 'NSE',
          full: 'National Stock Exchange',
          color: '#1565C0',
          bg: '#E3F2FD',
          points: ['Founded 1992', 'Trades Nifty 50 index', 'Fully electronic', '~1,800+ listed stocks', 'Largest by volume'],
        },
        right: {
          label: 'BSE',
          full: 'Bombay Stock Exchange',
          color: '#6A1B9A',
          bg: '#F3E5F5',
          points: ['Founded 1875', 'Trades Sensex index', 'Asia\'s oldest exchange', '~5,500+ listed stocks', 'Largest by listings'],
        },
      },
      {
        type: 'paragraph',
        text: 'Both exchanges are regulated by SEBI (Securities and Exchange Board of India). SEBI acts like a police force — making sure companies and brokers follow fair rules.',
      },
      {
        type: 'steps',
        title: 'How a Trade Happens',
        steps: [
          { num: 1, text: 'You open a Demat + trading account with a broker (Zerodha, Groww, Upstox etc.)' },
          { num: 2, text: 'You place a buy order — "Buy 10 shares of TATAMOTORS at ₹900"' },
          { num: 3, text: 'The exchange matches your order with a seller at the same price' },
          { num: 4, text: 'Trade executes in milliseconds — shares land in your Demat account' },
          { num: 5, text: 'Settlement happens in T+1 day (money & shares swap next day)' },
        ],
      },
      {
        type: 'example',
        ticker: 'TATAMOTORS',
        label: 'Real Example',
        lines: [
          'Price today: ₹910 per share',
          'You buy 10 shares → spend ₹9,100',
          'Tata Motors grows, price rises to ₹1,050',
          'You sell → get ₹10,500 → profit ₹1,400 (15.4%)',
          'That\'s the stock market in action!',
        ],
      },
      {
        type: 'bullets',
        title: 'Key Terms to Know',
        items: [
          'Demat Account — your digital locker that holds shares',
          'IPO — when a company lists on exchange for the first time',
          'Nifty 50 — top 50 companies on NSE; India\'s benchmark index',
          'Sensex — top 30 companies on BSE; oldest Indian index',
          'Market Cap — total value of a company = Price × Total Shares',
        ],
      },
      {
        type: 'takeaway',
        text: 'The stock market connects people who want to grow wealth with companies that need money to grow. You profit when those companies succeed.',
      },
    ],
  },

  // ── Section 1, Lesson 2 ─────────────────────────────────────────────────────
  '1-2': {
    blocks: [
      {
        type: 'intro',
        emoji: '📄',
        title: 'What is a Share?',
        subtitle: 'Owning a share = owning a piece of a real business.',
      },
      {
        type: 'paragraph',
        text: 'A share (also called a stock) is a unit of ownership in a company. When a company needs money to grow, it splits itself into millions of tiny pieces and sells them to the public. Each piece is one share.',
      },
      {
        type: 'visual_comparison',
        title: 'Two Types of Shares',
        left: {
          label: 'Equity',
          full: 'Equity Shares',
          color: '#2E7D32',
          bg: '#E8F5E9',
          points: ['You get voting rights', 'Higher risk, higher reward', 'Dividends not guaranteed', 'Most common type', 'Price changes daily'],
        },
        right: {
          label: 'Preference',
          full: 'Preference Shares',
          color: '#E65100',
          bg: '#FFF3E0',
          points: ['Fixed dividend first', 'Lower risk profile', 'No voting rights', 'Priority in liquidation', 'Less common on exchanges'],
        },
      },
      {
        type: 'steps',
        title: 'How Share Price Changes',
        steps: [
          { num: 1, text: 'Company reports strong quarterly earnings (profits up 40%)' },
          { num: 2, text: 'More investors want to buy the stock' },
          { num: 3, text: 'Demand exceeds supply → price rises' },
          { num: 4, text: 'Bad news (scandal, poor results) → selling pressure → price drops' },
          { num: 5, text: 'Price = what the market BELIEVES the company is worth right now' },
        ],
      },
      {
        type: 'example',
        ticker: 'INFY',
        label: 'Infosys Example',
        lines: [
          'Infosys has ~4.16 billion shares outstanding',
          'If price = ₹1,800 → Market Cap = ₹7.48 Lakh Crore',
          'You buy 5 shares at ₹1,800 = ₹9,000 invested',
          'Infosys wins a major US contract → price jumps to ₹2,100',
          'Your 5 shares = ₹10,500 → profit ₹1,500 in days',
        ],
      },
      {
        type: 'bullets',
        title: 'What Shareholders Get',
        items: [
          'Capital gains — profit if share price rises above your buy price',
          'Dividends — company shares profits (not all companies pay these)',
          'Voting rights — vote on company decisions at AGMs (equity shares)',
          'Bonus shares — company issues free extra shares sometimes',
          'Rights issue — buy new shares before the public at a discount',
        ],
      },
      {
        type: 'takeaway',
        text: 'Every time you buy a share, you become a real part-owner of that company. Your wealth grows as the company grows.',
      },
    ],
  },

  // ── Section 3, Lesson 1 ─────────────────────────────────────────────────────
  '3-1': {
    blocks: [
      {
        type: 'intro',
        emoji: '🕯️',
        title: 'Reading Candlestick Charts',
        subtitle: 'Candlesticks show 4 prices in one visual — master them and charts speak to you.',
      },
      {
        type: 'paragraph',
        text: 'A candlestick is a single bar that shows 4 key prices for a given time period: Open, High, Low, and Close. These four prices, called OHLC, tell the story of a battle between buyers and sellers.',
      },
      {
        type: 'candlestick_visual',
        title: 'Anatomy of a Candlestick',
        candles: [
          { open: 100, high: 130, low: 85, close: 125, label: 'Bullish (Green)\nClose > Open', color: '#4CAF50' },
          { open: 120, high: 135, low: 90, close: 95, label: 'Bearish (Red)\nOpen > Close', color: '#E53935' },
        ],
      },
      {
        type: 'steps',
        title: 'Reading OHLC — Step by Step',
        steps: [
          { num: 1, text: 'Open — price at start of the candle period (market open or interval open)' },
          { num: 2, text: 'High — highest price buyers pushed the stock to in that period' },
          { num: 3, text: 'Low — lowest price sellers pushed the stock down to' },
          { num: 4, text: 'Close — final price when the period ended; most important of the four' },
          { num: 5, text: 'Green candle: Close > Open (buyers won). Red candle: Close < Open (sellers won).' },
        ],
      },
      {
        type: 'example',
        ticker: 'RELIANCE',
        label: 'Reliance Industries — One Day',
        lines: [
          'Open:  ₹2,840',
          'High:  ₹2,897  ← wicks show intraday extremes',
          'Low:   ₹2,815',
          'Close: ₹2,878  ← closed higher than opened',
          'Result: GREEN candle — buyers dominated the day',
        ],
      },
      {
        type: 'warning',
        text: 'One candle means nothing alone. Always look at a series of candles together — patterns emerge over 3-5 candles and that\'s where the real signal lies.',
      },
      {
        type: 'bullets',
        title: 'Common Single-Candle Patterns',
        items: [
          'Doji — open ≈ close, means market indecision (neither bulls nor bears won)',
          'Hammer — small body at top, long lower wick — potential reversal from downtrend',
          'Shooting Star — small body at bottom, long upper wick — potential reversal from uptrend',
          'Marubozu — no wicks at all — very strong momentum (all bull or all bear)',
        ],
      },
      {
        type: 'takeaway',
        text: 'Green candle = buyers won that period. Red candle = sellers won. Wick length shows how far price was pushed before being rejected — long wicks = high volatility.',
      },
    ],
  },

  // ── Section 4, Lesson 1 ─────────────────────────────────────────────────────
  '4-1': {
    blocks: [
      {
        type: 'intro',
        emoji: '📊',
        title: 'RSI — Relative Strength Index',
        subtitle: 'A momentum oscillator that tells you when a stock is exhausted from moving.',
      },
      {
        type: 'paragraph',
        text: 'RSI is a number between 0 and 100 that measures how fast and how much a stock\'s price has moved recently. It helps you spot when a stock is overbought (due for a pullback) or oversold (due for a bounce).',
      },
      {
        type: 'formula',
        title: 'RSI Formula',
        formula: 'RSI = 100 − [ 100 ÷ (1 + RS) ]',
        legend: 'RS = Average Gain over N days ÷ Average Loss over N days\nDefault N = 14 days',
      },
      {
        type: 'rsi_visual',
        title: 'RSI Zones — What Each Level Means',
        zones: [
          { range: '70 – 100', label: 'Overbought', color: '#E53935', bg: '#FFEBEE', desc: 'Stock has risen too fast. Possible pullback ahead. Do not buy into this zone blindly.' },
          { range: '30 – 70', label: 'Neutral Zone', color: '#F57C00', bg: '#FFF3E0', desc: 'No extreme signal. Watch for direction. Most of the time price is here.' },
          { range: '0 – 30', label: 'Oversold', color: '#2E7D32', bg: '#E8F5E9', desc: 'Stock has fallen too fast. Possible bounce ahead. Look for buying opportunity.' },
        ],
      },
      {
        type: 'example',
        ticker: 'HDFCBANK',
        label: 'HDFC Bank — RSI in Action',
        lines: [
          'HDFC Bank fell sharply over 10 days (bad macro news)',
          'RSI dropped to 24 → entered oversold zone',
          'Technical traders started buying (contrarian signal)',
          'Stock bounced 8% over next 5 sessions',
          'RSI rose back to 52 → neutral, signal neutralized',
        ],
      },
      {
        type: 'warning',
        text: 'RSI alone is not enough. A stock can stay overbought for weeks in a strong bull trend. Always use RSI with at least one other indicator (EMA, MACD, volume) to confirm signals.',
      },
      {
        type: 'takeaway',
        text: 'RSI > 70 = caution (may pull back). RSI < 30 = opportunity (may bounce). RSI crossing 50 from below = growing bullish momentum.',
      },
    ],
  },

  // ── Section 5, Lesson 1 ─────────────────────────────────────────────────────
  '5-1': {
    blocks: [
      {
        type: 'intro',
        emoji: '🛡️',
        title: 'Stop Loss — Your Financial Seatbelt',
        subtitle: 'Stop loss is not optional. It\'s the single most important rule in trading.',
      },
      {
        type: 'paragraph',
        text: 'A stop loss is a pre-set price at which you automatically sell a position to limit your loss. Without a stop loss, one bad trade can wipe out months of gains. Every professional trader uses them — no exceptions.',
      },
      {
        type: 'steps',
        title: 'How to Set a Stop Loss — 5 Steps',
        steps: [
          { num: 1, text: 'Identify your entry price (price you buy at): ₹500' },
          { num: 2, text: 'Decide maximum loss you can accept: 5% of investment' },
          { num: 3, text: 'Calculate SL level: ₹500 × (1 − 0.05) = ₹475' },
          { num: 4, text: 'Place a stop-loss order at ₹475 with your broker immediately after buying' },
          { num: 5, text: 'If price drops to ₹475 → trade exits automatically, loss capped at 5%' },
        ],
      },
      {
        type: 'example',
        ticker: 'WIPRO',
        label: 'Wipro — Stop Loss Saves Capital',
        lines: [
          'Bought 100 shares of Wipro at ₹460',
          'Set stop loss at ₹437 (5% below entry)',
          'Wipro missed earnings → stock crashed to ₹410',
          'WITHOUT stop loss: loss = ₹5,000 (10.9%)',
          'WITH stop loss: exited at ₹437 → loss only ₹2,300 (5%)',
          'Saved ₹2,700 to fight another trade',
        ],
      },
      {
        type: 'warning',
        text: 'NEVER move your stop loss further away from price to "give it more room." This is the #1 mistake beginners make. Move stop loss only upward (to lock in profits), never downward.',
      },
      {
        type: 'formula',
        title: 'Position Sizing with Stop Loss',
        formula: 'Shares to Buy = Risk Amount ÷ (Entry Price − Stop Loss Price)',
        legend: 'Risk Amount = how much ₹ you\'re willing to lose on this one trade\nExample: Risk ₹2,000, Entry ₹500, SL ₹475 → 2000 ÷ 25 = 80 shares',
      },
      {
        type: 'bullets',
        title: 'Types of Stop Loss Orders',
        items: [
          'Fixed SL — set at a specific price (₹475), most common for beginners',
          'Trailing SL — moves up automatically as price rises (locks profits)',
          'Percentage SL — always X% below current price (e.g. 5%)',
          'ATR-based SL — uses Average True Range for volatility-adjusted stops',
        ],
      },
      {
        type: 'takeaway',
        text: 'Professionals don\'t lose big — they lose small. Stop loss is what separates disciplined traders from gamblers. Set it before you enter, never after.',
      },
    ],
  },
}
