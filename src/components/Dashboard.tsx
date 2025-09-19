
'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import SongSearch from './SongSearch'
import SessionManager from './SessionManager'
import GlobalSearch from './GlobalSearch'
import { Music, Users, Search, LogOut, Globe } from 'lucide-react'
import type { Profile, Song, UserSong } from '@/lib/typesInfered'

interface DashboardProps {
  user: User
}

type ActiveTab = 'search' | 'sessions' | 'library' | 'global'

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userSongs, setUserSongs] = useState<(UserSong & { songs: Song })[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(data)
    }

    const loadUserSongs = async () => {
      const { data } = await supabase
        .from('user_songs')
        .select(`
          *,
          songs (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setUserSongs(data || [])
    }

    loadProfile()
    loadUserSongs()
  }, [user.id])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen text-slate-900 bg-transparent">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-2 py-3 sticky top-0 z-20 rounded-b-xl shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-purple-700">🎤 BarkBeat</h1>
            <span className="text-xs text-slate-500 hidden sm:inline">Welcome, {profile?.name || user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Bottom nav for mobile, top nav for md+ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 border-t border-slate-200 flex md:hidden justify-around py-2 shadow-t-xl">
        {[
          { id: 'search', label: 'Search', icon: Search },
          { id: 'global', label: 'Global', icon: Globe },
          { id: 'sessions', label: 'Sessions', icon: Users },
          { id: 'library', label: 'Library', icon: Music },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as ActiveTab)}
            className={`flex flex-col items-center px-2 py-1 text-xs transition-colors ${
              activeTab === id
                ? 'text-purple-700 font-bold'
                : 'text-slate-400 hover:text-purple-500'
            }`}
            aria-label={label}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {/* Top nav for md+ */}
      <nav className="hidden md:block bg-transparent mt-2">
        <div className="max-w-2xl mx-auto flex gap-4 justify-center">
          {[
            { id: 'search', label: 'Search Songs', icon: Search },
            { id: 'global', label: 'Global Search', icon: Globe },
            { id: 'sessions', label: 'Sessions', icon: Users },
            { id: 'library', label: 'My Library', icon: Music },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === id
                  ? 'bg-purple-100 text-purple-700 font-bold shadow'
                  : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto w-full px-0 sm:px-2 py-6 pb-20 md:pb-6">
        {activeTab === 'search' && <SongSearch user={user} />}
        {activeTab === 'global' && <GlobalSearch user={user} />}
        {activeTab === 'sessions' && <SessionManager user={user} />}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">My Song Library</h2>
            <div className="grid gap-4">
              {userSongs.map((userSong) => (
                <div key={userSong.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base leading-tight">{userSong.songs.title}</h3>
                      <p className="text-purple-600 text-sm">{userSong.songs.artist}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>Difficulty: {userSong.difficulty_rating || 'Not rated'}/10</span>
                        <span>Performed: {userSong.times_performed} times</span>
                      </div>
                      {userSong.mood_tags && userSong.mood_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {userSong.mood_tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {userSong.is_favorite && <span className="text-yellow-400 text-xl">⭐</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
