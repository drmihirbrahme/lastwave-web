'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { LyricLine } from '@/lib/types';
import { Mic2, Music2 } from 'lucide-react';

export function LyricsView() {
  const { lyrics, isLoadingLyrics, currentTime, seek, currentTrack, accentColor } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const currentMs = currentTime * 1000;
  const lines: LyricLine[] = lyrics?.lines || [];

  // Find active line index
  let activeIndex = -1;
  if (lines.length > 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      if (currentMs >= line.start_ms && (!nextLine || currentMs < nextLine.start_ms)) {
        activeIndex = i;
        break;
      }
    }
  }

  // Smooth scroll to keep active lyric centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (isLoadingLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-16 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: accentColor }} />
        <p className="text-sm font-medium">Fetching synchronized lyrics...</p>
      </div>
    );
  }

  if (lyrics?.instrumental) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-20 space-y-3">
        <Music2 className="w-12 h-12 text-zinc-500 animate-pulse" />
        <p className="text-lg font-semibold text-zinc-200">Instrumental Track</p>
        <p className="text-xs text-zinc-400">Sit back and enjoy the melody</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-20 space-y-3">
        <Mic2 className="w-10 h-10 text-zinc-600" />
        <p className="text-base font-medium text-zinc-300">No synchronized lyrics found</p>
        {lyrics?.plainLyrics && (
          <div className="max-w-md px-6 text-sm text-zinc-400 whitespace-pre-line text-center leading-relaxed mt-4">
            {lyrics.plainLyrics}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col space-y-6 px-4 py-8 overflow-y-auto max-h-[55vh] scroll-smooth no-scrollbar"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
        LRCLIB Synced Lyrics
      </div>
      {lines.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;

        return (
          <p
            key={idx}
            ref={isActive ? activeLineRef : null}
            onClick={() => seek(line.start_ms / 1000)}
            style={{
              color: isActive ? '#ffffff' : isPast ? '#71717a' : '#52525b',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              textShadow: isActive ? `0 0 20px ${accentColor}88` : 'none',
            }}
            className={`cursor-pointer transition-all duration-300 font-bold text-left select-none text-xl sm:text-2xl md:text-3xl leading-snug hover:text-white ${
              isActive ? 'font-extrabold opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
          >
            {line.text || '♪'}
          </p>
        );
      })}
    </div>
  );
}
