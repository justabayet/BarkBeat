import { User } from "@supabase/supabase-js";
import { SpotifyTrack } from "../GlobalSearch";
import { AugmentedUserSong } from "@/lib/typesInfered";

interface SongListSpotifyProps {
    songs: SpotifyTrack[];
    user: User;
    allSongs?: AugmentedUserSong[];
    loading: boolean;
}

export default function SongListSpotify({ songs, allSongs, loading }: SongListSpotifyProps) {
    // Filter out songs that are already in the user's library
    const userSongIds = new Set(allSongs?.map(s => s.songs?.spotify_id).filter((id): id is string => Boolean(id)) || []);
    const filteredSongs = songs.filter(song => !userSongIds.has(song.id));

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Spotify Search Results</h2>
            {filteredSongs.length === 0 ? (
                loading ? <p>Loading...</p> : <p>No songs found.</p>
            ) : (
                <ul className="space-y-4">
                    {filteredSongs.map(song => (
                        <li key={song.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4">
                                {song.album?.images && song.album.images[0] && (
                                    <img src={song.album.images[0].url} alt={song.name} className="w-16 h-16 object-cover rounded" />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">{song.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {song.artists.map(artist => artist.name).join(', ')}
                                    </p>
                                    {song.album && <p className="text-sm text-gray-500">Album: {song.album.name}</p>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}