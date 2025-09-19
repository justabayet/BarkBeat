
'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Plus, X, UserPlus } from 'lucide-react'
import { KaraokeSession, MockProfile, Song, UserSong } from '@/lib/typesInfered'

interface SessionManagerProps {
  user: User
}

interface SessionParticipant {
  id: string
  name: string
  type: 'user' | 'mock'
  avatar_url?: string
}

export default function SessionManager({ user }: SessionManagerProps) {
  const [sessions, setSessions] = useState<KaraokeSession[]>([])
  const [activeSession, setActiveSession] = useState<KaraokeSession | null>(null)
  const [participants, setParticipants] = useState<SessionParticipant[]>([])
  const [mockProfiles, setMockProfiles] = useState<MockProfile[]>([])
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [newMockName, setNewMockName] = useState('')
  const [recommendations, setRecommendations] = useState<(Song & { avgDifficulty: number, matchScore: number })[]>([])

  useEffect(() => {
    loadSessions()
    loadMockProfiles()
  }, [user.id])

  useEffect(() => {
    if (activeSession && participants.length > 0) {
      generateRecommendations()
    }
  }, [activeSession, participants])
  const loadSessions = async () => {
    const { data } = await supabase
      .from('karaoke_sessions')
      .select('*')
      .eq('host_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setSessions(data || [])
  }

  const loadMockProfiles = async () => {
    const { data } = await supabase
      .from('mock_profiles')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    setMockProfiles(data || [])
  }

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = await supabase
      .from('karaoke_sessions')
      .insert([{
        name: sessionName,
        host_id: user.id
      }])
      .select()
      .single()

    if (!error && data) {
      setSessions([data, ...sessions])
      setActiveSession(data)
      setSessionName('')
      setShowCreateSession(false)
    }
  }

  const createMockProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = await supabase
      .from('mock_profiles')
      .insert([{
        name: newMockName,
        created_by: user.id
      } as MockProfile])
      .select()
      .single()

    if (!error && data) {
      setMockProfiles([data, ...mockProfiles])
      setNewMockName('')
    }
  }

  const addParticipant = async (participantId: string, type: 'user' | 'mock') => {
    if (!activeSession) return

    const insertData = {
      session_id: activeSession.id,
      ...(type === 'user' ? { user_id: participantId } : { mock_profile_id: participantId })
    }

    const { error } = await supabase
      .from('session_participants')
      .insert([insertData])

    if (!error) {
      loadSessionParticipants()
    }
  }

  const loadSessionParticipants = async () => {
    if (!activeSession) return

    const { data } = await supabase
      .from('session_participants')
      .select(`
        *,
        profiles (id, name, avatar_url),
        mock_profiles (id, name, avatar_url)
      `)
      .eq('session_id', activeSession.id)

    const participantList: SessionParticipant[] = (data || []).map(p => {
      if (p.user_id && p.profiles) {
        return {
          id: p.profiles.id,
          name: p.profiles.name || 'Unknown User',
          type: 'user' as const,
          avatar_url: p.profiles.avatar_url || undefined
        }
      } else if (p.mock_profile_id && p.mock_profiles) {
        return {
          id: p.mock_profiles.id,
          name: p.mock_profiles.name,
          type: 'mock' as const,
          avatar_url: p.mock_profiles.avatar_url || undefined
        }
      }
      return null
    }).filter(Boolean) as SessionParticipant[]

    setParticipants(participantList)
  }

  const generateRecommendations = async () => {
    if (!activeSession || participants.length === 0) return

    // Get all user songs for participants (only real users have ratings)
    const userIds = participants.filter(p => p.type === 'user').map(p => p.id)

    if (userIds.length === 0) {
      setRecommendations([])
      return
    }

    const { data: userSongs } = await supabase
      .from('user_songs')
      .select(`
        *,
        songs (*)
      `)
      .in('user_id', userIds)

    // Group songs by song_id and calculate average difficulty and match score
    const songGroups = new Map<string, {
      song: Song
      ratings: UserSong[]
    }>()

    userSongs?.forEach(userSong => {
      if (!userSong.songs) return

      const songId = userSong.songs.id
      if (!songGroups.has(songId)) {
        songGroups.set(songId, {
          song: userSong.songs,
          ratings: []
        })
      }
      songGroups.get(songId)!.ratings.push(userSong)
    })

    // Calculate recommendations
    const recs = Array.from(songGroups.entries())
      .map(([, { song, ratings }]) => {
        const avgDifficulty = ratings.reduce((sum, r) => sum + (r.difficulty_rating || 5), 0) / ratings.length
        const matchScore = ratings.length / userIds.length // How many participants know this song

        return {
          ...song,
          avgDifficulty,
          matchScore
        }
      })
      .sort((a, b) => b.matchScore - a.matchScore || Math.abs(5 - a.avgDifficulty) - Math.abs(5 - b.avgDifficulty))
      .slice(0, 10)

    setRecommendations(recs)
  }

  const endSession = async () => {
    if (!activeSession) return

    await supabase
      .from('karaoke_sessions')
      .update({ is_active: false })
      .eq('id', activeSession.id)

    setActiveSession(null)
    setParticipants([])
    setRecommendations([])
    loadSessions()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Karaoke Sessions</h2>
        <button
          onClick={() => setShowCreateSession(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>New Session</span>
        </button>
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Session</h3>
              <button onClick={() => setShowCreateSession(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={createSession}>
              <input
                type="text"
                placeholder="Session name (optional)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-4"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSession(false)}
                  className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Session */}
      {activeSession ? (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {activeSession.name || `Session ${activeSession.id.slice(0, 8)}`}
              </h3>
              <button
                onClick={endSession}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
              >
                End Session
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Participants ({participants.length})</h4>
              <button
                onClick={() => setShowAddParticipant(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
              >
                <UserPlus size={16} />
                <span>Add</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {participants.map((participant) => (
                <div key={participant.id} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">{participant.name}</div>
                  <div className="text-xs text-gray-400">{participant.type === 'mock' ? 'Mock' : 'User'}</div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recommended Songs for Your Group</h4>
                <div className="space-y-2">
                  {recommendations.map((song) => (
                    <div key={song.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{song.title}</h5>
                          <p className="text-sm text-purple-200">{song.artist}</p>
                        </div>
                        <div className="text-right text-sm">
                          <div>Avg Difficulty: {song.avgDifficulty.toFixed(1)}/10</div>
                          <div className="text-green-400">
                            {Math.round(song.matchScore * 100)}% group match
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{session.name || `Session ${session.id.slice(0, 8)}`}</h3>
                  <p className="text-sm text-gray-400">
                    {/* Created {new Date(session.created_at).toLocaleDateString()} */}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveSession(session)
                    loadSessionParticipants()
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Resume
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Participant</h3>
              <button onClick={() => setShowAddParticipant(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Create Mock Profile</h4>
                <form onSubmit={createMockProfile} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Friend's name"
                    value={newMockName}
                    onChange={(e) => setNewMockName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Create
                  </button>
                </form>
              </div>

              {mockProfiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Add Existing Mock Profiles</h4>
                  <div className="space-y-2">
                    {mockProfiles.map((profile) => (
                      <div key={profile.id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                        <span>{profile.name}</span>
                        <button
                          onClick={() => {
                            addParticipant(profile.id, 'mock')
                            setShowAddParticipant(false)
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}