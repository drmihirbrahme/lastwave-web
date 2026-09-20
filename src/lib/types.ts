export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number; // in seconds
  durationFormatted?: string;
  coverUrl: string;
  streamUrl?: string;
  audioQuality?: string;
  bitrate?: number;
  addedAt?: number;
  isLiked?: boolean;
  isCached?: boolean;
}

export interface LyricLine {
  text: string;
  start_ms: number;
  end_ms?: number;
}

export interface LyricsData {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
  lines: LyricLine[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  itemCount?: number;
  tracks: Track[];
  createdAt: number;
  isSmart?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  thumbnailUrl?: string;
  subscribers?: string;
  description?: string;
  topTracks?: Track[];
  albums?: Album[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  year?: string;
  coverUrl: string;
  tracks?: Track[];
}

export interface LastFmConfig {
  username?: string;
  sessionKey?: string;
  apiKey?: string;
  apiSecret?: string;
  scrobbleEnabled: boolean;
  nowPlayingEnabled: boolean;
}

export interface LastFmRecentTrack {
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  date?: string;
  nowPlaying?: boolean;
}

export interface TasteSeed {
  artists: string[];
  genres: string[];
  mood: 'energetic' | 'chill' | 'focus' | 'melancholic' | 'party' | 'workout' | 'discovery';
  tempo?: 'slow' | 'medium' | 'fast';
}
