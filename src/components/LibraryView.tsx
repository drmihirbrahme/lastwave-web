'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Track, Playlist } from '@/lib/types';
import {
  getLikedTracks,
  getPlaylists,
  getHistoryTracks,
  getCachedTrackIds,
  getCachedTrackAudio,
  deletePlaylist,
  clearHistory,
} from '@/lib/storage';
import {
  Heart,
  ListMusic,
  Download,
  History,
  Play,
  Trash2,
  Share2,
  Sparkles,
  Link2,
} from 'lucide-react';

export function LibraryView() {
  const { playTrack, currentTrack, accentColor } = usePlayer();
  const [subTab, setSubTab] = useState<'liked' | 'playlists' | 'offline' | 'import' | 'history'>('liked');
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  
  // Importer state
  const [importUrl, setImportUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedTracks, setImportedTracks] = useState<Track[]>([]);

  const loadData = async () => {
    const liked = await getLikedTracks();
    setLikedTracks(liked);
    const plist = await getPlaylists();
    setPlaylists(plist);
    const hist = await getHistoryTracks();
    setHistoryTracks(hist);

    const cachedIds = await getCachedTrackIds();
    // Filter liked or history that match cached IDs
    const allKnown = [...liked, ...hist];
    const cached = allKnown.filter((t) => cachedIds.includes(t.id));
    // Deduplicate
    const uniqueCached = Array.from(new Map(cached.map((t) => [t.id, t])).values());
    setOfflineTracks(uniqueCached);
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  const handleImport = async () => {
    if (!importUrl && !importText) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, rawText: importText }),
      });
      if (res.ok) {
        const data = await res.json();
        setImportedTracks(data.tracks || []);
      }
    } catch (e) {
      console.error('Import failed:', e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistoryTracks([]);
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header & Subtabs */}
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-white tracking-tight">Your Library</h1>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'liked', label: 'Liked Tracks', icon: <Heart className="w-3.5 h-3.5" />, count: likedTracks.length },
            { id: 'playlists', label: 'Playlists', icon: <ListMusic className="w-3.5 h-3.5" />, count: playlists.length },
            { id: 'offline', label: 'Offline Caches', icon: <Download className="w-3.5 h-3.5" />, count: offlineTracks.length },
            { id: 'import', label: 'Import Playlist', icon: <Link2 className="w-3.5 h-3.5" /> },
            { id: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isSel = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 border ${
                  isSel
                    ? 'bg-white text-zinc-950 border-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:bg-white/10'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-zinc-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liked Tracks Tab */}
      {subTab === 'liked' && (
        <div className="space-y-3">
          {likedTracks.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <Heart className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No liked tracks yet</p>
              <p className="text-xs text-zinc-600">Tap the heart on any song to save it here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => playTrack(likedTracks[0], likedTracks, 0)}
                className="w-full py-2.5 mb-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-bold text-brand-accent flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play All Liked Songs ({likedTracks.length})
              </button>
              {likedTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, likedTracks, idx)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img src={track.coverUrl} alt="" className="w-11 h-11 rounded-xl object-cover bg-zinc-800 flex-shrink-0" />
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{track.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Playlists Tab */}
      {subTab === 'playlists' && (
        <div className="space-y-3">
          {playlists.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <ListMusic className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No saved playlists</p>
              <p className="text-xs text-zinc-600">Generate a Smart Mix or import a Spotify playlist</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={pl.coverUrl || '/default-album.png'}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover bg-zinc-800 shadow-md"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">{pl.title}</h3>
                        <p className="text-xs text-zinc-400">{pl.tracks.length} tracks</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => playTrack(pl.tracks[0], pl.tracks, 0)}
                        className="p-2 rounded-full bg-brand-accent text-zinc-950 font-bold active:scale-95 transition"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlaylist(pl.id)}
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline Tab */}
      {subTab === 'offline' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-white/5 text-xs text-zinc-400">
            💡 Songs you play are automatically cached into IndexedDB for instant, offline, zero-data playback.
          </div>
          {offlineTracks.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Download className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs">No cached offline tracks yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {offlineTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, offlineTracks, idx)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-zinc-800" />
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-zinc-200 truncate">{track.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                    Offline
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import Tab */}
      {subTab === 'import' && (
        <div className="space-y-4 p-4 rounded-3xl bg-zinc-900/60 border border-white/10">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-accent" />
              Cross-Platform Playlist Importer
            </h3>
            <p className="text-xs text-zinc-400">
              Paste a public Spotify or Apple Music playlist link, or paste raw song names to match on YouTube Music.
            </p>
          </div>

          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-2xl text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />

          <div className="text-center text-xs text-zinc-500 font-semibold">— OR PASTE TRACKLIST —</div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Track 1 - Artist\nTrack 2 - Artist\nTrack 3...`}
            rows={4}
            className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-2xl text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />

          <button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full py-3 rounded-2xl bg-brand-accent text-zinc-950 text-xs font-bold shadow-lg transition active:scale-95"
          >
            {isImporting ? 'Matching Tracks on YouTube Music...' : 'Import & Match Tracks'}
          </button>

          {importedTracks.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Matched {importedTracks.length} Tracks</span>
                <button
                  onClick={() => playTrack(importedTracks[0], importedTracks, 0)}
                  className="px-3 py-1 rounded-full bg-white text-zinc-950 text-xs font-bold"
                >
                  Play All
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {importedTracks.map((t, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-zinc-300 truncate py-1">
                    <span>{idx + 1}.</span>
                    <span className="font-semibold text-white">{t.title}</span>
                    <span className="text-zinc-500">- {t.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {subTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-500">Recently Played</span>
            {historyTracks.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-zinc-400 hover:text-red-400 transition"
              >
                Clear History
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {historyTracks.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track, historyTracks, idx)}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 cursor-pointer transition"
              >
                <div className="flex items-center space-x-3 truncate">
                  <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-zinc-800" />
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-zinc-200 truncate">{track.title}</h4>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
