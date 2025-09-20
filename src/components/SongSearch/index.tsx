'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Search, Loader } from 'lucide-react'
import FiltersPanel from './FiltersPanel'
import SongList from './SongList'
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce'

interface SongSearchProps {
    user: User
}

export default function SongSearch({ user }: SongSearchProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    // Filter panel state
    const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
    const [selectedLanguageTags, setSelectedLanguageTags] = useState<string[]>([])
    const [difficulty, setDifficulty] = useState<string | null>(null)
    const [newOnly, setNewOnly] = useState(false)

    const searchSongs = async ({
        userId,
        searchTerm,
        selectedMoodTags,
        difficulty,
        newOnly
    }: {
        userId: string,
        searchTerm: string,
        selectedMoodTags: string[],
        difficulty: string | null,
        newOnly: boolean
    }) => {
        setLoading(true)
        try {
            const filters = [`user_songs.user_id.eq.${userId}`]
            if (searchTerm.trim()) {
                filters.push(`title.ilike.%${searchTerm}%`)
                filters.push(`artist.ilike.%${searchTerm}%`)
            }
            // Build the or filter for search term if present
            let query = supabase
                .from('songs')
                .select('*, user_songs!inner(*)')
                .eq('user_songs.user_id', userId) // always filter by user_id first

            if (searchTerm.trim()) {
                // only the title/artist search is OR'd
                query = query.or(
                    `title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`
                )
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
                    query = query.eq('user_songs.language_override', tag)
                }
            }
            // Difficulty (map string to number)
            if (difficulty) {
                let diffNum = null
                if (difficulty === 'easy') diffNum = 0
                if (difficulty === 'intermediate') diffNum = 1
                if (difficulty === 'hard') diffNum = 2
                if (diffNum !== null) {
                    query = query.eq('user_songs.difficulty_rating', diffNum)
                }
            }
            // New only (has not rating yet)
            if (newOnly) {
                query = query.is('user_songs.rating', null)
            }

            query = query.limit(20)
            const { data } = await query
            return data || []
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearchTerm = useDebounce({ userId: user.id, searchTerm, selectedMoodTags, difficulty, newOnly }, 500); // 500ms debounce

    const { data } = useSWR(
        debouncedSearchTerm,
        searchSongs, { revalidateOnFocus: false }
    );

    const songs = data || [];


    return (
        <div className="space-y-2 min-h-screen">
            {/* Search bar */}
            <div className="flex flex-col gap-2 sticky top-0 p-4 bg-gradient-to-b from-gray-900 via-gray-950">
                <div className="flex items-center space-x-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    {loading &&
                        <Loader className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    }
                    <input
                        type="text"
                        placeholder="Search Spotify for songs or artists..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        // onKeyDown={e => e.key === 'Enter' && searchSongs()}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                    />
                    {/* <button
                        // onClick={() => searchSongs()}
                        disabled={loading}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        {loading ? <Loader size={22} /> : <Search size={22} />}
                    </button> */}
                </div>
                {/* Pills row and popover button */}
                <FiltersPanel
                    selectedMoodTags={selectedMoodTags}
                    setSelectedMoodTags={setSelectedMoodTags}
                    selectedLanguageTags={selectedLanguageTags}
                    setSelectedLanguageTags={setSelectedLanguageTags}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    newOnly={newOnly}
                    setNewOnly={setNewOnly}
                />
            </div>

            <SongList songs={songs} user={user} />
        </div>
    )
}