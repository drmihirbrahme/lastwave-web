'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, LyricsData, LastFmConfig } from '@/lib/types';
import {
  addToHistory,
  getLikedTracks,
  toggleLikeTrack,
  isTrackLiked,
  getLastFmConfig,
} from '@/lib/storage';
import { FastAverageColor } from 'fast-average-color';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

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

  const ytPlayerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const pendingTrackIdRef = useRef<string | null>(null);
  const hasScrobbledRef = useRef<boolean>(false);
  const trackStartTimeRef = useRef<number>(0);
  const lastFmConfigRef = useRef<LastFmConfig | null>(null);

  // Initialize YouTube IFrame Player (Device-side routing)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Last.fm configuration
    getLastFmConfig().then((cfg) => {
      lastFmConfigRef.current = cfg;
    });

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('yt-device-player', {
          height: '200',
          width: '200',
          videoId: '',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              isPlayerReadyRef.current = true;
              if (pendingTrackIdRef.current) {
                ytPlayerRef.current.loadVideoById({
                  videoId: pendingTrackIdRef.current,
                  startSeconds: 0,
                });
                ytPlayerRef.current.playVideo();
                pendingTrackIdRef.current = null;
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                setIsLoading(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 3) {
                setIsLoading(true);
              } else if (event.data === 0) {
                handleTrackEnded();
              }
            },
            onError: (err: any) => {
              console.warn('Device YouTube player event error:', err);
              setIsLoading(false);
              setIsPlaying(false);
            },
          },
        });
      } catch (err) {
        console.error('Error initializing YT Player:', err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYT;
    } else if (window.YT.loaded) {
      initYT();
    } else {
      window.onYouTubeIframeAPIReady = initYT;
    }
  }, []);

  // Time & Position tracking loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (!ytPlayerRef.current || !isPlayerReadyRef.current) return;
      try {
        if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const cur = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0 && dur !== duration) {
            setDuration(dur);
          }

          // Last.fm Scrobble checkpoint (50% or 4 minutes)
          if (
            !hasScrobbledRef.current &&
            dur > 30 &&
            (cur >= dur / 2 || cur >= 240) &&
            currentTrack
          ) {
            hasScrobbledRef.current = true;
            triggerLastFmScrobble(currentTrack, trackStartTimeRef.current);
          }

          // Media Session Position state update
          if ('mediaSession' in navigator && dur > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: 1.0,
                position: Math.min(cur, dur),
              });
            } catch {
              // ignore MediaSession error
            }
          }
        }
      } catch {
        // ignore polling error
      }
    }, 250);

    return () => clearInterval(timer);
  }, [currentTrack, duration]);

  // Extract dynamic accent color from album artwork
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
          document.documentElement.style.setProperty(
            '--dynamic-accent-rgb',
            `${color.value[0]}, ${color.value[1]}, ${color.value[2]}`
          );
        }
      } catch (e) {
        console.warn('Could not extract color:', e);
      }
    };
  }, [currentTrack?.coverUrl]);

  // Update Media Session Metadata & Handlers
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
      if (ytPlayerRef.current?.playVideo) {
        ytPlayerRef.current.playVideo();
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(details.seekTime, true);
        setCurrentTime(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (ytPlayerRef.current?.getCurrentTime) {
        const cur = ytPlayerRef.current.getCurrentTime();
        seek(Math.max(0, cur - 10));
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (ytPlayerRef.current?.getCurrentTime) {
        const cur = ytPlayerRef.current.getCurrentTime();
        seek(cur + 10);
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

  // Main playback function using Device YouTube IFrame
  const playTrack = async (track: Track, newQueue?: Track[], index?: number) => {
    setIsLoading(true);
    hasScrobbledRef.current = false;
    trackStartTimeRef.current = Date.now();
    setCurrentTime(0);
    setDuration(track.duration || 0);

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

    // Route request directly from device via YouTube IFrame API
    try {
      if (ytPlayerRef.current && isPlayerReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById({
          videoId: track.id,
          startSeconds: 0,
        });
        ytPlayerRef.current.playVideo();
      } else {
        pendingTrackIdRef.current = track.id;
      }
      setIsPlaying(true);
    } catch (err) {
      console.error('Device YouTube playback error:', err);
    } finally {
      setIsLoading(false);
    }

    // Load lyrics and Last.fm in the background
    loadLyrics(track);
    triggerLastFmNowPlaying(track);
    isTrackLiked(track.id).then(setIsLiked);
  };

  const handleTrackEnded = () => {
    if (repeatMode === 'one' && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0, true);
      ytPlayerRef.current.playVideo();
    } else {
      playNext();
    }
  };

  const togglePlay = () => {
    if (!ytPlayerRef.current || !currentTrack) return;
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo?.();
      setIsPlaying(false);
    } else {
      ytPlayerRef.current.playVideo?.();
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    if (!ytPlayerRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, duration || seconds));
    if (typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(clamped, true);
    }
    setCurrentTime(clamped);
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

  const playPrevious = () => {
    if (queue.length === 0) return;
    // If playing more than 3 seconds, restart current track
    if (currentTime > 3 && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0, true);
      setCurrentTime(0);
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
    const clamped = Math.max(0, Math.min(1, val));
    if (ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(Math.round(clamped * 100));
    }
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
      {/* Device-side YouTube audio player iframe (onscreen active layer for iOS WebKit) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: 200,
          height: 200,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div id="yt-device-player" />
      </div>
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
