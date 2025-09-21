'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Search, Loader } from 'lucide-react'
import FiltersPanel from './FiltersPanel'
import SongList from './SongList'
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce'
import { AugmentedUserSong } from '@/lib/typesInfered'
import useSpotifySongs from '@/hooks/useSpotifySongs'
import SongListSpotify from './SongListSpotify'

interface SongSearchProps {
    user: User
}

export default function SongSearch({ user }: SongSearchProps) {
    const [searchTerm, setSearchTerm] = useState('')
    // Filter panel state
    const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([])
    const [selectedLanguageTags, setSelectedLanguageTags] = useState<string[]>([])
    const [difficulty, setDifficulty] = useState<string | null>(null)
    const [newOnly, setNewOnly] = useState(false)


    // Fetch all user songs once
    const fetchAllUserSongs = async (userId: string): Promise<AugmentedUserSong[]> => {
        try {
            const { data, error } = await supabase
                .from('user_songs')
                .select(`*, songs (*)`)
                .eq('user_id', userId)

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Fetch error:', error)
            return []
        }
    }

    const { data: userLibrary = [], mutate } = useSWR(
        `user-songs-${user.id}`,
        () => fetchAllUserSongs(user.id),
        { revalidateOnFocus: false }
    )

    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    // Client-side filtering with useMemo for performance
    const filteredSongs = useMemo(() => {
        let filtered = [...userLibrary]

        // Search term filter
        if (debouncedSearchTerm.trim()) {
            const term = debouncedSearchTerm.trim().toLowerCase()
            filtered = filtered.filter(row => {
                const title = row.songs?.title?.toLowerCase() || ''
                const artist = row.songs?.artist?.toLowerCase() || ''
                return title.includes(term) || artist.includes(term)
            })
        }

        // Mood tags filter
        if (selectedMoodTags.length > 0) {
            filtered = filtered.filter(row => {
                const moodTags = row.mood_tags || []
                return selectedMoodTags.every(tag => moodTags.includes(tag))
            })
        }

        // Language tags filter
        if (selectedLanguageTags.length > 0) {
            filtered = filtered.filter(row =>
                selectedLanguageTags.includes(row.language_override || '')
            )
        }

        // Difficulty filter
        if (difficulty) {
            let diffNum: number | null = null
            if (difficulty === 'easy') diffNum = 0
            if (difficulty === 'intermediate') diffNum = 1
            if (difficulty === 'hard') diffNum = 2

            if (diffNum !== null) {
                filtered = filtered.filter(row => row.difficulty_rating === diffNum)
            }
        }

        // New only filter
        if (newOnly) {
            filtered = filtered.filter(row => row.rating === null)
        }

        // Sort by rating (highest first, null ratings last)
        return filtered.sort((a, b) => {
            const ratingA = a.rating ?? -1
            const ratingB = b.rating ?? -1
            return ratingB - ratingA
        })
    }, [userLibrary, debouncedSearchTerm, selectedMoodTags, selectedLanguageTags, difficulty, newOnly])

    const { spotifySongs, loading: loadingSpotify } = useSpotifySongs(searchTerm)

    // When filteredSongs or spotifySongs change, we scroll to top
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [debouncedSearchTerm, selectedMoodTags, selectedLanguageTags, difficulty, newOnly])

    return (
        <div className="space-y-2 min-h-screen">
            {/* Search bar */}
            <div className="flex flex-col gap-2 sticky top-0 p-4 bg-gradient-to-b from-gray-900 via-gray-950">
                <div className="flex items-center space-x-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    {(loadingSpotify) &&
                        <Loader className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    }
                    <input
                        type="text"
                        placeholder="Search Spotify for songs or artists..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                    />
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

            <SongList songs={filteredSongs} user={user} />
            {searchTerm.trim() !== '' && <SongListSpotify songs={spotifySongs} user={user} userLibrary={userLibrary} loading={loadingSpotify} />}
        </div>
    )
}