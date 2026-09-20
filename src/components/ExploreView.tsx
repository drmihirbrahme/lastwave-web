'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/lib/types';
import { Play, Sparkles, Flame, Radio, Disc, ChevronRight } from 'lucide-react';

export function ExploreView() {
  const { playTrack, currentTrack, isPlaying, accentColor, startRadio } = usePlayer();
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await fetch('/api/explore');
        if (res.ok) {
          const data = await res.json();
          setTrending(data.trending || []);
          setNewReleases(data.newReleases || []);
          setQuickPicks(data.quickPicks || []);
        }
      } catch (e) {
        console.error('Failed to load explore feed:', e);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const moodRadios = [
    { title: 'Late Night Drive', subtitle: 'Synthwave & R&B vibes', query: 'The Weeknd Blinding Lights', color: 'from-purple-900 to-indigo-900' },
    { title: 'Workout Energy', subtitle: 'High tempo beats', query: 'Phonk Gym Motivation', color: 'from-red-950 to-orange-950' },
    { title: 'Deep Focus & Flow', subtitle: 'Lo-fi & chillhop', query: 'Lofi hip hop radio beats', color: 'from-emerald-950 to-teal-950' },
    { title: 'Acoustic Chill', subtitle: 'Warm acoustic sessions', query: 'Acoustic guitar chill', color: 'from-amber-950 to-yellow-950' },
  ];

  const handlePlayMood = async (query: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&filter=songs`);
      if (res.ok) {
        const data = await res.json();
        if (data.songs && data.songs.length > 0) {
          startRadio(data.songs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-white/10 shadow-2xl">
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-brand-accent">
            <Sparkles className="w-3.5 h-3.5" />
            LastWave Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover Your Sound
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
            Ad-free YouTube Music streaming, synced karaoke lyrics, and Last.fm taste intelligence.
          </p>
        </div>
      </div>

      {/* Mood Radios Horizontal Scroll */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-accent" />
            Instant Mood Radios
          </h2>
        </div>
        <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4">
          {moodRadios.map((mood, idx) => (
            <div
              key={idx}
              onClick={() => handlePlayMood(mood.query)}
              className={`flex-shrink-0 w-48 p-4 rounded-2xl bg-gradient-to-br ${mood.color} border border-white/10 shadow-lg cursor-pointer transition hover:scale-[1.02] active:scale-95`}
            >
              <h3 className="text-sm font-bold text-white">{mood.title}</h3>
              <p className="text-[11px] text-zinc-400 mt-1">{mood.subtitle}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-brand-accent font-semibold">
                <span>Start Radio</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tracks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-orange" />
            Trending Hits
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trending.slice(0, 8).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, trending, idx)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition active:scale-[0.98] ${
                    isCurrent
                      ? 'bg-white/15 border border-white/15'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="w-3 h-3 rounded-full bg-brand-accent animate-ping" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-brand-accent' : 'text-zinc-100'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRadio(track);
                    }}
                    title="Radio"
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Releases Carousel */}
      {newReleases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-brand-accent" />
              New Releases & Fresh Tracks
            </h2>
          </div>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {newReleases.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track, newReleases, idx)}
                className="flex-shrink-0 w-36 space-y-2 cursor-pointer group"
              >
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-800 shadow-md transition group-hover:scale-105">
                  <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 truncate">{track.title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
