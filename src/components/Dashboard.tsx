
'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import SongSearch from './SongSearch'
import SessionManager from './SessionManager'
import { Music, Users, Search, LogOut } from 'lucide-react'
import type { Profile, Song, UserSong } from '@/lib/types'

interface DashboardProps {
  user: User
}

type ActiveTab = 'search' | 'sessions' | 'library'

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
    <div className="min-h-screen text-white">
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">🎤 BarkBeat</h1>
              <span className="text-sm text-purple-200">Welcome, {profile?.name || user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'search', label: 'Search Songs', icon: Search },
              { id: 'sessions', label: 'Sessions', icon: Users },
              { id: 'library', label: 'My Library', icon: Music },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as ActiveTab)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent hover:text-purple-200'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'search' && <SongSearch user={user} />}
        {activeTab === 'sessions' && <SessionManager user={user} />}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Song Library</h2>
            <div className="grid gap-4">
              {userSongs.map((userSong) => (
                <div key={userSong.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{userSong.songs.title}</h3>
                      <p className="text-purple-200">{userSong.songs.artist}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>Difficulty: {userSong.difficulty_rating || 'Not rated'}/10</span>
                        <span>Performed: {userSong.times_performed} times</span>
                      </div>
                      {userSong.mood_tags && userSong.mood_tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {userSong.mood_tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-purple-600/30 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {userSong.is_favorite && <span className="text-yellow-400">⭐</span>}
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
