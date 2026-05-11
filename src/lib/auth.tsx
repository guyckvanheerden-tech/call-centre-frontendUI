import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { User } from '@/types'

interface AuthContextValue {
  session:  Session | null
  supaUser: SupabaseUser | null
  profile:  User | null
  loading:  boolean
  signIn:   (email: string, password: string) => Promise<string | null>
  signOut:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) fetchProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess) fetchProfile(sess.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    // Join the tenants table so the sidebar can display the tenant name
    const { data } = await supabase
      .from('users')
      .select('*, tenants(id, name, slug, logo_url, plan)')
      .eq('id', userId)
      .single()

    if (data) {
      const tenantRow = data.tenants as {
        id: string; name: string; slug: string; logo_url: string | null; plan: string
      } | null

      setProfile({
        id:             data.id,
        name:           data.name,
        email:          data.email,
        role:           data.role,
        enabled:        data.enabled,
        online:         data.online,
        tenantId:       data.tenant_id,
        tenant:         tenantRow ? {
          id:      tenantRow.id,
          name:    tenantRow.name,
          slug:    tenantRow.slug,
          logoUrl: tenantRow.logo_url ?? undefined,
          plan:    tenantRow.plan,
        } : undefined,
        signature:      data.signature,
        signatureImage: data.signature_image,
        createdAt:      data.created_at,
      })
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message

    const { data } = await supabase.auth.getSession()
    if (data.session) {
      await fetch(`${import.meta.env.VITE_API_URL}/users/${data.session.user.id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ online: true }),
      }).catch(() => {/* non-critical */})
    }

    return null
  }

  async function signOut() {
    if (session) {
      await fetch(`${import.meta.env.VITE_API_URL}/users/${session.user.id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ online: false }),
      }).catch(() => {/* non-critical */})
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      supaUser: session?.user ?? null,
      profile,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
