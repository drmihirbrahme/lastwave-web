import { get, set, del, keys } from 'idb-keyval';
import { Track, Playlist, LastFmConfig } from './types';

const LIKED_KEY = 'lastwave_liked_tracks';
const PLAYLISTS_KEY = 'lastwave_custom_playlists';
const HISTORY_KEY = 'lastwave_history_tracks';
const LASTFM_CONFIG_KEY = 'lastwave_lastfm_config';
const SETTINGS_KEY = 'lastwave_app_settings';

export interface AppSettings {
  audioQuality: 'low' | 'medium' | 'high';
  theme: 'dark' | 'amoled' | 'dynamic';
  autoScrobble: boolean;
  enableDynamicColor: boolean;
  cacheStreamForOffline: boolean;
  karaokeSize: 'sm' | 'md' | 'lg';
}

const DEFAULT_SETTINGS: AppSettings = {
  audioQuality: 'high',
  theme: 'dynamic',
  autoScrobble: true,
  enableDynamicColor: true,
  cacheStreamForOffline: true,
  karaokeSize: 'md',
};

export async function getLikedTracks(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  const tracks = await get<Track[]>(LIKED_KEY);
  return tracks || [];
}

export async function toggleLikeTrack(track: Track): Promise<boolean> {
  const current = await getLikedTracks();
  const exists = current.some((t) => t.id === track.id);
  let updated: Track[];

  if (exists) {
    updated = current.filter((t) => t.id !== track.id);
  } else {
    updated = [{ ...track, isLiked: true, addedAt: Date.now() }, ...current];
  }

  await set(LIKED_KEY, updated);
  return !exists;
}

export async function isTrackLiked(trackId: string): Promise<boolean> {
  const current = await getLikedTracks();
  return current.some((t) => t.id === trackId);
}

export async function getHistoryTracks(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  const tracks = await get<Track[]>(HISTORY_KEY);
  return tracks || [];
}

export async function addToHistory(track: Track): Promise<void> {
  if (typeof window === 'undefined') return;
  const current = await getHistoryTracks();
  const filtered = current.filter((t) => t.id !== track.id);
  const updated = [{ ...track, addedAt: Date.now() }, ...filtered].slice(0, 100);
  await set(HISTORY_KEY, updated);
}

export async function clearHistory(): Promise<void> {
  await set(HISTORY_KEY, []);
}

export async function getPlaylists(): Promise<Playlist[]> {
  if (typeof window === 'undefined') return [];
  const playlists = await get<Playlist[]>(PLAYLISTS_KEY);
  return playlists || [];
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const current = await getPlaylists();
  const index = current.findIndex((p) => p.id === playlist.id);
  if (index >= 0) {
    current[index] = playlist;
  } else {
    current.unshift(playlist);
  }
  await set(PLAYLISTS_KEY, current);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const current = await getPlaylists();
  const updated = current.filter((p) => p.id !== playlistId);
  await set(PLAYLISTS_KEY, updated);
}

export async function getLastFmConfig(): Promise<LastFmConfig> {
  if (typeof window === 'undefined') {
    return { scrobbleEnabled: true, nowPlayingEnabled: true };
  }
  const config = await get<LastFmConfig>(LASTFM_CONFIG_KEY);
  return config || { scrobbleEnabled: true, nowPlayingEnabled: true };
}

export async function saveLastFmConfig(config: LastFmConfig): Promise<void> {
  await set(LASTFM_CONFIG_KEY, config);
}

export async function getAppSettings(): Promise<AppSettings> {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const settings = await get<AppSettings>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated = { ...current, ...settings };
  await set(SETTINGS_KEY, updated);
  return updated;
}

// Offline Audio Blob Caching in IndexedDB
export async function cacheTrackAudio(trackId: string, blob: Blob): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(`cached_audio_${trackId}`, blob);
}

export async function getCachedTrackAudio(trackId: string): Promise<Blob | undefined> {
  if (typeof window === 'undefined') return undefined;
  return await get<Blob>(`cached_audio_${trackId}`);
}

export async function removeCachedTrackAudio(trackId: string): Promise<void> {
  await del(`cached_audio_${trackId}`);
}

export async function getCachedTrackIds(): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  const allKeys = await keys();
  return allKeys
    .filter((k) => typeof k === 'string' && k.startsWith('cached_audio_'))
    .map((k) => (k as string).replace('cached_audio_', ''));
}
