'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/lib/types';
import { Search, X, Music, Radio, History, ArrowUpRight } from 'lucide-react';

export function SearchView() {
  const { playTrack, currentTrack, startRadio, accentColor } = usePlayer();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<'songs' | 'albums' | 'artists' | 'all'>('songs');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch suggestions when typing
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (e) {
        console.error('Failed to get suggestions:', e);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm.trim())}&filter=${filter}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.songs || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tracks, artists, or albums..."
            className="w-full pl-12 pr-10 py-3.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition shadow-inner text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setResults([]);
              }}
              className="absolute right-3 p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(sug);
                  executeSearch(sug);
                }}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white cursor-pointer transition"
              >
                <div className="flex items-center space-x-3 truncate">
                  <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="truncate">{sug}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      {results.length === 0 && !isSearching && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <History className="w-3.5 h-3.5" />
            <span>Popular Searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Daft Punk',
              'The Weeknd',
              'Billie Eilish',
              'Taylor Swift',
              'Kendrick Lamar',
              'Synthwave Radio',
              'Lofi Beats',
              'Phonk',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setQuery(chip);
                  executeSearch(chip);
                }}
                className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 hover:bg-white/10 border border-white/5 text-xs font-semibold text-zinc-300 hover:text-white transition active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {isSearching && (
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-zinc-900/40 animate-pulse" />
          ))}
        </div>
      )}

      {results.length > 0 && !isSearching && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 pb-1">
            {results.length} Tracks Found
          </div>
          <div className="space-y-1.5">
            {results.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, results, idx)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition active:scale-[0.98] ${
                    isCurrent
                      ? 'bg-white/15 border border-white/15'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img
                      src={track.coverUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-zinc-800"
                    />
                    <div className="truncate">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-brand-accent' : 'text-zinc-100'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {track.artist} {track.durationFormatted ? `• ${track.durationFormatted}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRadio(track);
                    }}
                    title="Start Radio"
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
