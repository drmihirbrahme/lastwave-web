import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import vm from 'vm';
import { Track, Album, Artist } from './types';

// Ensure custom evaluator is configured for deciphering YouTube streaming signatures
Platform.shim.eval = (data: { output: string }, env: Record<string, unknown>) => {
  try {
    const keys = Object.keys(env);
    const values = Object.values(env);
    const wrappedCode = `(function(${keys.join(',')}) { ${data.output} })(${values.map(v => JSON.stringify(v)).join(',')})`;
    return vm.runInNewContext(wrappedCode);
  } catch (err) {
    console.error('InnerTube VM decipher error:', err);
    throw err;
  }
};

let innertubeInstance: Innertube | null = null;
let instancePromise: Promise<Innertube> | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) return innertubeInstance;
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
      innertubeInstance = yt;
      return yt;
    } catch (e) {
      instancePromise = null;
      console.error('Failed to initialize Innertube instance:', e);
      throw e;
    }
  })();

  return instancePromise;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractCoverUrl(thumbnails: any): string {
  if (!thumbnails) return '/default-album.png';
  if (Array.isArray(thumbnails)) {
    const last = thumbnails[thumbnails.length - 1];
    return last?.url || '/default-album.png';
  }
  if (thumbnails.contents && Array.isArray(thumbnails.contents)) {
    const last = thumbnails.contents[thumbnails.contents.length - 1];
    return last?.url || '/default-album.png';
  }
  if (typeof thumbnails === 'string') return thumbnails;
  return thumbnails.url || '/default-album.png';
}

export async function searchMusic(query: string, filter?: 'songs' | 'albums' | 'artists' | 'all'): Promise<{
  songs: Track[];
  albums?: Album[];
  artists?: Artist[];
}> {
  const yt = await getInnertube();
  const search = await yt.music.search(query, {
    type: filter && filter !== 'all' ? (filter === 'songs' ? 'song' : filter === 'albums' ? 'album' : 'artist') : undefined,
  });

  const songs: Track[] = [];
  const albums: Album[] = [];
  const artists: Artist[] = [];

  // Parse songs from search results
  if (search.songs?.contents) {
    for (const item of search.songs.contents as any[]) {
      if (item.id && item.title) {
        const artistName = item.artists?.map((a: any) => a.name).join(', ') || item.author?.name || 'Unknown Artist';
        const artistId = item.artists?.[0]?.channel_id || item.artists?.[0]?.id;
        const durationSec = item.duration?.seconds || 0;

        songs.push({
          id: item.id,
          title: typeof item.title === 'string' ? item.title : item.title?.text || 'Unknown Title',
          artist: artistName,
          artistId: artistId,
          album: item.album?.name || '',
          albumId: item.album?.id,
          duration: durationSec,
          durationFormatted: item.duration?.text || formatDuration(durationSec),
          coverUrl: extractCoverUrl(item.thumbnails || item.thumbnail),
        });
      }
    }
  }

  // Parse general contents if songs category wasn't explicit
  if (songs.length === 0 && search.contents) {
    for (const shelf of search.contents as any[]) {
      if (shelf.contents) {
        for (const item of shelf.contents) {
          if (item.id && (item.type === 'MusicResponsiveListItem' || item.type === 'Song' || item.endpoint?.payload?.videoId)) {
            const videoId = item.id || item.endpoint?.payload?.videoId;
            const title = item.title?.text || item.title || item.name;
            const artistName = item.artists?.map((a: any) => a.name).join(', ') || item.author?.name || item.subtitle?.text || 'Unknown Artist';
            const durationSec = item.duration?.seconds || 0;

            if (videoId && title) {
              songs.push({
                id: videoId,
                title: typeof title === 'string' ? title : String(title),
                artist: artistName,
                duration: durationSec,
                durationFormatted: item.duration?.text || formatDuration(durationSec),
                coverUrl: extractCoverUrl(item.thumbnail || item.thumbnails),
              });
            }
          }
        }
      }
    }
  }

  return { songs, albums, artists };
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    const yt = await getInnertube();
    const suggestions = await yt.music.getSearchSuggestions(query);
    const results: string[] = [];

    if (suggestions) {
      for (const section of suggestions as any[]) {
        if (section.contents) {
          for (const item of section.contents) {
            const str =
              item.query?.text ||
              item.query ||
              item.runs?.map((r: any) => r.text).join('') ||
              item.title?.text ||
              item.title ||
              item.text?.text ||
              item.text;

            if (typeof str === 'string' && str.trim().length > 0) {
              results.push(str.trim());
            }
          }
        }
      }
    }
    // Remove duplicates
    return Array.from(new Set(results)).slice(0, 8);
  } catch (e) {
    console.error('Error fetching suggestions:', e);
    return [];
  }
}

