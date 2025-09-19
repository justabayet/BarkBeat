'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import AuthComponent from '@/components/AuthComponent'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <section className="w-full flex flex-col items-center justify-center gap-6">
      {!user ? (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome to BarkBeat!</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-xs sm:max-w-md mx-auto mb-4">
            Discover music and enjoy karaoke with friends. Start searching for your favorite songs or artists and let the fun begin!
          </p>
          <AuthComponent />
        </>
      ) : (
        <Dashboard user={user} />
      )}
    </section>
  )
}

// src/components/AuthComponent.tsx