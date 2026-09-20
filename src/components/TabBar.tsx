'use client';

import React from 'react';
import { Compass, Search, Wand2, Library, Radio, Settings } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export type TabType = 'explore' | 'search' | 'generator' | 'library' | 'lastfm';

interface TabBarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  onOpenSettings: () => void;
}

export function TabBar({ currentTab, setCurrentTab, onOpenSettings }: TabBarProps) {
  const { accentColor } = usePlayer();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'explore', label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
    { id: 'generator', label: 'Smart Mix', icon: <Wand2 className="w-5 h-5" /> },
    { id: 'library', label: 'Library', icon: <Library className="w-5 h-5" /> },
    { id: 'lastfm', label: 'Scrobbler', icon: <Radio className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-zinc-950/80 backdrop-blur-ios border-t border-white/10 px-2 select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        paddingTop: '8px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-90 ${
              isActive ? 'font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={{
              color: isActive ? accentColor || '#C6F100' : undefined,
            }}
          >
            <div className="relative">
              {tab.icon}
              {isActive && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accentColor || '#C6F100' }}
                />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
