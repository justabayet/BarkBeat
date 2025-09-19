import { Song, UserSong } from "@/lib/typesInfered"
import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'
import { User } from "@supabase/supabase-js"

interface LibraryProps {
    user: User
}

export default function Library({ user }: LibraryProps) {
    const [userSongs, setUserSongs] = useState<(UserSong & { songs: Song })[]>([])

    useEffect(() => {
        const loadUserSongs = async () => {
            const { data } = await supabase
                .from('user_songs')
                .select(`
            *,
            songs (*)
            `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setUserSongs((data || []).filter((us) => us.songs !== null) as (UserSong & { songs: Song })[])
        }

        loadUserSongs()
    }, [user.id])

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">My Song Library</h2>
            <div className="grid gap-4">
                {userSongs.map((userSong) => (
                    <div key={userSong.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-slate-100">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-base leading-tight">{userSong.songs.title}</h3>
                                <p className="text-purple-600 text-sm">{userSong.songs.artist}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span>Difficulty: {userSong.difficulty_rating || 'Not rated'}/10</span>
                                    <span>Rating: {userSong.rating || 'Not rated'}/10</span>
                                </div>
                                {userSong.mood_tags && userSong.mood_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {userSong.mood_tags.map((tag) => (
                                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {(userSong.rating ?? -1) > 8 && <span className="text-yellow-400 text-xl">⭐</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}