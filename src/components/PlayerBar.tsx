'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipForward, Heart, Music } from 'lucide-react';
import Image from 'next/image';

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    playNext,
    toggleLike,
    isLiked,
    setIsNowPlayingOpen,
    accentColor,
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={() => setIsNowPlayingOpen(true)}
      className="fixed bottom-[74px] left-2.5 right-2.5 z-40 cursor-pointer overflow-hidden rounded-2xl bg-zinc-900/90 backdrop-blur-ios border border-white/10 shadow-2xl transition-all active:scale-[0.99]"
      style={{
        boxShadow: `0 8px 32px -4px ${accentColor}25, 0 4px 12px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Mini Progress Bar on Top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: accentColor || '#C6F100',
          }}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Track Info */}
        <div className="flex items-center space-x-3 overflow-hidden pr-2">
          <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800 shadow-md">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-5 h-5 text-zinc-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-zinc-100 truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggleLike}
            className="p-2 text-zinc-400 hover:text-white transition active:scale-90"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-zinc-400'
              }`}
            />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-950 transition active:scale-95 shadow-md"
            style={{ backgroundColor: accentColor || '#C6F100' }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2 text-zinc-400 hover:text-white transition active:scale-90"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
