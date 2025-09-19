
'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Star } from 'lucide-react'
import RatingModal from './RatingModal'
import type { Song, UserSong } from '@/lib/typesInfered'

interface SongSearchProps {
  user: User
}

export default function SongSearch({ user }: SongSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [songs, setSongs] = useState<(Song & { user_songs?: UserSong[] })[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const searchSongs = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from('songs')
        .select(`
          *,
          user_songs!inner (*)
        `)
        .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
        .eq('user_songs.user_id', user.id)
        .limit(20)

      setSongs(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSongToLibrary = async (song: Song) => {
    const { error } = await supabase
      .from('user_songs')
      .insert([{
        user_id: user.id,
        song_id: song.id,
        times_performed: 0
      }])

    if (!error) {
      setSelectedSong(song)
      setShowRatingModal(true)
    }
  }

  const handleRatingSubmit = async (rating: {
    difficulty: number
    moodTags: string[]
    languageTags: string[]
    isFavorite: boolean
  }) => {
    if (!selectedSong) return

    await supabase
      .from('user_songs')
      .update({
        difficulty_rating: rating.difficulty,
        mood_tags: rating.moodTags,
        language_tags: rating.languageTags,
        is_favorite: rating.isFavorite
      })
      .eq('user_id', user.id)
      .eq('song_id', selectedSong.id)

    setShowRatingModal(false)
    setSelectedSong(null)
    searchSongs() // Refresh results
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search songs by title or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
          />
        </div>
        <button
          onClick={searchSongs}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white font-semibold transition-colors shadow"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="grid gap-4">
        {songs.map((song) => {
          const userSong = song.user_songs?.[0]
          return (
            <div key={song.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-slate-100">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-slate-900 leading-tight">{song.title}</h3>
                  <p className="text-purple-600 text-sm mb-1">{song.artist}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{song.language}</span>
                    {userSong?.difficulty_rating && (
                      <span>Difficulty: {userSong.difficulty_rating}/10</span>
                    )}
                    {userSong?.times_performed && (
                      <span>Performed: {userSong.times_performed} times</span>
                    )}
                  </div>
                  {userSong?.mood_tags && userSong.mood_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {userSong.mood_tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {userSong?.is_favorite && <Star className="text-yellow-400 fill-current" size={20} />}
                  {!userSong && (
                    <button
                      onClick={() => addSongToLibrary(song)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-xs font-semibold shadow"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showRatingModal && selectedSong && (
        <RatingModal
          song={selectedSong}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  )
}