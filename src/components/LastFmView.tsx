'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { LastFmConfig, LastFmRecentTrack } from '@/lib/types';
import { getLastFmConfig, saveLastFmConfig } from '@/lib/storage';
import { Radio, User, Users, Flame, ExternalLink, Check, Save } from 'lucide-react';

export function LastFmView() {
  const { accentColor } = usePlayer();
  const [config, setConfig] = useState<LastFmConfig>({
    username: '',
    sessionKey: '',
    apiKey: '',
    apiSecret: '',
    scrobbleEnabled: true,
    nowPlayingEnabled: true,
  });

  const [recentScrobbles, setRecentScrobbles] = useState<LastFmRecentTrack[]>([]);
  const [topArtists, setTopArtists] = useState<{ name: string; playcount: string; image: string }[]>([]);
  const [friends, setFriends] = useState<{ name: string; realname?: string; image: string; url: string }[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getLastFmConfig().then((cfg) => {
      setConfig(cfg);
      if (cfg.username) {
        loadUserFeed(cfg.username, cfg.apiKey);
      }
    });
  }, []);

  const loadUserFeed = async (username: string, apiKey?: string) => {
    if (!username) return;
    setIsLoadingFeed(true);
    try {
      const q = new URLSearchParams({ action: 'recent', user: username });
      if (apiKey) q.set('apiKey', apiKey);
      const res = await fetch(`/api/lastfm?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecentScrobbles(data.tracks || []);
      }

      const topQ = new URLSearchParams({ action: 'topartists', user: username });
      if (apiKey) topQ.set('apiKey', apiKey);
      const topRes = await fetch(`/api/lastfm?${topQ.toString()}`);
      if (topRes.ok) {
        const topData = await topRes.json();
        setTopArtists(topData.artists || []);
      }

      const friendsQ = new URLSearchParams({ action: 'friends', user: username });
      if (apiKey) friendsQ.set('apiKey', apiKey);
      const friendsRes = await fetch(`/api/lastfm?${friendsQ.toString()}`);
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData.friends || []);
      }
    } catch (e) {
      console.error('Error fetching Last.fm feed:', e);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleSaveConfig = async () => {
    await saveLastFmConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    if (config.username) {
      loadUserFeed(config.username, config.apiKey);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Last.fm Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950 border border-red-500/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-lastfm/20 text-[11px] font-bold text-red-400 uppercase tracking-wider">
              <Radio className="w-3 h-3 text-red-400" />
              Last.fm Scrobbler
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {config.username ? `u/${config.username}` : 'Connect Last.fm'}
            </h1>
            <p className="text-xs text-zinc-400">
              Track listening history, sync real-time &apos;Now Playing&apos; status, and discover top music charts.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-lastfm flex items-center justify-center font-black text-white text-lg shadow-lg">
            fm
          </div>
        </div>
      </div>

      {/* Configuration Box */}
      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-brand-accent" />
          Scrobbler Credentials (BYOK Model)
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          LastWave uses a Bring-Your-Own-Key model. Enter your Last.fm username to view profile stats, or provide an API Session Key to enable live background scrobbling.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Last.fm Username</label>
            <input
              type="text"
              value={config.username || ''}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="e.g. musiclover99"
              className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-lastfm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400">API Key (Optional)</label>
              <input
                type="text"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Last.fm API Key"
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-lastfm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Session Key (Optional)</label>
              <input
                type="password"
                value={config.sessionKey || ''}
                onChange={(e) => setConfig({ ...config, sessionKey: e.target.value })}
                placeholder="Last.fm Session Key"
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-lastfm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.scrobbleEnabled}
                onChange={(e) => setConfig({ ...config, scrobbleEnabled: e.target.checked })}
                className="rounded bg-zinc-900 border-zinc-700 text-brand-lastfm focus:ring-0"
              />
              <span>Enable In-App Scrobbling</span>
            </label>

            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-2xl bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'Saved' : 'Save Config'}
            </button>
          </div>
        </div>
      </div>

      {/* Top Artists Radar */}
      {topArtists.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-orange" />
            Your Top Artists
          </h3>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            {topArtists.map((artist, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-28 p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-center space-y-2"
              >
                <img
                  src={artist.image || '/default-avatar.png'}
                  alt=""
                  className="w-14 h-14 rounded-full mx-auto object-cover bg-zinc-800 shadow"
                />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 truncate">{artist.name}</h4>
                  <p className="text-[10px] text-zinc-500">{artist.playcount} scrobbles</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scrobbles Feed */}
      {recentScrobbles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            Recent Last.fm Scrobbles
          </h3>
          <div className="space-y-1.5">
            {recentScrobbles.map((track, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/40 border border-white/5 text-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <img src={track.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-zinc-800 flex-shrink-0" />
                  <div className="truncate">
                    <h4 className="font-semibold text-zinc-200 truncate">{track.name}</h4>
                    <p className="text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>
                {track.nowPlaying ? (
                  <span className="text-[10px] text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 animate-pulse">
                    Scrobbling
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">{track.date || 'Recent'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Feed */}
      {friends.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-accent" />
            Friends on Last.fm ({friends.length})
          </h3>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            {friends.map((friend, idx) => (
              <a
                key={idx}
                href={friend.url}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 w-24 p-2.5 rounded-2xl bg-zinc-900/40 border border-white/5 text-center space-y-1.5 hover:bg-zinc-800 transition"
              >
                <img src={friend.image} alt="" className="w-12 h-12 rounded-full mx-auto object-cover bg-zinc-800" />
                <p className="text-xs font-semibold text-zinc-200 truncate">{friend.realname || friend.name}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
