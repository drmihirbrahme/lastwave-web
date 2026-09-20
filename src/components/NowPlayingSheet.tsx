'use client';

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { LyricsView } from './LyricsView';
import {
  ChevronDown,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Radio,
  ListMusic,
  Mic2,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
} from 'lucide-react';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function NowPlayingSheet() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
    isLiked,
    toggleLike,
    volume,
    setVolume,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    accentColor,
    queue,
    queueIndex,
    playTrack,
    removeFromQueue,
    clearQueue,
    startRadio,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'art' | 'lyrics' | 'queue'>('art');
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  if (!isNowPlayingOpen || !currentTrack) return null;

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-zinc-950/95 backdrop-blur-2xl text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      }}
    >
      {/* Background Dynamic Ambient Radial Gradient */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[140%] h-[600px] rounded-full opacity-30 blur-[120px] transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Top Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-2">
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white bg-white/5 active:scale-95 transition"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Middle Mode Switcher (Art / Lyrics / Queue) */}
        <div className="flex items-center bg-zinc-900/80 p-1 rounded-full border border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('art')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'art'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Track
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'lyrics'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Queue ({queue.length})
          </button>
        </div>

        {/* Start Smart Radio Button */}
        <button
          onClick={() => startRadio(currentTrack)}
          title="Start Algorithmic Radio"
          className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-brand-accent bg-white/5 active:scale-95 transition"
        >
          <Radio className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area based on active tab */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4 max-w-md mx-auto w-full">
        {activeTab === 'art' && (
          <div className="flex flex-col items-center">
            {/* Album Art Container with Shadow */}
            <div
              className="relative aspect-square w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
              style={{
                boxShadow: `0 20px 50px -10px ${accentColor}40, 0 10px 20px rgba(0,0,0,0.6)`,
              }}
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover select-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && <LyricsView />}

        {activeTab === 'queue' && (
          <div className="flex flex-col h-[52vh] overflow-hidden bg-zinc-900/60 rounded-3xl p-4 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Play Queue ({queue.length} tracks)
              </span>
              <button
                onClick={clearQueue}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 no-scrollbar">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue, idx)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition ${
                      isCurrent
                        ? 'bg-white/15 border border-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="truncate">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-brand-accent' : 'text-zinc-200'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping mr-2" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(idx);
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Track Info, Scrub Slider & Controls */}
      <div className="relative z-10 px-6 max-w-md mx-auto w-full space-y-4">
        {/* Track Title and Like */}
        <div className="flex items-center justify-between">
          <div className="truncate pr-4">
            <h2 className="text-xl font-bold text-zinc-100 truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-medium text-zinc-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
          <button
            onClick={toggleLike}
            className="p-3 -mr-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Progress Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-accent"
            style={{ accentColor: accentColor || '#C6F100' }}
          />
          <div className="flex justify-between text-xs font-medium text-zinc-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-between pt-2">
          {/* Shuffle Toggle */}
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition active:scale-90 ${
              isShuffle ? 'text-brand-accent' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={playPrevious}
            className="p-3 text-zinc-200 hover:text-white active:scale-90 transition"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-950 shadow-2xl transition active:scale-95"
            style={{
              backgroundColor: accentColor || '#C6F100',
              boxShadow: `0 8px 25px ${accentColor}60`,
            }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={playNext}
            className="p-3 text-zinc-200 hover:text-white active:scale-90 transition"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={cycleRepeatMode}
            className={`p-2.5 rounded-full transition active:scale-90 ${
              repeatMode !== 'off'
                ? 'text-brand-accent'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume & Audio Output Bar */}
        <div className="flex items-center space-x-3 pt-2 px-2 text-zinc-400">
          <button onClick={toggleMute} className="hover:text-white transition">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(parseFloat(e.target.value));
            }}
            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
}
