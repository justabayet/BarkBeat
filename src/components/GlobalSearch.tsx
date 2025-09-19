import { useState } from 'react';
import { Plus } from 'lucide-react';
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
      setResults(prev => opts?.append ? [...prev, ...newResults] : newResults);
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
    const { data: song, error: songError } = await supabase
      .from('songs')
      .upsert({
        id: track.id,
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
        song_id: track.id,
        times_performed: 0
      });
    if (!userSongError) setAddedId(track.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
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
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {results.map(track => (
          <div key={track.id} className="flex items-center gap-4 bg-white/5 rounded-lg px-3 py-2 min-h-[72px]">
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
              className="flex items-center justify-center w-10 h-10 bg-green-600/20 hover:bg-green-600/30 rounded-full transition-colors disabled:opacity-50 text-lg ml-2"
              aria-label={addedId === track.id ? 'Added' : 'Add'}
            >
              {addedId === track.id ? (
                <span className="text-green-400 text-2xl font-bold">&#10003;</span>
              ) : (
                <Plus size={24} />
              )}
            </button>
          </div>
        ))}
      </div>
      {hasMore && results.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => searchSpotify({ append: true })}
            disabled={loading}
            className="px-6 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
}
