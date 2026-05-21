const SPEEDS = [0.75, 1, 1.25, 1.5]

// VoicePlayer receives the speech hook result as a prop so it shares state
// with the parent (LessonPage) rather than running its own speech instance.
export default function VoicePlayer({ speech, content }) {
  const {
    isPlaying, isPaused, speed,
    currentSentence, sentences,
    play, pause, resume, stop, changeSpeed,
  } = speech

  const handlePlayPause = () => {
    if (isPlaying)       pause()
    else if (isPaused)   resume()
    else                 play(content)
  }

  const progressPct = sentences.length > 0
    ? Math.round(((currentSentence + 1) / sentences.length) * 100)
    : 0

  return (
    <div style={{
      background: '#F0FBF0', border: '1px solid #C8E6C9',
      borderRadius: 14, padding: '12px 14px', marginBottom: 14,
    }}>

      {/* ── Top row: play/pause, info, stop ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: isPlaying ? '#4CAF50' : '#fff',
            border: '2px solid #4CAF50',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#4CAF50">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        {/* Status label */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#1B6B1B', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
            {isPlaying ? '🎙️ Reading aloud...'
              : isPaused ? '⏸ Paused'
              : '🔊 Listen to this lesson'}
          </div>
          <div style={{ color: '#4CAF50', fontSize: 10 }}>
            {isPlaying
              ? `Sentence ${currentSentence + 1} of ${sentences.length}`
              : isPaused
              ? `Resumed at sentence ${currentSentence + 1}`
              : 'Tap play to hear the lesson · Space to play/pause'}
          </div>
        </div>

        {/* Stop (only shown when active) */}
        {(isPlaying || isPaused) && (
          <button
            onClick={stop}
            title="Stop"
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: '#FFEBEE', border: '1px solid #FFCDD2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#C62828">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {(isPlaying || isPaused) && sentences.length > 0 && (
        <div style={{ height: 3, background: '#C8E6C9', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{
            height: 3, background: '#4CAF50', borderRadius: 2,
            width: `${progressPct}%`, transition: 'width 0.35s ease',
          }} />
        </div>
      )}

      {/* ── Speed controls ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#888', fontSize: 10 }}>Speed:</span>
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            style={{
              padding: '3px 8px', borderRadius: 20,
              fontSize: 10, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: speed === s ? '#4CAF50' : '#E8F5E9',
              color:      speed === s ? '#fff'    : '#2E7D32',
              transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}
