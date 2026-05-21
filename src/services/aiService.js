// ============================================================
// TradeBoost AI Service — Unified Claude + OpenAI router
//
// Cost reference (per 1M tokens):
//   Claude Opus 4:  ~$15  → deep reasoning, mentor chat, analysis
//   GPT-4o mini:    ~$0.15 → 100x cheaper, fast content generation
//
// Strategy:
//   Claude  → MENTOR_CHAT, STOCK_ANALYSIS, TRADING_ADVICE,
//              PSYCHOLOGY_TIP, PORTFOLIO_REVIEW
//   GPT     → QUIZ_GENERATE, LESSON_CONTENT, ALGO_CODE,
//              NEWS_SUMMARY, QUICK_EXPLAIN
// ============================================================

// ── System prompts keyed by task ─────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  MENTOR_CHAT: `You are TradeBoost AI Mentor, an expert stock market educator for Indian market beginners. Explain in simple English, use Indian stock examples (Tata, Reliance, Infosys etc). Be encouraging and clear. Never give direct buy/sell advice. Add relevant emojis to make it engaging. Format responses with line breaks for readability.`,

  STOCK_ANALYSIS: `You are a stock market analyst specializing in Indian markets (NSE/BSE). Analyze stocks objectively for beginners, mentioning key price levels, trend direction, and simple observations. Always end with "This is for educational purposes only."`,

  TRADING_ADVICE: `You are a trading coach for beginners. Focus on risk management, position sizing, and discipline. Always emphasize stop loss and capital protection. Keep advice practical and actionable.`,

  PSYCHOLOGY_TIP: `You are a trading psychology expert. Help users manage emotions like fear, greed, and FOMO. Give practical mindset tips for consistent trading. Be empathetic and encouraging.`,

  PORTFOLIO_REVIEW: `You are a portfolio manager analyzing a virtual trading portfolio. Identify diversification issues, sector concentration, and risk levels. Give exactly 3 numbered improvement suggestions in simple language. Be specific and actionable.`,

  QUIZ_GENERATE: `You are a stock market quiz generator. Generate MCQ questions about the given topic. Always respond in this exact JSON format:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "why this answer is correct"
    }
  ]
}
Generate exactly 3 questions. Return ONLY valid JSON, no extra text, no markdown code fences.`,

  LESSON_CONTENT: `You are a stock market educator creating lesson content for beginners. Write clear, engaging content in simple English. Use bullet points, examples with Indian stocks, and practical tips. Keep it under 200 words.`,

  ALGO_CODE: `You are a Python trading expert. Generate clean, well-commented Python code for algorithmic trading strategies. Use pandas and yfinance libraries. Always include risk management in the code.`,

  NEWS_SUMMARY: `You are a financial news analyst. Summarize stock market news in 2-3 simple sentences. Mention if it is bullish, bearish, or neutral for the stock. Keep it beginner-friendly.`,

  QUICK_EXPLAIN: `You are a stock market teacher. Explain concepts in the simplest possible way in 3-4 sentences. Use a real Indian stock example if possible. Be concise and clear.`,
}

// ── Task → model routing ─────────────────────────────────────────────────────
const TASK_MODEL = {
  MENTOR_CHAT:      'claude',
  STOCK_ANALYSIS:   'claude',
  TRADING_ADVICE:   'claude',
  PSYCHOLOGY_TIP:   'claude',
  PORTFOLIO_REVIEW: 'claude',
  QUIZ_GENERATE:    'gpt',
  LESSON_CONTENT:   'gpt',
  ALGO_CODE:        'gpt',
  NEWS_SUMMARY:     'gpt',
  QUICK_EXPLAIN:    'gpt',
}

// ── Claude API ───────────────────────────────────────────────────────────────
export const askClaude = async (messages, systemPrompt) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Claude API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Claude returned empty response')
  return text
}

// ── OpenAI API ───────────────────────────────────────────────────────────────
export const askGPT = async (messages, systemPrompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned empty response')
  return text
}

// ── Smart router — picks model based on task ─────────────────────────────────
export const askAI = async (task, messages, customPrompt = null) => {
  const model        = TASK_MODEL[task] ?? 'claude'
  const systemPrompt = customPrompt ?? SYSTEM_PROMPTS[task] ?? ''

  if (model === 'claude') {
    return askClaude(messages, systemPrompt)
  } else {
    return askGPT(messages, systemPrompt)
  }
}
