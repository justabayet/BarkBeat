import { SpotifyTrack } from "@/components/GlobalSearch";
import { useState, useCallback, useEffect } from "react";
import useDebounce from "./useDebounce";
import useSWR from "swr";

export default function useSpotifySongs(searchTerm: string) {
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);


    const searchSpotify = useCallback(async (opts?: { append?: boolean }) => {
        if (!searchTerm.trim()) {
            setResults([]);
            setHasMore(false);
            return;
        }
        setLoading(true);
        if (!opts?.append) {
            setResults([]);
            setOffset(0);
            setHasMore(true);
        }
        try {
            const res = await fetch(`/search?q=${encodeURIComponent(searchTerm)}&type=track&offset=${opts?.append ? offset : 0}`);
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
        } catch {
            setResults([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, offset]);


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

    return { spotifySongs: results, loading }
}