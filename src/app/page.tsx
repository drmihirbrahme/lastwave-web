'use client';

import React, { useState } from 'react';
import { TabBar, TabType } from '@/components/TabBar';
import { PlayerBar } from '@/components/PlayerBar';
import { NowPlayingSheet } from '@/components/NowPlayingSheet';
import { ExploreView } from '@/components/ExploreView';
import { SearchView } from '@/components/SearchView';
import { SmartMixGenerator } from '@/components/SmartMixGenerator';
import { LibraryView } from '@/components/LibraryView';
import { LastFmView } from '@/components/LastFmView';
import { SettingsModal } from '@/components/SettingsModal';
import { Settings, Sparkles } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabType>('explore');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { accentColor } = usePlayer();

  return (
    <main
      className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
      }}
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 bg-zinc-950/75 backdrop-blur-ios border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-zinc-950 text-xs shadow-md transition-colors"
            style={{ backgroundColor: accentColor || '#C6F100' }}
          >
            LW
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              LastWave
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-brand-accent uppercase tracking-wider">
                Web
              </span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition active:scale-95"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Tab Content View */}
      <div className="flex-1 px-4 pt-4 max-w-xl mx-auto w-full">
        {currentTab === 'explore' && <ExploreView />}
        {currentTab === 'search' && <SearchView />}
        {currentTab === 'generator' && <SmartMixGenerator />}
        {currentTab === 'library' && <LibraryView />}
        {currentTab === 'lastfm' && <LastFmView />}
      </div>

      {/* Floating Mini Player Bar */}
      <PlayerBar />

      {/* Fullscreen Now Playing Modal Sheet */}
      <NowPlayingSheet />

      {/* Bottom Tab Bar */}
      <TabBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
