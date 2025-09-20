
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AugmentedUserSong } from '@/lib/typesInfered'
import Pill, { getDifficulty, pillConfig } from './Pill'

interface RatingModalProps {
  song: AugmentedUserSong
  onSubmit: (data: {
    difficulty: number
    moodTags: string[]
    language: string | null
    rating: number
  }) => void
  onClose: () => void
}

export default function RatingModal({ song, onSubmit, onClose }: RatingModalProps) {
  const userSong = song
  const [rating, setRating] = useState(userSong?.rating ?? 0)
  const [moodTags, setMoodTags] = useState<string[]>(userSong?.mood_tags ?? [])
  const [difficulty, setDifficulty] = useState<number>(userSong?.difficulty_rating ?? -1)
  const [language, setLanguage] = useState<string | null>((userSong.language_override ?? song.songs?.language) || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ difficulty, moodTags, language, rating })
  }

  const toggleTag = (tag: string, currentTags: string[], setTags: (tags: string[]) => void) => {
    if (currentTags.includes(tag)) {
      setTags(currentTags.filter(t => t !== tag))
    } else {
      setTags([...currentTags, tag])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className=" bg-gradient-to-b from-gray-900 via-gray-950 to-gray-950 rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{song.songs?.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <p className="text-purple-400 text-lg mb-4">{song.songs?.artist}</p>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-lg font-medium mb-3">
              Rating
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center font-bold">{rating}</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-s font-semibold mb-1 text-slate-200">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {pillConfig.difficulty.map(opt => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  color={opt.color}
                  selected={difficulty === getDifficulty(opt.label)}
                  onClick={() => setDifficulty(difficulty === getDifficulty(opt.label) ? -1 : getDifficulty(opt.label))}
                />
              ))}
            </div>
          </div>
          {/* Mood tags */}
          <div>
            <label className="block text-s font-semibold mb-1 text-slate-200">Mood</label>
            <div className="flex flex-wrap gap-2">
              {pillConfig.mood.map(opt => (
                <Pill
                  key={opt.label}
                  label={opt.label}
                  color={opt.color}
                  selected={moodTags.includes(opt.label)}
                  onClick={() => toggleTag(opt.label, moodTags, setMoodTags)}
                />
              ))}
            </div>
          </div>
          {/* Language tags */}
          <div>
            <label className="block text-s font-semibold mb-1 text-slate-200">Language</label>
            <div className="flex flex-wrap gap-2">
              {pillConfig.language.map(opt => (
                <Pill
                  key={opt.label}
                  label={opt.label}
                  color={opt.color}
                  selected={language === opt.label}
                  onClick={() => setLanguage(language === opt.label ? null : opt.label)}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
