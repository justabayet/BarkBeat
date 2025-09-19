
'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import SongSearch from './SongSearch'
import SessionManager from './SessionManager'
import GlobalSearch from './GlobalSearch'
import { Music, Users, Search, LogOut, Play, User as UserIcon } from 'lucide-react'
import type { Profile, Song, UserSong } from '@/lib/typesInfered'

interface DashboardProps {
  user: User
}

type ActiveTab = 'search' | 'sessions' | 'library' | 'global' | 'user'

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

      setUserSongs((data || []).filter((us) => us.songs !== null) as (UserSong & { songs: Song })[])
    }

    loadProfile()
    loadUserSongs()
  }, [user.id])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Navigation: Top for desktop, bottom for mobile */}
      {/* Desktop top nav */}
      <nav className="hidden md:block bg-gradient-to-r from-gray-900/80 via-gray-950/80 to-black/80 backdrop-blur-md mt-4 rounded-xl border border-gray-800/70 shadow-lg sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex gap-4 justify-center py-2">
          {[
            { id: 'search', label: 'Session', icon: Play },
            { id: 'global', label: 'Search', icon: Search },
            { id: 'sessions', label: 'Sessions', icon: Users },
            { id: 'library', label: 'My Library', icon: Music },
            { id: 'user', label: 'User', icon: LogOut },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${activeTab === id
                ? 'bg-gray-800/70 text-purple-200 font-bold shadow'
                : 'text-gray-300 hover:text-purple-200 hover:bg-gray-800/40'
                }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900/90 via-gray-950/90 to-black/90 backdrop-blur-md border-t border-gray-800/80 flex md:hidden justify-around py-2 shadow-t-xl">
        {[
          { id: 'search', label: 'Search', icon: Play },
          { id: 'global', label: 'Global', icon: Search },
          { id: 'sessions', label: 'Sessions', icon: Users },
          { id: 'library', label: 'Library', icon: Music },
          { id: 'user', label: 'User', icon: UserIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as ActiveTab)}
            className={`flex flex-col items-center px-2 py-1 text-xs transition-colors rounded-lg ${activeTab === id
              ? 'text-purple-300 font-bold bg-gray-800/60 shadow'
              : 'text-gray-400 hover:text-purple-200 hover:bg-gray-800/40'
              }`}
            aria-label={label}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="text-gray-100 bg-transparent w-full px-2 sm:px-4 md:px-8">
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
          {activeTab === 'user' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="bg-gradient-to-r from-purple-700/80 to-purple-900/80 rounded-2xl p-6 shadow-lg w-full max-w-xs flex flex-col items-center">
                <div className="text-3xl mb-2">👤</div>
                <div className="font-bold text-lg mb-1">{profile?.name || user.email}</div>
                <div className="text-xs text-gray-300 mb-4">{user.email}</div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-xl text-sm font-semibold transition-colors shadow-sm border border-red-800/60"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
