import crypto from 'crypto';
import { LastFmRecentTrack, LastFmConfig } from './types';

const LASTFM_API_ROOT = 'https://ws.audioscrobbler.com/2.0/';
// Default public fallback key for read-only features if user hasn't provided one
const DEFAULT_API_KEY = 'b25b959554ed76058ac220b7b2e0a026';

function generateSignature(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let sigString = '';
  for (const key of sortedKeys) {
    if (key !== 'format' && key !== 'api_sig') {
      sigString += key + params[key];
    }
  }
  sigString += secret;
  return crypto.createHash('md5').update(sigString, 'utf8').digest('hex');
}

export async function updateNowPlaying(
  config: LastFmConfig,
  track: { title: string; artist: string; album?: string; duration?: number }
): Promise<boolean> {
  if (!config.scrobbleEnabled || !config.nowPlayingEnabled || !config.sessionKey || !config.apiKey || !config.apiSecret) {
    return false;
  }

  const params: Record<string, string> = {
    method: 'track.updateNowPlaying',
    track: track.title,
    artist: track.artist,
    api_key: config.apiKey,
    sk: config.sessionKey,
  };
  if (track.album) params.album = track.album;
  if (track.duration) params.duration = Math.round(track.duration).toString();

  params.api_sig = generateSignature(params, config.apiSecret);
  params.format = 'json';

  try {
    const res = await fetch(LASTFM_API_ROOT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    return res.ok;
  } catch (e) {
    console.error('Last.fm updateNowPlaying error:', e);
    return false;
  }
}

export async function scrobbleTrack(
  config: LastFmConfig,
  track: { title: string; artist: string; album?: string; duration?: number; timestamp: number }
): Promise<boolean> {
  if (!config.scrobbleEnabled || !config.sessionKey || !config.apiKey || !config.apiSecret) {
    return false;
  }

  const params: Record<string, string> = {
    method: 'track.scrobble',
    track: track.title,
    artist: track.artist,
    timestamp: Math.round(track.timestamp / 1000).toString(),
    api_key: config.apiKey,
    sk: config.sessionKey,
  };
  if (track.album) params.album = track.album;
  if (track.duration) params.duration = Math.round(track.duration).toString();

  params.api_sig = generateSignature(params, config.apiSecret);
  params.format = 'json';

  try {
    const res = await fetch(LASTFM_API_ROOT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    return res.ok;
  } catch (e) {
    console.error('Last.fm scrobbleTrack error:', e);
    return false;
  }
}

export async function getUserRecentTracks(
  username: string,
  apiKey?: string,
  limit: number = 20
): Promise<LastFmRecentTrack[]> {
  const key = apiKey || DEFAULT_API_KEY;
  const url = `${LASTFM_API_ROOT}?method=user.getrecenttracks&user=${encodeURIComponent(
    username
  )}&api_key=${key}&format=json&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data.recenttracks?.track;
    if (!Array.isArray(tracks)) return [];

    return tracks.map((t: any) => ({
      name: t.name,
      artist: typeof t.artist === 'object' ? t.artist['#text'] : t.artist,
      album: typeof t.album === 'object' ? t.album['#text'] : t.album,
      image: t.image?.[t.image?.length - 1]?.['#text'] || '/default-album.png',
      url: t.url,
      date: t.date?.['#text'],
      nowPlaying: t['@attr']?.nowplaying === 'true',
    }));
  } catch (e) {
    console.error('Last.fm getUserRecentTracks error:', e);
    return [];
  }
}

export async function getUserTopArtists(
  username: string,
  apiKey?: string,
  period: 'overall' | '7day' | '1month' | '12month' = '1month',
  limit: number = 10
): Promise<{ name: string; playcount: string; image: string }[]> {
  const key = apiKey || DEFAULT_API_KEY;
  const url = `${LASTFM_API_ROOT}?method=user.gettopartists&user=${encodeURIComponent(
    username
  )}&period=${period}&api_key=${key}&format=json&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const artists = data.topartists?.artist;
    if (!Array.isArray(artists)) return [];

    return artists.map((a: any) => ({
      name: a.name,
      playcount: a.playcount,
      image: a.image?.[a.image?.length - 1]?.['#text'] || '/default-album.png',
    }));
  } catch (e) {
    console.error('Last.fm getUserTopArtists error:', e);
    return [];
  }
}

export async function getUserFriends(
  username: string,
  apiKey?: string
): Promise<{ name: string; realname?: string; image: string; url: string }[]> {
  const key = apiKey || DEFAULT_API_KEY;
  const url = `${LASTFM_API_ROOT}?method=user.getfriends&user=${encodeURIComponent(
    username
  )}&api_key=${key}&format=json&limit=15`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const friends = data.friends?.user;
    if (!Array.isArray(friends)) return [];

    return friends.map((f: any) => ({
      name: f.name,
      realname: f.realname,
      image: f.image?.[f.image?.length - 1]?.['#text'] || '/default-avatar.png',
      url: f.url,
    }));
  } catch (e) {
    console.error('Last.fm getUserFriends error:', e);
    return [];
  }
}
