
'use client'

import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthComponent() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-2">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">🎤 BarkBeat</h1>
          <p className="text-slate-500 text-sm">Personalized karaoke for you and your friends</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7c3aed',
                  brandAccent: '#6d28d9',
                }
              }
            }
          }}
          providers={['google']}
          redirectTo={typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : ''}
        />
      </div>
    </div>
  )
}