import { useState, useRef, useEffect } from 'react';
import { v5 as uuidv5 } from 'uuid';
import { Loader, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface GlobalSearchProps {
    user: User;
}

type SpotifyTrack = {
    id: string;
    name: string;
    artists: { name: string }[];
    album?: { name: string; images?: { url: string }[] };
};

export default function GlobalSearch({ user }: GlobalSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    const searchSpotify = async (opts?: { append?: boolean; customTerm?: string }) => {
        const term = opts?.customTerm ?? searchTerm;
        if (!term.trim()) return;
        setLoading(true);
        if (!opts?.append) {
            setResults([]);
            setOffset(0);
            setHasMore(true);
        }
        try {
            const res = await fetch(`/search?q=${encodeURIComponent(term)}&type=track&offset=${opts?.append ? offset : 0}`);
            const data = await res.json();
            const newResults = data.tracks?.items || [];
            setResults(prev => {
                if (opts?.append) {
                    // Filter out tracks with duplicate IDs
                    const existingIds = new Set(prev.map((t: SpotifyTrack) => t.id));
                    const filtered = newResults.filter((t: SpotifyTrack) => !existingIds.has(t.id));
                    return [...prev, ...filtered];
                } else {
                    return newResults;
                }
            });
            setOffset(prev => (opts?.append ? prev + newResults.length : newResults.length));
            setHasMore((data.tracks?.next != null) && newResults.length > 0);
            if (opts?.customTerm) setSearchTerm(opts.customTerm);
        } catch (e) {
            setResults([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const addToLibrary = async (track: SpotifyTrack) => {
        // Insert into songs table if not exists, then into user_songs
        // The songs table expects a UUID for id, but Spotify track.id is not a UUID.
        // Use a surrogate UUID by hashing the Spotify id, or store the Spotify id in a separate column.
        // Here, we use a deterministic UUID v5 from the Spotify id string.
        const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace
        const songId = uuidv5(track.id, NAMESPACE);
        const { data: song, error: songError } = await supabase
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
                song_id: songId,
                times_performed: 0
            });
        if (!userSongError) setAddedId(track.id);
    };

    // Infinite scroll effect
    useEffect(() => {
        if (!hasMore || loading) return;
        const handleScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.body.offsetHeight - 200;
            if (scrollPosition >= threshold) {
                searchSpotify({ append: true });
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [hasMore, loading, results]);

    return (
        <div className="space-y-10">
            <div className="flex items-center space-x-4 sticky top-6">
                <input
                    type="text"
                    placeholder="Search Spotify for songs or artists..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && searchSpotify()}
                    className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                    onClick={() => searchSpotify()}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                    {loading ?
                        <Loader size={22} /> : <Search size={22} />}
                </button>
            </div>
            <div ref={listRef} className="flex flex-col gap-8 px-2">
                {results.map(track => (
                    <div key={track.id} className="flex items-center gap-4 rounded-lg px-3 py-2 min-h-[72px]">
                        {track.album?.images?.[0]?.url && (
                            <Image
                                src={track.album.images[0].url}
                                alt={track.album.name}
                                width={72}
                                height={72}
                                className="w-18 h-18 rounded object-cover flex-shrink-0"
                                style={{ minWidth: 72, minHeight: 72, maxHeight: 72, maxWidth: 72 }}
                                unoptimized
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
                                                setSearchTerm(artistQuery);
                                                searchSpotify({ customTerm: artistQuery });
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
                            disabled={addedId === track.id}
                            className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg rounded-full transition-all duration-150 disabled:opacity-60 text-lg ml-2 border border-purple-800/40"
                            aria-label={addedId === track.id ? 'Added' : 'Add'}
                        >
                            {addedId === track.id ? (
                                <span className="text-purple-200 text-2xl font-bold">&#10003;</span>
                            ) : (
                                <Plus size={24} className="text-white" />
                            )}
                        </button>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-center py-2 text-purple-300">Loading...</div>
                )}
            </div>
        </div>
    );
}
