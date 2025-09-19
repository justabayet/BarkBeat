import { NextRequest, NextResponse } from 'next/server';

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

async function getSpotifyAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get Spotify access token');
  const data = await res.json();
  return data.access_token;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type') || 'track';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const accessToken = await getSpotifyAccessToken();
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=10&offset=${offset}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await searchRes.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
