import { useState, useEffect, useRef, useCallback } from 'react'

// ── Helper: strip non-speakable characters from lesson text ──────────────────
function cleanText(text) {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[✅❌⚠️📊🔨⭐🌟🌠📈🤖→•]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitIntoSentences(text) {
  return cleanText(text)
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5)
}

// ─────────────────────────────────────────────────────────────────────────────
export default function useSpeech() {
  const [isPlaying,       setIsPlaying]       = useState(false)
  const [isPaused,        setIsPaused]        = useState(false)
  const [currentSentence, setCurrentSentence] = useState(-1)
  const [speed,           setSpeed]           = useState(1)
  const [voiceReady,      setVoiceReady]      = useState(false)

  // Refs so recursive callbacks always read the latest values (no stale closures)
  const sentencesRef   = useRef([])
  const currentIdxRef  = useRef(0)
  const cancelledRef   = useRef(false)
  const speedRef       = useRef(1)
  const isPlayingRef   = useRef(false)

  useEffect(() => { speedRef.current   = speed },     [speed])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  // Load available voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => {
      if (window.speechSynthesis.getVoices().length > 0) setVoiceReady(true)
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.cancel() }
  }, [])

  const getPreferredVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v =>
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('ravi') ||
        v.name.toLowerCase().includes('veena')
      ) ||
      voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0]
    )
  }

  // The speak implementation lives in a ref so the recursive onend callback
  // always calls the latest version without needing it in any dependency array.
  const implRef = useRef(null)
  implRef.current = (sentences, index) => {
    if (cancelledRef.current || index >= sentences.length) {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentSentence(-1)
      currentIdxRef.current = 0
      cancelledRef.current = false
      return
    }

    const sentence = sentences[index]?.trim()
    if (!sentence) {
      implRef.current(sentences, index + 1)
      return
    }

    setCurrentSentence(index)
    currentIdxRef.current = index

    const utt = new SpeechSynthesisUtterance(sentence)
    utt.voice  = getPreferredVoice()
    utt.rate   = speedRef.current
    utt.pitch  = 1.0
    utt.volume = 1.0
    utt.lang   = 'en-IN'

    utt.onend = () => {
      if (!cancelledRef.current) implRef.current(sentences, index + 1)
    }
    utt.onerror = (e) => {
      if (e.error !== 'interrupted' && !cancelledRef.current) {
        implRef.current(sentences, index + 1)
      }
    }

    window.speechSynthesis.speak(utt)
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  const play = useCallback((text, startFrom = 0) => {
    cancelledRef.current = false
    window.speechSynthesis.cancel()
    const sentences = splitIntoSentences(text)
    sentencesRef.current = sentences
    setIsPlaying(true)
    setIsPaused(false)
    // Small delay lets cancel() settle before the first utterance starts
    setTimeout(() => implRef.current(sentences, startFrom), 80)
  }, [])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setIsPaused(false)
    setIsPlaying(true)
  }, [])

  const stop = useCallback(() => {
    cancelledRef.current = true
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentSentence(-1)
    currentIdxRef.current = 0
  }, [])

  const changeSpeed = useCallback((newSpeed) => {
    speedRef.current = newSpeed
    setSpeed(newSpeed)
    if (isPlayingRef.current) {
      // Restart from current sentence at the new rate
      const idx = currentIdxRef.current
      cancelledRef.current = false
      window.speechSynthesis.cancel()
      setTimeout(() => implRef.current(sentencesRef.current, idx), 80)
    }
  }, [])

  return {
    isPlaying,
    isPaused,
    currentSentence,
    speed,
    voiceReady,
    play,
    pause,
    resume,
    stop,
    changeSpeed,
    sentences: sentencesRef.current,
  }
}
