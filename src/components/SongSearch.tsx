
'use client'

import { useState, useRef } from 'react'
import FilterPopoverButton from './FilterPopoverButton'
import Pill from './Pill'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Star, Loader } from 'lucide-react'
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
  // Filter panel state
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
  const [selectedLanguageTags, setSelectedLanguageTags] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<string | null>(null)
  const [newOnly, setNewOnly] = useState(false)
  // Popover state
  const [filterOpen, setFilterOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  // Example tag options (replace with dynamic fetch if needed)
  const moodTagOptions = [
    { label: 'Party', color: 'pink' },
    { label: 'Chill', color: 'blue' },
    { label: 'Romantic', color: 'red' },
    { label: 'Energetic', color: 'orange' }
  ]
  const languageTagOptions = [
    { label: 'English', color: 'purple' },
    { label: 'French', color: 'green' },
    { label: 'Spanish', color: 'yellow' },
    { label: 'Other', color: 'slate' }
  ]
  const difficultyOptions = [
    { label: 'Easy', value: 'easy', color: 'green' },
    { label: 'Intermediate', value: 'intermediate', color: 'yellow' },
    { label: 'Hard', value: 'hard', color: 'red' }
  ]

  const searchSongs = async () => {
    setLoading(true)
    try {
      const filters = [`user_songs.user_id.eq.${user.id}`]
      if (searchTerm.trim()) {
        filters.push(`title.ilike.%${searchTerm}%`)
        filters.push(`artist.ilike.%${searchTerm}%`)
      }
      // Build the or filter for search term if present
      let query = supabase
        .from('songs')
        .select('*, user_songs!inner(*)')
      if (searchTerm.trim()) {
        query = query.or(
          `user_songs.user_id.eq.${user.id},title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`
        )
      } else {
        query = query.eq('user_songs.user_id', user.id)
      }

      // Mood tags
      if (selectedMoodTags.length > 0) {
        for (const tag of selectedMoodTags) {
          query = query.contains('user_songs.mood_tags', [tag])
        }
      }
      // Language tags
      if (selectedLanguageTags.length > 0) {
        for (const tag of selectedLanguageTags) {
          query = query.contains('user_songs.language_tags', [tag])
        }
      }
      // Difficulty (map string to number)
      if (difficulty) {
        let diffNum = null
        if (difficulty === 'easy') diffNum = 1
        if (difficulty === 'intermediate') diffNum = 2
        if (difficulty === 'hard') diffNum = 3
        if (diffNum !== null) {
          query = query.eq('user_songs.difficulty_rating', diffNum)
        }
      }
      // New only (created in last 30 days)
      if (newOnly) {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        query = query.gte('user_songs.created_at', date.toISOString())
      }

      query = query.limit(20)
      const { data } = await query
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
    <div className="space-y-6 min-h-screen p-4">
      {/* Search bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-4 sticky top-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search Spotify for songs or artists..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchSongs()}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
          />
          <button
            onClick={() => searchSongs()}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? <Loader size={22} /> : <Search size={22} />}
          </button>
        </div>
        {/* Pills row and popover button */}
        <div className="flex items-center gap-2 mt-2">
          {/* Show selected pills in a row */}
          {selectedMoodTags.map(label => {
            const opt = moodTagOptions.find(o => o.label === label)
            return opt ? (
              <Pill
                key={label}
                label={label}
                color={opt.color}
                selected
                onClick={() => setSelectedMoodTags(selectedMoodTags.filter(t => t !== label))}
              />
            ) : null
          })}
          {selectedLanguageTags.map(label => {
            const opt = languageTagOptions.find(o => o.label === label)
            return opt ? (
              <Pill
                key={label}
                label={label}
                color={opt.color}
                selected
                onClick={() => setSelectedLanguageTags(selectedLanguageTags.filter(t => t !== label))}
              />
            ) : null
          })}
          {difficulty && (() => {
            const opt = difficultyOptions.find(o => o.value === difficulty)
            return opt ? (
              <Pill
                key={opt.value}
                label={opt.label}
                color={opt.color}
                selected
                onClick={() => setDifficulty(null)}
              />
            ) : null
          })()}
          {newOnly && <Pill label="New only" color="purple" selected onClick={() => setNewOnly(false)} />}
          <FilterPopoverButton onClick={() => setFilterOpen(v => !v)} />
        </div>
        {/* Popover for filters */}
        {filterOpen && (
          <div ref={popoverRef} className="absolute z-50 mt-25 left-0 w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-wrap gap-6">
            {/* Mood tags */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-200">Mood Tags</label>
              <div className="flex flex-wrap gap-2">
                {moodTagOptions.map(opt => (
                  <Pill
                    key={opt.label}
                    label={opt.label}
                    color={opt.color}
                    selected={selectedMoodTags.includes(opt.label)}
                    onClick={() => setSelectedMoodTags(selectedMoodTags.includes(opt.label)
                      ? selectedMoodTags.filter(t => t !== opt.label)
                      : [...selectedMoodTags, opt.label])}
                  />
                ))}
              </div>
            </div>
            {/* Language tags */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-200">Language Tags</label>
              <div className="flex flex-wrap gap-2">
                {languageTagOptions.map(opt => (
                  <Pill
                    key={opt.label}
                    label={opt.label}
                    color={opt.color}
                    selected={selectedLanguageTags.includes(opt.label)}
                    onClick={() => setSelectedLanguageTags(selectedLanguageTags.includes(opt.label)
                      ? selectedLanguageTags.filter(t => t !== opt.label)
                      : [...selectedLanguageTags, opt.label])}
                  />
                ))}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-200">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map(opt => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    color={opt.color}
                    selected={difficulty === opt.value}
                    onClick={() => setDifficulty(difficulty === opt.value ? null : opt.value)}
                  />
                ))}
              </div>
            </div>
            {/* New only */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={e => setNewOnly(e.target.checked)}
                id="newOnly"
                className="accent-purple-600"
              />
              <label htmlFor="newOnly" className="text-xs font-semibold text-slate-200">New songs only</label>
            </div>
            <button
              className="ml-auto mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
              onClick={() => setFilterOpen(false)}
            >Close</button>
          </div>
        )}
      </div>

      {/* Song list */}
      <div className="grid gap-4 mt-8">
        {songs.map((song) => {
          const userSong = song.user_songs?.[0]
          return (
            <div key={song.id} className="bg-slate-800 rounded-xl shadow p-4 flex flex-col gap-2 border border-slate-700">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-slate-100 leading-tight">{song.title}</h3>
                  <p className="text-purple-400 text-sm mb-1">{song.artist}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded-full">{song.language}</span>
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
                        <span key={tag} className="px-2 py-1 bg-purple-900 text-purple-200 rounded-full text-xs font-medium">
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
                      className="flex items-center gap-1 px-3 py-2 bg-green-900 text-green-200 hover:bg-green-800 rounded-lg transition-colors text-xs font-semibold shadow"
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