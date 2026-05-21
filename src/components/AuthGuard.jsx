import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Read session synchronously from localStorage so there is no async flash
function getStoredSession() {
  try {
    const key = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (!key) return null
    const data = JSON.parse(localStorage.getItem(key))
    if (!data?.access_token) return null
    // Reject tokens that are already expired
    if (data.expires_at && Date.now() / 1000 > data.expires_at) return null
    return data
  } catch {
    return null
  }
}

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(getStoredSession)   // sync init — no loading flash

  useEffect(() => {
    // Confirm session is still valid with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Navigate to="/login" replace />
  return children
}
