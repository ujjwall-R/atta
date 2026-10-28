import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface AuthValue {
  user: User | null
  loading: boolean
  localMode: boolean
  showAboutAfterSignIn: boolean
  dismissAboutAfterSignIn: () => void
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [showAboutAfterSignIn, setShowAboutAfterSignIn] = useState(false)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) }).catch(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (_event === 'SIGNED_OUT') setShowAboutAfterSignIn(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    localMode: !isSupabaseConfigured,
    showAboutAfterSignIn,
    dismissAboutAfterSignIn: () => setShowAboutAfterSignIn(false),
    signInWithGoogle: async () => {
      if (!supabase) return
      // Keep the callback URL free of a hash: Supabase uses the URL fragment
      // or query string to return the auth session, while HashRouter owns it.
      const redirectTo = `${window.location.origin}${window.location.pathname}`
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) throw error
    },
    signInWithPassword: async (email, password) => {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setShowAboutAfterSignIn(true)
    },
    signUpWithPassword: async (email, password) => {
      if (!supabase) return false
      const emailRedirectTo = `${window.location.origin}${window.location.pathname}`
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
      if (error) throw error
      if (data.session) setShowAboutAfterSignIn(true)
      return !data.session
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [user, loading, showAboutAfterSignIn])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
