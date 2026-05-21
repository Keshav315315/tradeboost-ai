import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CHART_RANGES: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d',  interval: '5m'  },
  '1W': { range: '5d',  interval: '60m' },
  '1M': { range: '1mo', interval: '1d'  },
  '3M': { range: '3mo', interval: '1d'  },
  '1Y': { range: '1y',  interval: '1wk' },
}

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
}

const r2 = (n: number | null | undefined): number | null =>
  n != null && isFinite(n) ? Math.round(n * 100) / 100 : null

// ── Number parser for Google Finance formatted strings ("1.23B", "456.7K") ──
function parseGNum(s: string | undefined): number {
  if (!s) return 0
  const clean = s.replace(/,/g, '').trim()
  if (clean.endsWith('B')) return parseFloat(clean) * 1e9
  if (clean.endsWith('M')) return parseFloat(clean) * 1e6
  if (clean.endsWith('K')) return parseFloat(clean) * 1e3
  return parseFloat(clean) || 0
}

// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { symbol, type, period, query } = body

    // ── QUOTE ───────────────────────────────────────────────────────────────
    if (type === 'quote') {
      if (!symbol) throw new Error('symbol required')
      const cleanSym = symbol.replace(/\.(NS|BO)$/i, '')
      const quote = await fetchQuote(cleanSym)
      return new Response(
        JSON.stringify({ success: true, quote }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── CHART ───────────────────────────────────────────────────────────────
    if (type === 'chart') {
      if (!symbol) throw new Error('symbol required')
      const cleanSym = symbol.replace(/\.(NS|BO)$/i, '')
      const chartData = await fetchYahooChart(cleanSym, period ?? '1D')
      return new Response(
        JSON.stringify({ success: true, chartData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── SEARCH ──────────────────────────────────────────────────────────────
    if (type === 'search') {
      if (!query) throw new Error('query required')
      const results = await searchStocks(query)
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Unknown type: ${type}`)

  } catch (err) {
    console.error('stock-data error:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ── QUOTE: Google Finance first, Yahoo Finance fallback ──────────────────────
async function fetchQuote(sym: string) {
  // 1. Try Google Finance HTML scraping
  try {
    const quote = await fetchGoogleFinanceQuote(sym)
    if (quote && quote.c > 0) return quote
  } catch (e) {
    console.warn('[Google Finance] failed:', (e as Error).message)
  }

  // 2. Fall back to Yahoo Finance
  try {
    const quote = await fetchYahooQuote(sym)
    if (quote && quote.c > 0) return quote
  } catch (e) {
    console.warn('[Yahoo Finance] failed:', (e as Error).message)
  }

  throw new Error(`Could not fetch price for ${sym}`)
}

// ── Google Finance HTML scraper ──────────────────────────────────────────────
async function fetchGoogleFinanceQuote(sym: string) {
  const url = `https://www.google.com/finance/quote/${sym}:NSE`
  const res = await fetch(url, { headers: BASE_HEADERS })
  if (!res.ok) throw new Error(`Google Finance HTTP ${res.status}`)
  const html = await res.text()

  // Primary: data-* attributes embedded in the page
  const priceM  = html.match(/data-last-price="([0-9.,]+)"/)
  const changeM = html.match(/data-last-price-change="([+-]?[0-9.,]+)"/)
  const pctM    = html.match(/data-last-price-change-pct="([+-]?[0-9.,]+)"/)

  if (priceM) {
    const price    = parseGNum(priceM[1])
    const change   = changeM ? parseGNum(changeM[1]) : 0
    // Google's pct is already decimal like 0.0134; multiply by 100
    const rawPct   = pctM ? parseFloat(pctM[1]) : 0
    const changePct = Math.abs(rawPct) < 1 ? rawPct * 100 : rawPct

    // Secondary fields from page text tables
    const highM   = html.match(/(?:52 Week High|Day's Range|High)[\s\S]{0,200}?([0-9,]{3,}(?:\.[0-9]+)?)/)
    const lowM    = html.match(/(?:52 Week Low|Day's Range|Low)[\s\S]{0,200}?([0-9,]{3,}(?:\.[0-9]+)?)/)
    const openM   = html.match(/"Open"\s*,\s*"([0-9,]+(?:\.[0-9]+)?)"/)
    const volM    = html.match(/"Vol"\s*,\s*"([0-9.KMB]+)"/)

    const high = highM ? parseGNum(highM[1]) : price * 1.01
    const low  = lowM  ? parseGNum(lowM[1])  : price * 0.99
    const open = openM ? parseGNum(openM[1]) : price
    const vol  = volM  ? parseGNum(volM[1])  : 0

    return {
      c:      r2(price)!,
      d:      r2(change)!,
      dp:     r2(changePct)!,
      h:      r2(high > price * 1.5 ? price * 1.01 : high)!,  // sanity cap
      l:      r2(low  < price * 0.5 ? price * 0.99 : low)!,
      o:      r2(open)!,
      v:      vol,
      pc:     r2(price - change)!,
      source: 'google' as const,
    }
  }

  throw new Error('Google Finance: no price attribute found')
}

// ── Yahoo Finance quote ───────────────────────────────────────────────────────
async function fetchYahooQuote(sym: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS?interval=1d&range=1d`
  const res  = await fetch(url, { headers: { 'User-Agent': BASE_HEADERS['User-Agent'] } })
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const raw    = await res.json()
  const result = raw?.chart?.result?.[0]
  if (!result) throw new Error('Yahoo: no result')

  const meta      = result.meta
  const qi        = result.indicators?.quote?.[0] ?? {}
  const closes    = qi.close   ?? []
  const opens_arr = qi.open    ?? []
  const highs_arr = qi.high    ?? []
  const lows_arr  = qi.low     ?? []
  const volumes   = qi.volume  ?? []

  const price     = meta.regularMarketPrice ?? closes.at(-1) ?? 0
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
  const change    = price - prevClose
  const changePct = prevClose ? (change / prevClose) * 100 : 0

  return {
    c:      r2(price)!,
    d:      r2(change)!,
    dp:     r2(changePct)!,
    h:      r2(meta.regularMarketDayHigh  ?? highs_arr.at(-1)  ?? price)!,
    l:      r2(meta.regularMarketDayLow   ?? lows_arr.at(-1)   ?? price)!,
    o:      r2(meta.regularMarketOpen     ?? opens_arr[0]      ?? price)!,
    v:      meta.regularMarketVolume ?? volumes.at(-1) ?? 0,
    pc:     r2(prevClose)!,
    t:      meta.regularMarketTime,
    marketState: meta.marketState ?? 'CLOSED',
    name:   meta.longName ?? meta.shortName ?? sym,
    source: 'yahoo' as const,
  }
}

// ── Yahoo Finance chart (most reliable for OHLCV series) ─────────────────────
async function fetchYahooChart(sym: string, period: string) {
  const { range, interval } = CHART_RANGES[period] ?? CHART_RANGES['1D']
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS?interval=${interval}&range=${range}`
  const res  = await fetch(url, { headers: { 'User-Agent': BASE_HEADERS['User-Agent'] } })
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`)
  const raw    = await res.json()
  const result = raw?.chart?.result?.[0]
  if (!result?.timestamp) throw new Error('Yahoo chart: no data')

  const timestamps: number[] = result.timestamp ?? []
  const qi = result.indicators?.quote?.[0] ?? {}
  const closes:  (number | null)[] = qi.close  ?? []
  const opens:   (number | null)[] = qi.open   ?? []
  const highs:   (number | null)[] = qi.high   ?? []
  const lows:    (number | null)[] = qi.low    ?? []
  const volumes: (number | null)[] = qi.volume ?? []

  const chartData = timestamps
    .map((ts, i) => {
      if (closes[i] == null) return null
      const date = new Date(ts * 1000)
      let label = ''

      if (period === '1D') {
        label = date.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
        })
      } else if (period === '1W') {
        label = date.toLocaleDateString('en-IN', {
          weekday: 'short', timeZone: 'Asia/Kolkata',
        })
      } else {
        label = date.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
        })
      }

      return {
        time:      label,
        timestamp: ts,
        price:     r2(closes[i])!,
        open:      r2(opens[i]  ?? closes[i])!,
        high:      r2(highs[i]  ?? closes[i])!,
        low:       r2(lows[i]   ?? closes[i])!,
        close:     r2(closes[i])!,
        volume:    volumes[i] ?? 0,
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.price > 0)

  return chartData
}

// ── Stock search: Yahoo Finance (most reliable for NSE) ───────────────────────
async function searchStocks(query: string) {
  // Primary: Yahoo Finance search
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`
    const res  = await fetch(url, { headers: { 'User-Agent': BASE_HEADERS['User-Agent'] } })
    if (!res.ok) throw new Error(`Yahoo search HTTP ${res.status}`)
    const data = await res.json()

    const results = (data?.quotes ?? [])
      .filter((q: { symbol?: string; exchange?: string; quoteType?: string }) =>
        (q.symbol?.endsWith('.NS') || q.symbol?.endsWith('.BO') || q.exchange === 'NSI') &&
        q.quoteType === 'EQUITY'
      )
      .slice(0, 8)
      .map((q: { symbol: string; longname?: string; shortname?: string }) => ({
        symbol:        q.symbol,
        displaySymbol: q.symbol.replace(/\.(NS|BO)$/, ''),
        description:   q.longname ?? q.shortname ?? q.symbol,
        exchange:      'NSE',
      }))

    if (results.length > 0) return results
  } catch (e) {
    console.warn('[Yahoo search] failed:', (e as Error).message)
  }

  // Fallback: Google Finance search HTML scrape
  try {
    const url = `https://www.google.com/finance/search?q=${encodeURIComponent(query)}&hl=en`
    const res  = await fetch(url, { headers: BASE_HEADERS })
    const html = await res.text()

    const results: { symbol: string; displaySymbol: string; description: string; exchange: string }[] = []
    const seen   = new Set<string>()
    const rx     = /href="\/finance\/quote\/([A-Z0-9&.-]+):(NSE|BSE)"/g
    let m: RegExpExecArray | null

    while ((m = rx.exec(html)) !== null && results.length < 8) {
      const [, sym, exch] = m
      if (seen.has(sym)) continue
      seen.add(sym)
      results.push({
        symbol:        sym + '.NS',
        displaySymbol: sym,
        description:   sym,
        exchange:      exch,
      })
    }

    return results
  } catch (e) {
    console.warn('[Google search] failed:', (e as Error).message)
    return []
  }
}
