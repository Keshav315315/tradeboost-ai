import { splitIntoSentences } from '../hooks/useSpeech'

// Returns true when the line text contains a meaningful substring of the
// currently spoken sentence — used to decide which lines to highlight.
function lineMatchesSentence(line, sentenceText) {
  if (!sentenceText || sentenceText.length < 6) return false
  const needle = sentenceText.slice(0, 22).toLowerCase()
  return line.toLowerCase().includes(needle)
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HighlightedContent({ content, currentSentence }) {
  const sentences = splitIntoSentences(content)
  const activeSentenceText = currentSentence >= 0 ? (sentences[currentSentence] ?? '') : ''

  const lines    = content.split('\n')
  const rendered = []
  let   i        = 0

  while (i < lines.length) {
    const raw = lines[i]
    const t   = raw.trim()

    // Blank spacer
    if (!t) {
      rendered.push(<div key={`sp${i}`} style={{ height: 8 }} />)
      i++
      continue
    }

    // ── Bullet block (consecutive '- ' lines) ──────────────────────────────
    if (t.startsWith('- ')) {
      const bullets = []
      const startI  = i
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        bullets.push(lines[i].trim().slice(2))
        i++
      }
      const anyActive = bullets.some(b => lineMatchesSentence(b, activeSentenceText))
      rendered.push(
        <div
          key={`bl${startI}`}
          style={{
            marginBottom: 6,
            ...(anyActive ? { background: 'rgba(76,175,80,0.09)', borderLeft: '3px solid #4CAF50', borderRadius: 8, padding: '5px 8px 5px 6px' } : {}),
            transition: 'all 0.3s ease',
          }}
        >
          {bullets.map((b, bi) => {
            const bulletActive = lineMatchesSentence(b, activeSentenceText)
            return (
              <div key={bi} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                <span style={{ color: bulletActive ? '#2E7D32' : '#4CAF50', flexShrink: 0, fontSize: 14, lineHeight: 1.5, marginTop: 1, fontWeight: bulletActive ? 700 : 400 }}>•</span>
                <span style={{ color: bulletActive ? '#1A1A1A' : '#333', fontSize: 13, lineHeight: 1.65, fontWeight: bulletActive ? 600 : 400, transition: 'all 0.25s' }}>{b}</span>
              </div>
            )
          })}
        </div>
      )
      continue
    }

    // ── Numbered list item ─────────────────────────────────────────────────
    const numMatch = t.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      const active = lineMatchesSentence(numMatch[2], activeSentenceText)
      rendered.push(
        <div
          key={`n${i}`}
          style={{
            display: 'flex', gap: 8, marginBottom: 5,
            ...(active ? { background: 'rgba(76,175,80,0.09)', borderLeft: '3px solid #4CAF50', borderRadius: 7, padding: '4px 8px 4px 6px' } : {}),
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{ color: '#4CAF50', flexShrink: 0, fontWeight: 700, fontSize: 13, minWidth: 16, lineHeight: 1.65 }}>{numMatch[1]}.</span>
          <span style={{ color: active ? '#1A1A1A' : '#333', fontSize: 13, lineHeight: 1.65, fontWeight: active ? 600 : 400, transition: 'all 0.25s' }}>{numMatch[2]}</span>
        </div>
      )
      i++
      continue
    }

    // ── Subheading (ends with ':', short line) ─────────────────────────────
    if (t.endsWith(':') && t.length < 60) {
      rendered.push(
        <p key={`h${i}`} style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 700, marginBottom: 4, marginTop: 10 }}>{t}</p>
      )
      i++
      continue
    }

    // ── Regular paragraph ──────────────────────────────────────────────────
    const active = lineMatchesSentence(t, activeSentenceText)
    rendered.push(
      <p
        key={`p${i}`}
        style={{
          color: active ? '#1A1A1A' : '#444',
          fontSize: 13, lineHeight: 1.7, marginBottom: 4,
          ...(active ? {
            background: 'rgba(76,175,80,0.08)',
            borderLeft: '3px solid #4CAF50',
            borderRadius: 7,
            padding: '5px 10px 5px 8px',
            fontWeight: 500,
          } : {}),
          transition: 'all 0.3s ease',
        }}
      >
        {t}
      </p>
    )
    i++
  }

  return <div>{rendered}</div>
}
