import { LyricLine, LyricsData } from './types';

export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines: LyricLine[] = [];
  const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  const rawLines = lrcText.split('\n');
  for (const raw of rawLines) {
    const match = raw.match(lrcRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
      const start_ms = minutes * 60 * 1000 + seconds * 1000 + fraction;
      const text = match[4].trim();
      lines.push({ start_ms, text });
    }
  }

  // Sort chronologically and assign approximate end_ms
  lines.sort((a, b) => a.start_ms - b.start_ms);
  for (let i = 0; i < lines.length; i++) {
    if (i < lines.length - 1) {
      lines[i].end_ms = lines[i + 1].start_ms;
    } else {
      lines[i].end_ms = lines[i].start_ms + 4000;
    }
  }

  return lines;
}

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  durationSec?: number
): Promise<LyricsData> {
  // Clean up track title (remove "Official Video", "(feat. ...)", etc.)
  const cleanTitle = trackName
    .replace(/\s*[\(\[](official\s*(music)?\s*(video|audio)|feat\.?|ft\.?|lyrics?|remastered).*?[\)\]]/gi, '')
    .trim();
  const cleanArtist = artistName.split(',')[0].trim();

  const params = new URLSearchParams({
    track_name: cleanTitle,
    artist_name: cleanArtist,
  });
  if (durationSec && durationSec > 0) {
    params.set('duration', Math.round(durationSec).toString());
  }

  try {
    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        'User-Agent': 'LastWave-Web/1.0.0 (https://github.com/Clash-Projects/LastWave-native)',
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      let parsedLines: LyricLine[] = [];

      if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
        parsedLines = data.lines;
      } else if (data.syncedLyrics) {
        parsedLines = parseLrc(data.syncedLyrics);
      }

      return {
        id: data.id,
        trackName: data.trackName || trackName,
        artistName: data.artistName || artistName,
        albumName: data.albumName,
        duration: data.duration,
        instrumental: data.instrumental || false,
        plainLyrics: data.plainLyrics,
        syncedLyrics: data.syncedLyrics,
        lines: parsedLines,
      };
    }

    // Fallback: search if exact get fails
    const searchParams = new URLSearchParams({
      q: `${cleanArtist} ${cleanTitle}`,
    });
    const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, {
      headers: {
        'User-Agent': 'LastWave-Web/1.0.0 (https://github.com/Clash-Projects/LastWave-native)',
      },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (Array.isArray(searchData) && searchData.length > 0) {
        const top = searchData[0];
        let parsedLines: LyricLine[] = [];
        if (top.lines && Array.isArray(top.lines) && top.lines.length > 0) {
          parsedLines = top.lines;
        } else if (top.syncedLyrics) {
          parsedLines = parseLrc(top.syncedLyrics);
        }

        return {
          id: top.id,
          trackName: top.trackName || trackName,
          artistName: top.artistName || artistName,
          albumName: top.albumName,
          duration: top.duration,
          instrumental: top.instrumental || false,
          plainLyrics: top.plainLyrics,
          syncedLyrics: top.syncedLyrics,
          lines: parsedLines,
        };
      }
    }
  } catch (e) {
    console.error('Error fetching lyrics from LRCLIB:', e);
  }

  return {
    instrumental: false,
    lines: [],
  };
}
