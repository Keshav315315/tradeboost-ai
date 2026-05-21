export const SECTIONS = [
  {
    id: 1,
    title: 'Basics',
    icon: '📖',
    color: '#E8F5E9',
    xp: 40,
    description: 'What is stock market, shares, NSE/BSE',
    lessons: [
      {
        id: '1-1',
        title: 'What is the Stock Market?',
        duration: 5,
        content: `The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. In India, we have two main exchanges — NSE (National Stock Exchange) and BSE (Bombay Stock Exchange).

When a company wants to raise money, it lists itself on the stock exchange through an IPO (Initial Public Offering). After listing, anyone can buy and sell its shares.

Key points:
- NSE is located in Mumbai, established in 1992
- BSE is Asia's oldest exchange, established in 1875
- Nifty 50 tracks top 50 NSE companies
- Sensex tracks top 30 BSE companies

Real example: When you buy 1 share of Tata Motors on NSE, you become a tiny owner of Tata Motors. If the company does well, your share price goes up!`,
      },
      {
        id: '1-2',
        title: 'What is a Share?',
        duration: 4,
        content: `A share represents a unit of ownership in a company. When a company divides its ownership into small units and sells them to the public, each unit is called a share or stock.

Types of shares:
- Equity shares: Most common, give voting rights
- Preference shares: Fixed dividend, no voting rights

Example: Infosys has about 416 crore shares. If you own 100 shares, you own a tiny fraction of Infosys!

Why buy shares?
- Capital appreciation (price goes up)
- Dividends (company shares profits)
- Voting rights in company decisions`,
      },
      {
        id: '1-3',
        title: 'Demat Account',
        duration: 5,
        content: `A Demat (Dematerialized) account holds your shares in electronic form — just like a bank account holds money.

Steps to invest:
1. Open a Demat account (Zerodha, Groww, Upstox)
2. Complete KYC with Aadhaar and PAN
3. Add money to your trading account
4. Buy shares through the trading platform

Important: You need BOTH a Demat account (to hold shares) and a Trading account (to buy/sell shares). Most brokers provide both together.`,
      },
    ],
    quiz: [
      {
        q: 'What does NSE stand for?',
        options: ['National Stock Exchange', 'New Stock Exchange', 'National Securities Exchange', 'None'],
        correct: 0,
        explanation: 'NSE stands for National Stock Exchange, established in 1992 in Mumbai.',
      },
      {
        q: 'When you buy a share, what do you become?',
        options: ['A creditor of the company', 'A part-owner of the company', 'An employee of the company', 'A debtor'],
        correct: 1,
        explanation: 'Buying shares makes you a part-owner (shareholder) of the company.',
      },
      {
        q: 'What is a Demat account used for?',
        options: ['Storing cash', 'Holding shares in electronic form', 'Paying taxes', 'Getting loans'],
        correct: 1,
        explanation: 'Demat account holds your shares electronically, just like a bank holds your money.',
      },
    ],
  },
  {
    id: 2,
    title: 'How Market Works',
    icon: '📈',
    color: '#E3F2FD',
    xp: 40,
    description: 'IPO, Demat account, Bull/Bear market',
    lessons: [
      {
        id: '2-1',
        title: 'How Stock Prices Move',
        duration: 5,
        content: `Stock prices move based on supply and demand. When more people want to buy a stock (demand), price goes up. When more want to sell (supply), price goes down.

Factors that move prices:
- Company earnings (profit/loss results)
- News and events (new product launch, scandal)
- Market sentiment (overall mood)
- Economic data (GDP, inflation, RBI rates)
- FII/DII activity (foreign and domestic investors)

Example: When Zomato reported better-than-expected profits in Q2 2024, its stock jumped 8% in a single day because more investors wanted to buy it!`,
      },
      {
        id: '2-2',
        title: 'Bull vs Bear Market',
        duration: 4,
        content: `Bull Market: When prices are rising or expected to rise. Investors are optimistic.
Example: Indian markets in 2023 saw a strong bull run with Nifty crossing 20,000!

Bear Market: When prices fall 20% or more from recent highs. Investors are pessimistic.
Example: COVID crash in March 2020 — Nifty fell from 12,000 to 7,500!

Key terms:
- Rally: Short-term price increase
- Correction: 10-20% drop from highs
- Crash: Sudden steep fall (>20%)
- Dead cat bounce: Temporary recovery in a downtrend`,
      },
      {
        id: '2-3',
        title: 'What is an IPO?',
        duration: 5,
        content: `IPO (Initial Public Offering) is when a private company sells its shares to the public for the first time.

IPO Process:
1. Company hires investment bankers
2. Files DRHP with SEBI
3. Sets price band (e.g., ₹700-720 per share)
4. Investors apply for shares
5. Shares allotted via lottery if oversubscribed
6. Stock lists on NSE/BSE

Recent famous IPOs:
- Zomato IPO (2021) — oversubscribed 38x!
- LIC IPO (2022) — India's biggest IPO ever
- Nykaa IPO (2021) — 82x oversubscribed!

GMP (Grey Market Premium) shows expected listing price before official listing.`,
      },
    ],
    quiz: [
      {
        q: 'What happens to stock price when demand increases?',
        options: ['Price falls', 'Price stays same', 'Price rises', 'Price doubles'],
        correct: 2,
        explanation: 'Higher demand means more buyers, which pushes the price up.',
      },
      {
        q: 'What is a Bear Market?',
        options: ['Market where bears trade', 'Market rising 20%+', 'Market falling 20%+ from highs', 'Market for commodity stocks'],
        correct: 2,
        explanation: 'A bear market is when prices fall 20% or more from recent highs.',
      },
      {
        q: 'What does IPO stand for?',
        options: ['Indian Public Offering', 'Initial Public Offering', 'Initial Private Offering', 'International Public Offering'],
        correct: 1,
        explanation: "IPO = Initial Public Offering. It's when a company first sells shares to the public.",
      },
    ],
  },
  {
    id: 3,
    title: 'Candlestick Charts',
    icon: '🕯️',
    color: '#FFF8E1',
    xp: 50,
    description: 'Patterns, Doji, Hammer, Engulfing',
    lessons: [
      {
        id: '3-1',
        title: 'Reading Candlestick Charts',
        duration: 6,
        content: `A candlestick shows 4 prices for a time period:
- Open: Price at start
- Close: Price at end
- High: Highest price reached
- Low: Lowest price reached

Green/White candle = Bullish (price went UP)
Close > Open

Red/Black candle = Bearish (price went DOWN)
Close < Open

The "body" shows open-to-close range.
The "wicks/shadows" show high and low.

Example: If Reliance opened at ₹2800, went high to ₹2850, low to ₹2780, and closed at ₹2840 — that's a green (bullish) candle!`,
      },
      {
        id: '3-2',
        title: 'Key Candlestick Patterns',
        duration: 7,
        content: `Reversal Patterns (signal trend change):

🔨 Hammer: Small body at top, long lower wick. Appears after downtrend. BULLISH signal — buyers fought back!

⭐ Doji: Open = Close. Shows indecision. Could go either way.

🌟 Morning Star: 3-candle pattern. Big red → small candle → big green. Strong BULLISH reversal.

🌠 Shooting Star: Small body at bottom, long upper wick. Appears after uptrend. BEARISH signal.

📊 Engulfing:
Bullish Engulfing = Green candle completely covers previous red candle. Strong buy signal!
Bearish Engulfing = Red candle completely covers previous green candle. Strong sell signal!`,
      },
    ],
    quiz: [
      {
        q: 'What does a GREEN candlestick mean?',
        options: ['Price went down', 'Price went up', 'No change in price', 'Volume was high'],
        correct: 1,
        explanation: 'A green candle means Close > Open, so price went UP during that period.',
      },
      {
        q: 'What does a Hammer candlestick signal?',
        options: ['Bearish reversal', 'Bullish reversal', 'Continuation of trend', 'Market closed'],
        correct: 1,
        explanation: 'Hammer appears after a downtrend and signals bullish reversal — buyers are taking control!',
      },
      {
        q: 'What are the 4 prices shown in a candlestick?',
        options: ['Buy, Sell, High, Low', 'Open, Close, High, Low', 'Start, End, Peak, Bottom', 'Morning, Noon, High, Low'],
        correct: 1,
        explanation: 'OHLC — Open, High, Low, Close are the 4 prices in every candlestick.',
      },
    ],
  },
  {
    id: 4,
    title: 'Indicators',
    icon: '📊',
    color: '#F3E5F5',
    xp: 60,
    description: 'RSI, MACD, Moving Averages, Bollinger Bands',
    lessons: [
      {
        id: '4-1',
        title: 'RSI — Relative Strength Index',
        duration: 6,
        content: `RSI measures how overbought or oversold a stock is. It ranges from 0 to 100.

RSI Rules:
- Above 70 = Overbought (price may fall soon)
- Below 30 = Oversold (price may rise soon)
- 50 = Neutral

Example: If HDFC Bank's RSI is 28, it means the stock has been falling heavily and might be a good buying opportunity!

RSI Divergence:
- Bullish Divergence: Stock makes lower low, but RSI makes higher low = bullish signal
- Bearish Divergence: Stock makes higher high, but RSI makes lower high = bearish signal`,
      },
      {
        id: '4-2',
        title: 'Moving Averages',
        duration: 5,
        content: `Moving Average (MA) smooths out price data to show trends.

Types:
- SMA (Simple Moving Average): Average of last N days
- EMA (Exponential Moving Average): Gives more weight to recent prices

Common periods:
- 20 EMA: Short-term trend
- 50 SMA: Medium-term trend
- 200 SMA: Long-term trend

Golden Cross: 50 MA crosses ABOVE 200 MA = Bullish!
Death Cross: 50 MA crosses BELOW 200 MA = Bearish!

Example: When Tata Motors' 50 EMA crossed above 200 EMA in early 2024, it went up 40% in 3 months!`,
      },
      {
        id: '4-3',
        title: 'MACD Indicator',
        duration: 6,
        content: `MACD (Moving Average Convergence Divergence) shows momentum and trend changes.

Components:
- MACD Line: 12 EMA - 26 EMA
- Signal Line: 9 EMA of MACD Line
- Histogram: Difference between MACD and Signal

Trading signals:
- MACD crosses ABOVE Signal → BUY signal 📈
- MACD crosses BELOW Signal → SELL signal 📉
- Histogram growing = momentum increasing
- Histogram shrinking = momentum weakening

Example: Infosys showed a MACD bullish crossover in October 2023, after which it rallied 15%!`,
      },
    ],
    quiz: [
      {
        q: 'RSI above 70 means the stock is?',
        options: ['Oversold — good to buy', 'Overbought — may fall', 'In neutral zone', 'Trending up strongly'],
        correct: 1,
        explanation: 'RSI above 70 = overbought, meaning the stock has risen too fast and may pull back.',
      },
      {
        q: "What is a 'Golden Cross'?",
        options: ['50 MA crosses below 200 MA', '200 MA crosses above 50 MA', '50 MA crosses above 200 MA', 'RSI crosses 50'],
        correct: 2,
        explanation: "Golden Cross = 50 MA crosses ABOVE 200 MA. It's a strong bullish signal!",
      },
      {
        q: 'MACD crosses above Signal Line means?',
        options: ['Sell signal', 'Buy signal', 'No signal', 'Exit trade'],
        correct: 1,
        explanation: 'When MACD crosses above Signal Line, it indicates bullish momentum — a BUY signal.',
      },
    ],
  },
  {
    id: 5,
    title: 'Risk Management',
    icon: '⚖️',
    color: '#FFEBEE',
    xp: 60,
    description: 'Stop Loss, Position Sizing, Risk/Reward',
    lessons: [
      {
        id: '5-1',
        title: 'Stop Loss — Your Safety Net',
        duration: 5,
        content: `A Stop Loss is an automatic order to sell a stock when it falls to a specific price — to limit your loss.

Example:
You buy Wipro at ₹450.
You set Stop Loss at ₹427 (5% below).
If Wipro falls to ₹427, it automatically sells.
Maximum loss = 5% = ₹23 per share.

Types of Stop Loss:
- Fixed percentage (5-10% below buy price)
- Below support level
- ATR-based (volatility-based)

Golden rule: NEVER trade without a Stop Loss!
Professional traders risk only 1-2% of capital per trade.`,
      },
      {
        id: '5-2',
        title: 'Risk-Reward Ratio',
        duration: 5,
        content: `Risk-Reward Ratio compares potential profit to potential loss.

Formula: Reward ÷ Risk

Example:
Buy Reliance at ₹2800
Stop Loss at ₹2740 (Risk = ₹60)
Target at ₹2980 (Reward = ₹180)
R:R = 180/60 = 3:1 ✅ GOOD TRADE!

Minimum 2:1 ratio recommended.
1:1 or lower = BAD trade — don't take it!

With 3:1 R:R:
Even if you lose 50% of trades, you still profit!
5 wins × ₹180 = ₹900
5 losses × ₹60 = ₹300
Net profit = ₹600 🎉`,
      },
      {
        id: '5-3',
        title: 'Position Sizing',
        duration: 5,
        content: `Position sizing is deciding HOW MANY shares to buy based on your risk.

Formula:
Position Size = (Capital × Risk%) ÷ Stop Loss per share

Example:
Capital = ₹1,00,000
Risk per trade = 1% = ₹1,000
Buy at ₹500, Stop Loss at ₹475 (₹25 risk/share)
Position Size = ₹1,000 ÷ ₹25 = 40 shares

So buy 40 shares. If stop hits, lose only ₹1,000 (1% of capital).

Never risk more than 2% per trade!
This way, even 10 consecutive losses = only 20% drawdown.`,
      },
    ],
    quiz: [
      {
        q: 'What is the purpose of a Stop Loss?',
        options: ['To maximize profits', 'To limit potential losses', 'To enter trades automatically', 'To increase position size'],
        correct: 1,
        explanation: 'Stop Loss limits your maximum loss by automatically selling when price hits a set level.',
      },
      {
        q: 'What is the minimum recommended Risk-Reward ratio?',
        options: ['1:1', '2:1', '0.5:1', '5:1'],
        correct: 1,
        explanation: 'Minimum 2:1 R:R is recommended — potential reward should be at least 2x the risk.',
      },
      {
        q: 'What percentage of capital should you risk per trade?',
        options: ['10-20%', '50%', '1-2%', '5-10%'],
        correct: 2,
        explanation: 'Professional traders risk only 1-2% of capital per trade to protect their account.',
      },
    ],
  },
  {
    id: 6,
    title: 'Strategies',
    icon: '⚡',
    color: '#E8F5E9',
    xp: 70,
    description: 'Intraday, Swing, Momentum, Breakout',
    lessons: [
      {
        id: '6-1',
        title: 'Intraday vs Swing Trading',
        duration: 7,
        content: `Intraday Trading:
- Buy and sell within same day
- No overnight risk
- Requires constant monitoring
- Higher frequency, smaller profits per trade
- Best for: HDFC Bank, Reliance, Nifty/Bank Nifty F&O

Swing Trading:
- Hold for 2-10 days
- Catches medium-term moves
- Less time-intensive
- Larger profit per trade but more risk
- Best for: Midcap stocks with clear trends

Which is better?
For beginners: Swing trading is safer and less stressful.
Intraday requires quick decisions and discipline.`,
      },
      {
        id: '6-2',
        title: 'Breakout Trading Strategy',
        duration: 6,
        content: `Breakout Trading: Buy when price breaks above a key resistance level with high volume.

Steps:
1. Identify consolidation zone (price stuck in range)
2. Mark the resistance (upper level)
3. Wait for price to break above with 2x average volume
4. Enter on the breakout candle close
5. Stop Loss: Below breakout level
6. Target: Height of consolidation added to breakout point

Example:
IRCTC consolidated between ₹700-750 for 3 weeks.
Broke out above ₹750 with high volume.
Target = ₹750 + ₹50 (range) = ₹800.
Stop Loss = ₹730.`,
      },
    ],
    quiz: [
      {
        q: 'In intraday trading, when must you close your position?',
        options: ['Within a week', 'By end of same trading day', 'Within a month', 'No time limit'],
        correct: 1,
        explanation: 'Intraday means all positions are opened and closed within the SAME trading day.',
      },
      {
        q: 'What confirms a valid breakout?',
        options: ['Low volume', 'High volume', 'Same volume', "Doesn't matter"],
        correct: 1,
        explanation: 'A breakout is valid only when accompanied by HIGH volume — shows strong conviction.',
      },
      {
        q: 'Which strategy is better for beginners?',
        options: ['Intraday trading', 'Scalping', 'Swing trading', 'F&O trading'],
        correct: 2,
        explanation: 'Swing trading is better for beginners — less stressful, more time to analyze, fewer trades.',
      },
    ],
  },
  {
    id: 7,
    title: 'AI Trading',
    icon: '🤖',
    color: '#E8EAF6',
    xp: 80,
    description: 'Algo trading, Backtesting, Trading bots',
    lessons: [
      {
        id: '7-1',
        title: 'What is Algorithmic Trading?',
        duration: 6,
        content: `Algorithmic (Algo) Trading uses computer programs to execute trades automatically based on predefined rules.

How it works:
- Define rules: "Buy when RSI < 30 AND price above 200 EMA"
- Program converts rules into code
- Computer monitors markets 24/7
- Executes trades in milliseconds

Advantages:
✅ No emotions — follows rules strictly
✅ Faster execution than humans
✅ Can monitor multiple stocks simultaneously
✅ Backtesting possible

In India: SEBI allows algo trading for retail investors through API-based platforms like Zerodha's Streak, Upstox API.`,
      },
      {
        id: '7-2',
        title: 'Backtesting Your Strategy',
        duration: 5,
        content: `Backtesting tests your strategy on historical data to see how it would have performed.

Steps to backtest:
1. Define your entry/exit rules clearly
2. Apply rules to historical price data
3. Calculate win rate, average profit, max drawdown
4. Optimize parameters
5. Test on out-of-sample data

Important metrics:
- Win Rate: % of winning trades
- Profit Factor: Gross profit ÷ Gross loss (>1.5 is good)
- Max Drawdown: Worst peak-to-trough decline
- Sharpe Ratio: Risk-adjusted returns

⚠️ Warning: Past performance ≠ Future results!`,
      },
    ],
    quiz: [
      {
        q: 'What is the main advantage of algo trading?',
        options: ['Always profitable', 'No emotions in trading', 'Requires no capital', 'Guaranteed returns'],
        correct: 1,
        explanation: 'Algo trading removes emotions — it follows predefined rules strictly without fear or greed.',
      },
      {
        q: 'What does backtesting do?',
        options: ['Tests strategy on future data', 'Tests strategy on historical data', 'Tests your patience', 'None of these'],
        correct: 1,
        explanation: 'Backtesting applies your strategy to historical data to see how it would have performed.',
      },
      {
        q: 'Which platform allows retail algo trading in India?',
        options: ['Instagram', 'Zerodha Streak', 'Google Finance', 'WhatsApp'],
        correct: 1,
        explanation: "Zerodha's Streak platform allows retail investors to create and backtest algo strategies.",
      },
    ],
  },
  {
    id: 8,
    title: 'Final Quiz',
    icon: '🧪',
    color: '#FFF3E0',
    xp: 100,
    description: 'Test all knowledge, earn certificates',
    lessons: [],
    isFinalQuiz: true,
    quiz: [
      {
        q: 'Nifty 50 represents top how many companies?',
        options: ['30', '50', '100', '500'],
        correct: 1,
        explanation: 'Nifty 50 tracks the top 50 companies listed on NSE by market capitalization.',
      },
      {
        q: 'RSI below 30 indicates?',
        options: ['Overbought', 'Oversold — potential buy', 'Strong uptrend', 'Market is closed'],
        correct: 1,
        explanation: 'RSI below 30 = oversold. The stock has fallen heavily and may bounce back.',
      },
      {
        q: 'What is the recommended minimum Risk-Reward ratio?',
        options: ['1:1', '2:1', '0.5:1', 'Any ratio'],
        correct: 1,
        explanation: 'Always aim for minimum 2:1 risk-reward — potential gain should be 2x potential loss.',
      },
      {
        q: 'Golden Cross occurs when?',
        options: ['Price hits all time high', '50 MA crosses above 200 MA', 'RSI crosses 50', 'MACD crosses zero'],
        correct: 1,
        explanation: "Golden Cross = 50-day MA crosses above 200-day MA. It's a strong bullish signal!",
      },
      {
        q: 'What percentage of capital should max be risked per trade?',
        options: ['10%', '25%', '2%', '50%'],
        correct: 2,
        explanation: 'Never risk more than 2% of capital per trade — this protects you from big losses.',
      },
    ],
  },
]
