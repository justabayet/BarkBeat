import { User } from "@supabase/supabase-js";
import { AugmentedUserSong } from "@/lib/typesInfered";
import Image from "next/image";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { v5 as uuidv5 } from 'uuid';
import { mutate } from "swr";

interface SongListSpotifyProps {
    songs: SpotifyTrack[];
    user: User;
    userLibrary: AugmentedUserSong[];
    loading: boolean;
}

export type SpotifyTrack = {
    id: string;
    name: string;
    artists: { name: string }[];
    album?: { name: string; images?: { url: string }[] };
};

export default function SongListSpotify({ songs, userLibrary, loading, user }: SongListSpotifyProps) {
    // Filter out songs that are already in the user's library. By id or by artist + title combo
    const filteredSongs = songs.filter(song => {
        const inLibraryById = userLibrary.some(us => us.songs?.spotify_id === song.id);
        const inLibraryByArtistTitle = userLibrary.some(us => {
            const titleMatch = us.songs?.title?.toLowerCase() === song.name.toLowerCase();
            const artistMatch = us.songs?.artist && song.artists.some(a => a.name.toLowerCase() === us.songs?.artist?.toLowerCase());
            return titleMatch && artistMatch;
        });
        return !inLibraryById && !inLibraryByArtistTitle;
    });

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Spotify Search Results</h2>
            {filteredSongs.length === 0 ? (
                loading ? <p>Loading...</p> : <p>No songs found.</p>
            ) : (
                <ul className="space-y-4">
                    {filteredSongs.map(song => (<SongItemSotify key={song.id} user={user} song={song} userLibrary={userLibrary} />))}
                </ul>
            )}
        </div>
    )
}

interface SongItemSotifyProps {
    song: SpotifyTrack
    userLibrary: AugmentedUserSong[]
    user: User
}

function SongItemSotify({ song: track, userLibrary, user }: SongItemSotifyProps) {
    const userLibraryIds = new Set(userLibrary.map(s => s.songs?.spotify_id).filter((id): id is string => Boolean(id)));
    const addToLibrary = async (track: SpotifyTrack) => {
        const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace
        const songId = uuidv5(track.id, NAMESPACE);

        const newTrack = {
            id: "temp_id",
            user_id: user.id,
            song_id: songId,
            "difficulty_rating": -1,
            "rating": null,
            "language_override": null,
            "mood_tags": [],
            "created_at": Date.now(),
            "songs": {
                "id": songId,
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                "language": "",
                "created_at": Date.now(),
                "spotify_id": track.id,
            }
        }

        mutate(`user-songs-${user.id}`, [...userLibrary, newTrack], false);
        const { error: songError } = await supabase
            .from('songs')
            .upsert({
                id: songId,
                spotify_id: track.id,
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                language: '', // Optional: set if available
            }, { onConflict: 'id' })
            .select()
            .single();
        if (songError) {
            console.log('song upsert error', songError);
            return alert('Error adding song');
        }
        const { error: userSongError } = await supabase
            .from('user_songs')
            .insert({
                user_id: user.id,
                song_id: songId
            });
        if (!userSongError) {
            mutate(`user-songs-${user.id}`);
        };
    };
    return (
        <div key={track.id} className="flex items-center gap-4 rounded-lg py-2 min-h-[72px]">
            {track.album?.images?.[0]?.url && (
                <Image
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    width={72}
                    height={72}
                    className="w-18 h-18 rounded object-cover flex-shrink-0"
                    style={{ minWidth: 72, minHeight: 72, maxHeight: 72, maxWidth: 72 }}
                    unoptimized
                    loader={() => '/placeholder.png'}
                />
            )}
            <div className="flex-1 min-w-0">
                <span className="font-semibold text-base text-white truncate block">{track.name}</span>
                <span className="text-purple-200 text-sm truncate block">
                    {track.artists.map((a, i) => (
                        <span key={a.name}>
                            <span
                                className="hover:underline cursor-pointer text-purple-300"
                                onClick={() => {
                                    const artistQuery = `artist:${a.name}`;
                                    // setSearchTerm(artistQuery);
                                    // searchSpotify({ customTerm: artistQuery });
                                }}
                            >
                                {a.name}
                            </span>
                            {i < track.artists.length - 1 && ', '}
                        </span>
                    ))}
                </span>
            </div>
            <button
                onClick={() => addToLibrary(track)}
                disabled={userLibraryIds.has(track.id)}
                className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg rounded-full transition-all duration-150 disabled:opacity-60 text-lg ml-2 border border-purple-800/40"
                aria-label={userLibraryIds.has(track.id) ? 'Added' : 'Add'}
            >
                {(userLibraryIds.has(track.id)) ? (
                    <span className="text-purple-200 text-2xl font-bold">&#10003;</span>
                ) : (
                    <Plus size={24} className="text-white" />
                )}
            </button>
        </div>
    )
}