import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface AuthValue {
  user: User | null
  loading: boolean
  localMode: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) }).catch(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    localMode: !isSupabaseConfigured,
    signInWithGoogle: async () => {
      if (!supabase) return
      // Keep the callback URL free of a hash: Supabase uses the URL fragment
      // or query string to return the auth session, while HashRouter owns it.
      const redirectTo = `${window.location.origin}${window.location.pathname}`
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) throw error
    },
    signInWithEmail: async (email) => {
      if (!supabase) return
      const emailRedirectTo = `${window.location.origin}${window.location.pathname}`
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
      if (error) throw error
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
