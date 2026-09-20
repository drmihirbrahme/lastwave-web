'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, getAppSettings, saveAppSettings } from '@/lib/storage';
import { X, Volume2, Palette, Database, Shield, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>({
    audioQuality: 'high',
    theme: 'dynamic',
    autoScrobble: true,
    enableDynamicColor: true,
    cacheStreamForOffline: true,
    karaokeSize: 'md',
  });

  useEffect(() => {
    getAppSettings().then(setSettings);
  }, [isOpen]);

  if (!isOpen) return null;

  const update = async (partial: Partial<AppSettings>) => {
    const updated = await saveAppSettings(partial);
    setSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl space-y-6 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-accent" />
            LastWave Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4 text-xs">
          {/* Audio Quality */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
            <label className="font-bold flex items-center gap-1.5 text-zinc-300">
              <Volume2 className="w-4 h-4 text-brand-accent" />
              Streaming Audio Quality
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => update({ audioQuality: q })}
                  className={`py-2 rounded-xl font-bold uppercase tracking-wider transition ${
                    settings.audioQuality === q
                      ? 'bg-brand-accent text-zinc-950 shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {q === 'high' ? 'Opus 160k' : q === 'medium' ? 'AAC 128k' : '64k Eco'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Colors */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                Dynamic Album Color Glow
              </span>
              <p className="text-[11px] text-zinc-500">
                Extract ambient theme tint from playing cover art
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableDynamicColor}
              onChange={(e) => update({ enableDynamicColor: e.target.checked })}
              className="rounded bg-zinc-900 border-zinc-700 text-brand-accent focus:ring-0 w-4 h-4"
            />
          </div>

          {/* Offline Caching */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Automatic Offline Caching
              </span>
              <p className="text-[11px] text-zinc-500">
                Cache played songs in IndexedDB for offline zero-data playback
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.cacheStreamForOffline}
              onChange={(e) => update({ cacheStreamForOffline: e.target.checked })}
              className="rounded bg-zinc-900 border-zinc-700 text-brand-accent focus:ring-0 w-4 h-4"
            />
          </div>

          {/* About / Attribution */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 text-[11px] text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-400">LastWave Web / iOS PWA</p>
            <p>Port of the open-source LastWave-native Android client.</p>
            <p className="text-[10px] text-zinc-600">Built with Next.js, Tailwind CSS, YouTube.js & LRCLIB.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white text-zinc-950 text-xs font-bold shadow active:scale-95 transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
