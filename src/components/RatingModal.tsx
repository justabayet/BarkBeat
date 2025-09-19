
'use client'

import { useState } from 'react'
import { X, Star } from 'lucide-react'
import type { Song } from '@/lib/typesInfered'

interface RatingModalProps {
  song: Song
  onSubmit: (rating: {
    difficulty: number
    moodTags: string[]
    languageTags: string[]
    isFavorite: boolean
  }) => void
  onClose: () => void
}

const MOOD_TAGS = ['energetic', 'emotional', 'fun', 'romantic', 'party', 'chill', 'dramatic', 'nostalgic']
const LANGUAGE_TAGS = ['english', 'spanish', 'french', 'japanese', 'korean', 'mandarin', 'other']

export default function RatingModal({ song, onSubmit, onClose }: RatingModalProps) {
  const [difficulty, setDifficulty] = useState(5)
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [languageTags, setLanguageTags] = useState<string[]>(song.language != null ? [song.language] : [])
  const [isFavorite, setIsFavorite] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ difficulty, moodTags, languageTags, isFavorite })
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
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rate &quot;{song.title}&quot;</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Difficulty Rating (0 = Super Easy, 5 = Medium, 10 = Very Hard)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="10"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center font-bold">{difficulty}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              0-2: Easy to sing • 3-4: Some challenging parts • 5-6: Moderate skill needed • 7-8: Quite difficult • 9-10: Very challenging
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mood Tags</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag, moodTags, setMoodTags)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${moodTags.includes(tag)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language Tags</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag, languageTags, setLanguageTags)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${languageTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isFavorite
                ? 'bg-yellow-600/30 text-yellow-300'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              <Star size={16} className={isFavorite ? 'fill-current' : ''} />
              <span>Add to Favorites</span>
            </button>
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
              Save Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
