/* eslint-disable @typescript-eslint/no-explicit-any */
import { AugmentedSong, Song } from "@/lib/typesInfered"
import { Star } from "lucide-react"
import { useState } from "react"
import RatingModal from "../RatingModal"
import { supabase } from "@/lib/supabase"
import Pill, { getDifficulty, getDifficultyString, pillConfig, PillKnown } from "../Pill"

interface SongListProps {
    songs: AugmentedSong[]
    user: { id: string }
    searchSongs: () => void
}

export default function SongList({ songs, user, searchSongs }: SongListProps) {
    const [selectedSong, setSelectedSong] = useState<AugmentedSong | null>(null)
    const [showRatingModal, setShowRatingModal] = useState(false)

    const handleRatingSubmit = async (data: {
        difficulty: number
        moodTags: string[]
        language: string | null
        rating: number
    }) => {
        if (!selectedSong) return

        console.log('Submitting rating data:', data)

        await supabase
            .from('user_songs')
            .update({
                difficulty_rating: data.difficulty,
                mood_tags: data.moodTags,
                language_override: data.language,
                rating: data.rating
            })
            .eq('user_id', user.id)
            .eq('song_id', selectedSong.id)

        setShowRatingModal(false)
        setSelectedSong(null)
        searchSongs() // Refresh results
    }

    const openRatingModal = (song: AugmentedSong) => {
        setSelectedSong(song)
        setShowRatingModal(true)
    }

    return (<>
        <div className="grid gap-6 p-4 pt-0">
            {songs.map((song) => <SongItem song={song} key={song.id} openRatingModal={openRatingModal} />)}
        </div>

        {showRatingModal && selectedSong && (
            <RatingModal
                song={selectedSong}
                onSubmit={handleRatingSubmit}
                onClose={() => setShowRatingModal(false)}
            />
        )}
    </>)
}

interface SongItemProps {
    song: AugmentedSong
    openRatingModal: (song: AugmentedSong) => void
}
function SongItem({ song, openRatingModal }: SongItemProps) {
    const userSong = song.user_songs?.[0]
    const isFavorite = true// (userSong?.rating ?? -1) > 8
    const languageTag = userSong?.language_override || song.language

    const getDifficultyLabel = (numericValue: number | null | undefined) => {
        if (numericValue == null) {
            return null
        }
        return getDifficultyString(numericValue)
    }

    const getTextColor = (rating: number | null | undefined) => {
        if (rating == null) return 'text-slate-400'
        if (rating >= 8) return 'text-green-400'
        if (rating >= 5) return 'text-yellow-400'
        if (rating >= 2) return 'text-orange-400'
        return 'text-red-400'
    }
    const difficultyLabel = getDifficultyLabel(userSong?.difficulty_rating)
    return (
        <div className="bg-slate-800 rounded-xl shadow p-4 flex flex-col gap-2 border border-slate-700"
            onClick={() => openRatingModal(song)}>
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base text-slate-100 leading-tight">{song.title}</h3>
                    <p className="text-purple-400 text-sm mb-3">{song.artist}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {languageTag != null && (
                            <PillKnown label={languageTag} category="language" selected={false} />
                        )}
                        {userSong?.mood_tags && (
                            userSong?.mood_tags.map((tag) => {
                                const foundTag = pillConfig.mood.find(t => t.label === tag)
                                if (!foundTag) return null
                                return (
                                    <Pill key={tag} label={foundTag.label} selected={false} color={foundTag.color} />
                                )
                            })
                        )}
                        {
                            difficultyLabel && (
                                <PillKnown label={difficultyLabel} category="difficulty" selected={false} />
                            )
                        }
                    </div>
                </div>
                {userSong?.rating && (
                    <div className={`flex items-center gap-2 ${getTextColor(userSong.rating)} text-xl font-bold`}>
                        <span>{userSong.rating}</span>
                    </div>
                )}
            </div>
        </div>
    )
}