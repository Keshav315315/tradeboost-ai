import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query || String(query).trim().length < 1) {
      return new Response(
        JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const q = String(query).toUpperCase().trim()

    // ── Method 1: Yahoo Finance autocomplete ──────────────────────────────────
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&enableCb=true&enableNavLinks=false&enableEnhancedTrivialQuery=true&enableResearchReports=false&enableCulturalAssets=false&enableLogoUrl=false`

      const res = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        },
      })

      if (res.ok) {
        const data  = await res.json()
        const quotes = data?.quotes ?? []

        const results = quotes
          .filter((item: { symbol?: string; exchange?: string; quoteType?: string }) =>
            item.symbol &&
            (item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO') ||
             item.exchange === 'NSI'     || item.exchange === 'BSE')
          )
          .map((item: {
            symbol: string; longname?: string; shortname?: string;
            exchange?: string; quoteType?: string
          }) => ({
            symbol:        item.symbol,
            displaySymbol: item.symbol.replace('.NS', '').replace('.BO', ''),
            description:   item.longname ?? item.shortname ?? item.symbol,
            exchange:      item.exchange === 'NSI' || item.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
            type:          item.quoteType ?? 'EQUITY',
          }))
          .slice(0, 10)

        if (results.length > 0) {
          return new Response(
            JSON.stringify({ success: true, results, source: 'yahoo' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch (_) { /* fall through to Finnhub */ }

    // ── Method 2: Finnhub symbol search ───────────────────────────────────────
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY') ?? ''
    if (finnhubKey) {
      try {
        const url  = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&exchange=NS&token=${finnhubKey}`
        const res  = await fetch(url)
        const data = await res.json()

        const results = ((data.result ?? []) as Array<{ symbol: string; description: string; type: string }>)
          .filter(s => s.type === 'Common Stock' || s.type === 'EQS')
          .map(s => ({
            symbol:        s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`,
            displaySymbol: s.symbol.replace('.NS', ''),
            description:   s.description,
            exchange:      'NSE',
            type:          'EQUITY',
          }))
          .slice(0, 10)

        return new Response(
          JSON.stringify({ success: true, results, source: 'finnhub' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (_) { /* fall through */ }
    }

    // ── No results ────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, results: [], source: 'none' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('stock-search error:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
