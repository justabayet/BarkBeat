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
      <div className="grid gap-4">
        {results.map(track => (
          <div key={track.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between items-start">
              {track.album?.images?.[0]?.url && (
                <Image
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded shadow mr-4 object-cover"
                  style={{ minWidth: 64 }}
                  unoptimized
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{track.name}</h3>
                <p className="text-purple-200 mb-2">
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
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => addToLibrary(track)}
                  disabled={addedId === track.id}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>{addedId === track.id ? 'Added' : 'Add'}</span>
                </button>
              </div>
            </div>
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
