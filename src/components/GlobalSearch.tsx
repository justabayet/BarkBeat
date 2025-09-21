import { useState, useRef, useEffect } from 'react';
import { v5 as uuidv5 } from 'uuid';
import { Loader, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce';
import useSWR from 'swr';

interface GlobalSearchProps {
    user: User;
}

export type SpotifyTrack = {
    id: string;
    name: string;
    artists: { name: string }[];
    album?: { name: string; images?: { url: string }[] };
};

export default function GlobalSearch({ user }: GlobalSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [userLibrary, setUserLibrary] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);

    // Fetch user's library of Spotify song IDs on mount
    useEffect(() => {
        type UserSongWithSpotify = { songs: { spotify_id: string } | null };
        const fetchLibrary = async () => {
            const { data, error } = await supabase
                .from('user_songs')
                .select('song_id, songs(spotify_id)')
                .eq('user_id', user.id);
            if (!error && data) {
                const ids = (data as UserSongWithSpotify[]).map(row => row.songs?.spotify_id).filter((id): id is string => Boolean(id));
                setUserLibrary(new Set(ids));
            }
        };
        fetchLibrary();
    }, [user.id]);

    const searchSpotify = useCallback(async (opts?: { append?: boolean; customTerm?: string }) => {
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
        } catch {
            setResults([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, offset]);

    const addToLibrary = async (track: SpotifyTrack) => {
        setUserLibrary((prev) => {
            const newLibrary = new Set(prev);
            newLibrary.add(track.id);
            return newLibrary;
        });

        const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace
        const songId = uuidv5(track.id, NAMESPACE);
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
        if (userSongError) {
            setUserLibrary((prev) => {
                const newLibrary = new Set(prev);
                newLibrary.delete(track.id);
                return newLibrary;
            });
        };
    };

    // Infinite scroll effect
    useEffect(() => {
        if (!hasMore || loading) return;
        const handleScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.body.offsetHeight - 300;
            if (scrollPosition >= threshold) {
                searchSpotify({ append: true });
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [hasMore, loading, results, searchSpotify]);



    const debouncedSearchTerm = useDebounce({ searchTerm }, 500); // 500ms debounce

    useSWR(
        debouncedSearchTerm,
        searchSpotify, { revalidateOnFocus: false }
    );


    return (
        <div className="space-y-10 p-4">
            <div className="flex items-center space-x-4 sticky top-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                {loading &&
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
            <div ref={listRef} className="flex flex-col gap-8">
                {results.map(track => (
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
                            disabled={userLibrary.has(track.id)}
                            className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg rounded-full transition-all duration-150 disabled:opacity-60 text-lg ml-2 border border-purple-800/40"
                            aria-label={userLibrary.has(track.id) ? 'Added' : 'Add'}
                        >
                            {(userLibrary.has(track.id)) ? (
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
