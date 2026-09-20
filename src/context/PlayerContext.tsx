'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, LyricsData, LastFmConfig } from '@/lib/types';
import {
  addToHistory,
  getLikedTracks,
  toggleLikeTrack,
  isTrackLiked,
  getLastFmConfig,
  getAppSettings,
  getCachedTrackAudio,
  cacheTrackAudio,
} from '@/lib/storage';
import { FastAverageColor } from 'fast-average-color';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  lyrics: LyricsData | null;
  isLoadingLyrics: boolean;
  isLiked: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  volume: number;
  accentColor: string;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[], index?: number) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setVolume: (volume: number) => void;
  toggleLike: () => Promise<void>;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  startRadio: (track: Track) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const fac = new FastAverageColor();

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [accentColor, setAccentColor] = useState<string>('#C6F100');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasScrobbledRef = useRef<boolean>(false);
  const trackStartTimeRef = useRef<number>(0);
  const lastFmConfigRef = useRef<LastFmConfig | null>(null);

  // Initialize Audio instance and Media Session handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audioRef.current = audio;

    // Load Last.fm configuration
    getLastFmConfig().then((cfg) => {
      lastFmConfigRef.current = cfg;
    });

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const cur = audio.currentTime;
      const dur = audio.duration || 0;

      // Scrobble checkpoint: 50% or 4 minutes
      if (
        !hasScrobbledRef.current &&
        dur > 30 &&
        (cur >= dur / 2 || cur >= 240) &&
        currentTrack
      ) {
        hasScrobbledRef.current = true;
        triggerLastFmScrobble(currentTrack, trackStartTimeRef.current);
      }

      // Update Media Session Position state
      if ('mediaSession' in navigator && dur > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audio.playbackRate,
            position: Math.min(cur, dur),
          });
        } catch {
          // ignore position state errors
        }
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        handleAutoNext();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.pause();
      audio.src = '';
    };
  }, [repeatMode, currentTrack]);

  // Extract accent color from cover art
  useEffect(() => {
    if (!currentTrack?.coverUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.coverUrl;
    img.onload = () => {
      try {
        const color = fac.getColor(img);
        if (color && color.hex) {
          setAccentColor(color.hex);
          document.documentElement.style.setProperty('--dynamic-accent', color.hex);
          document.documentElement.style.setProperty('--dynamic-accent-rgb', `${color.value[0]}, ${color.value[1]}, ${color.value[2]}`);
        }
      } catch (e) {
        console.warn('Could not extract color:', e);
      }
    };
  }, [currentTrack?.coverUrl]);

  // Update Media Session Metadata & Actions
  const updateMediaSession = useCallback((track: Track) => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'LastWave',
      artwork: [
        { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(console.error);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
      }
    });
  }, []);

  const triggerLastFmNowPlaying = async (track: Track) => {
    const cfg = lastFmConfigRef.current || (await getLastFmConfig());
    if (!cfg.scrobbleEnabled || !cfg.nowPlayingEnabled) return;
    try {
      await fetch('/api/lastfm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nowplaying',
          config: cfg,
          track: {
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
          },
        }),
      });
    } catch (e) {
      console.warn('Last.fm now playing error:', e);
    }
  };

  const triggerLastFmScrobble = async (track: Track, timestamp: number) => {
    const cfg = lastFmConfigRef.current || (await getLastFmConfig());
    if (!cfg.scrobbleEnabled) return;
    try {
      await fetch('/api/lastfm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrobble',
          config: cfg,
          track: {
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            timestamp,
          },
        }),
      });
    } catch (e) {
      console.warn('Last.fm scrobble error:', e);
    }
  };

  // Load lyrics for the current track
  const loadLyrics = async (track: Track) => {
    setIsLoadingLyrics(true);
    try {
      const res = await fetch(
        `/api/lyrics?track=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(
          track.artist
        )}&duration=${track.duration || 0}`
      );
      if (res.ok) {
        const data = await res.json();
        setLyrics(data);
      } else {
        setLyrics({ instrumental: false, lines: [] });
      }
    } catch (e) {
      console.error('Failed to load lyrics:', e);
      setLyrics({ instrumental: false, lines: [] });
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Main playback function
  const playTrack = async (track: Track, newQueue?: Track[], index?: number) => {
    if (!audioRef.current) return;
    setIsLoading(true);
    hasScrobbledRef.current = false;
    trackStartTimeRef.current = Date.now();

    // Update queue state immediately
    if (newQueue) {
      setQueue(newQueue);
      setQueueIndex(index !== undefined ? index : newQueue.findIndex((t) => t.id === track.id));
    } else if (queue.length === 0) {
      setQueue([track]);
      setQueueIndex(0);
    }

    setCurrentTrack(track);
    updateMediaSession(track);
    addToHistory(track);

    // Synchronously assign streaming proxy audio source & trigger playback to preserve iOS user gesture context
    const streamProxyUrl = `/api/stream/audio?id=${encodeURIComponent(track.id)}`;
    
    try {
      // Check offline cache first if available
      const cachedBlob = await getCachedTrackAudio(track.id);
      if (cachedBlob) {
        audioRef.current.src = URL.createObjectURL(cachedBlob);
      } else {
        audioRef.current.src = streamProxyUrl;
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      setIsPlaying(true);
    } catch (error) {
      console.error('Audio playback start error:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }

    // Load lyrics and Last.fm in the background without blocking audio startup
    loadLyrics(track);
    triggerLastFmNowPlaying(track);
    isTrackLiked(track.id).then(setIsLiked);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || seconds));
    setCurrentTime(audioRef.current.currentTime);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return; // End of queue
      }
    }
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx]);
  };

  const handleAutoNext = () => {
    playNext();
  };

  const playPrevious = () => {
    if (!audioRef.current || queue.length === 0) return;
    // If playing more than 3 seconds, restart current track
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  const setVolume = (val: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, val));
    audioRef.current.volume = clamped;
    setVolumeState(clamped);
  };

  const toggleLike = async () => {
    if (!currentTrack) return;
    const newLikedState = await toggleLikeTrack(currentTrack);
    setIsLiked(newLikedState);
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  };

  // Start Radio creates an algorithmic queue based on the current track
  const startRadio = async (track: Track) => {
    try {
      const res = await fetch(`/api/radio?id=${encodeURIComponent(track.id)}`);
      if (res.ok) {
        const data = await res.json();
        const radioQueue = [track, ...(data.tracks || [])];
        playTrack(track, radioQueue, 0);
      } else {
        playTrack(track, [track], 0);
      }
    } catch {
      playTrack(track, [track], 0);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        queue,
        queueIndex,
        lyrics,
        isLoadingLyrics,
        isLiked,
        repeatMode,
        isShuffle,
        volume,
        accentColor,
        isNowPlayingOpen,
        setIsNowPlayingOpen,
        playTrack,
        togglePlay,
        seek,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeatMode,
        setVolume,
        toggleLike,
        addToQueue,
        removeFromQueue,
        clearQueue,
        startRadio,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