export async function getAudioStream(videoId: string): Promise<{
  url: string;
  mimeType: string;
  bitrate: number;
  duration: number;
  title: string;
  artist: string;
  coverUrl: string;
}> {
  const yt = await getInnertube();
  const info = await yt.music.getInfo(videoId);

  const format = await info.chooseFormat({
    type: 'audio',
    quality: 'best',
  });

  if (!format) {
    throw new Error(`No suitable audio format found for video: ${videoId}`);
  }

  let directUrl = format.url;
  if (!directUrl && format.decipher) {
    directUrl = await format.decipher(yt.session.player);
  }

  if (!directUrl) {
    throw new Error(`Failed to resolve deciphered audio URL for: ${videoId}`);
  }

  const basic = info.basic_info;
  const durationSec = basic.duration || 0;
  const title = basic.title || 'Unknown Title';
  const artist = basic.author || 'Unknown Artist';
  const coverUrl = extractCoverUrl(basic.thumbnail);

  return {
    url: directUrl,
    mimeType: format.mime_type || 'audio/mp4',
    bitrate: format.bitrate || 128000,
    duration: durationSec,
    title,
    artist,
    coverUrl,
  };
}

export async function getUpNextRadio(videoId: string): Promise<Track[]> {
  const yt = await getInnertube();
  try {
    const upNext = await yt.music.getUpNext(videoId);
    const tracks: Track[] = [];

    if (upNext.contents) {
      for (const item of upNext.contents as any[]) {
        const id = item.id || item.endpoint?.payload?.videoId;
        if (!id || id === videoId) continue;

        const title = item.title?.text || item.title || 'Unknown Title';
        const artistName = item.artists?.map((a: any) => a.name).join(', ') || item.author?.name || 'Unknown Artist';
        const durationSec = item.duration?.seconds || 0;

        tracks.push({
          id,
          title: typeof title === 'string' ? title : String(title),
          artist: artistName,
          duration: durationSec,
          durationFormatted: item.duration?.text || formatDuration(durationSec),
          coverUrl: extractCoverUrl(item.thumbnail || item.thumbnails),
        });
      }
    }
    return tracks;
  } catch (e) {
    console.error('Error fetching UpNext radio:', e);
    return [];
  }
}

export async function getExploreFeed(): Promise<{
  trending: Track[];
  newReleases: Track[];
  quickPicks: Track[];
}> {
  const yt = await getInnertube();
  const trending: Track[] = [];
  const newReleases: Track[] = [];
  const quickPicks: Track[] = [];

  try {
    const explore = await yt.music.getExplore();
    if (explore.sections) {
      for (const section of explore.sections as any[]) {
        const title = section.title?.text || section.title || '';
        if (section.contents) {
          for (const item of section.contents) {
            const id = item.id || item.endpoint?.payload?.videoId;
            if (!id) continue;
            const itemTitle = item.title?.text || item.title || item.name || '';
            const artistName = item.artists?.map((a: any) => a.name).join(', ') || item.author?.name || item.subtitle?.text || 'Unknown Artist';
            const durationSec = item.duration?.seconds || 0;
            const trackObj: Track = {
              id,
              title: typeof itemTitle === 'string' ? itemTitle : String(itemTitle),
              artist: artistName,
              duration: durationSec,
              durationFormatted: item.duration?.text || formatDuration(durationSec),
              coverUrl: extractCoverUrl(item.thumbnail || item.thumbnails),
            };

            if (title.toLowerCase().includes('trending') || title.toLowerCase().includes('charts')) {
              trending.push(trackObj);
            } else if (title.toLowerCase().includes('new') || title.toLowerCase().includes('release')) {
              newReleases.push(trackObj);
            } else {
              quickPicks.push(trackObj);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Explore feed fallback to curated search:', e);
  }

  // If explore was sparse, populate with high-quality top charting seeds
  if (trending.length === 0) {
    const searchRes = await searchMusic('Top Hits Global 2026', 'songs');
    trending.push(...searchRes.songs.slice(0, 15));
  }
  if (newReleases.length === 0) {
    const searchRes = await searchMusic('New Music Friday 2026', 'songs');
    newReleases.push(...searchRes.songs.slice(0, 15));
  }
  if (quickPicks.length === 0) {
    const searchRes = await searchMusic('Pop Chill Vibes', 'songs');
    quickPicks.push(...searchRes.songs.slice(0, 15));
  }

  return { trending, newReleases, quickPicks };
}
