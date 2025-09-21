'use client'

import { useState } from 'react'
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
        selectedLanguageTags,
        difficulty,
        newOnly
    }: {
        userId: string,
        searchTerm: string,
        selectedMoodTags: string[],
        selectedLanguageTags: string[],
        difficulty: string | null,
        newOnly: boolean
    }): Promise<AugmentedUserSong[]> => {
        setLoading(true)
        try {
            // Start from user_songs and include the related song
            let query = supabase
                .from('user_songs')
                .select(`*, songs (*)`)
                .eq('user_id', userId)

            // Mood tags (array contains)
            if (selectedMoodTags?.length > 0) {
                for (const tag of selectedMoodTags) {
                    query = query.contains('mood_tags', [tag])
                }
            }

            // Language tags
            if (selectedLanguageTags?.length > 0) {
                for (const tag of selectedLanguageTags) {
                    query = query.eq('language_override', tag)
                }
            }

            // Difficulty
            if (difficulty) {
                let diffNum: number | null = null
                if (difficulty === 'easy') diffNum = 0
                if (difficulty === 'intermediate') diffNum = 1
                if (difficulty === 'hard') diffNum = 2
                if (diffNum !== null) {
                    query = query.eq('difficulty_rating', diffNum)
                }
            }

            // New only (no rating yet)
            if (newOnly) {
                query = query.is('rating', null)
            }

            const { data, error } = await query
            if (error) throw error

            let filtered = data || [];
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                filtered = filtered.filter(row => {
                    const title = row.songs?.title?.toLowerCase() || '';
                    const artist = row.songs?.artist?.toLowerCase() || '';
                    return title.includes(term) || artist.includes(term);
                });
            }
            // Limit to 20 after filtering
            return filtered
                // .slice(0, 20)
                .sort((a, b) => {
                    const ratingA = a.rating ?? -1;
                    const ratingB = b.rating ?? -1;
                    return ratingB - ratingA;
                });
        } catch (error) {
            console.error('Search error:', error)
            return []
        } finally {
            setLoading(false)
        }
    }


    const debouncedSearchTerm = useDebounce({ userId: user.id, searchTerm, selectedMoodTags, difficulty, newOnly }, 500); // 500ms debounce

    const { data, mutate } = useSWR(
        debouncedSearchTerm,
        searchSongs, { revalidateOnFocus: false }
    );

    const songs = data || [];

    const { spotifySongs, loading: loadingSpotify } = useSpotifySongs(searchTerm)

    return (
        <div className="space-y-2 min-h-screen">
            {/* Search bar */}
            <div className="flex flex-col gap-2 sticky top-0 p-4 bg-gradient-to-b from-gray-900 via-gray-950">
                <div className="flex items-center space-x-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    {(loading || loadingSpotify) &&
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

            <SongList songs={songs} user={user} mutate={mutate} />
            <SongListSpotify songs={spotifySongs} user={user} />
        </div>
    )
}