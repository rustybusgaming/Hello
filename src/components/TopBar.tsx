import React, { useEffect, useRef } from 'react';
import { Search, Shuffle, UploadCloud, Shield, Zap } from 'lucide-react';
import { UserAccount } from '../types';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRandomGame: () => void;
  onUploadClick: () => void;
  currentUser: UserAccount | null;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onTrigger404: () => void;
}

export function TopBar({
  searchQuery,
  setSearchQuery,
  onRandomGame,
  onUploadClick,
  currentUser,
  onOpenAccount,
  onOpenAdmin
}: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search the way every arcade/library site does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(input|textarea|select)$/i.test(target.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-edge/80 bg-void/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-5">
        {/* Wordmark */}
        <button
          onClick={() => setSearchQuery('')}
          className="flex items-center gap-2.5 flex-shrink-0 group"
          title="Back to the full catalogue"
        >
          <span className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-flame to-ember flex items-center justify-center shadow-[0_8px_24px_-10px_rgba(255,138,0,0.9)]">
            <Zap className="w-4.5 h-4.5 text-black" fill="currentColor" strokeWidth={2.5} />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-none">
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              FLASH<span className="text-flame">HUB</span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 mt-1">
              ARCADE // NO INSTALL
            </span>
          </span>
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search Flash classics, webports, HTML5…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field w-full h-10 pl-10 pr-12 text-sm"
          />
          <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1.5 items-center justify-center rounded-md border border-edge bg-white/5 font-mono text-[10px] text-zinc-500">
            /
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUploadClick}
            className="btn-ghost hidden sm:flex items-center justify-center w-10 h-10 rounded-xl"
            title="Upload your own SWF or HTML5 game"
          >
            <UploadCloud className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="btn-ghost flex items-center justify-center w-10 h-10 rounded-xl"
            title="Admin & sync console"
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAccount}
            className="btn-ghost flex items-center gap-2 h-10 pl-1.5 pr-1.5 lg:pr-3 rounded-xl"
            title={currentUser ? 'Your player profile' : 'Sign in for cloud saves'}
          >
            <span className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
                alt=""
                className="w-7 h-7 rounded-lg object-cover bg-surface"
              />
              {currentUser?.steamId && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ice ring-2 ring-void" />
              )}
            </span>
            <span className="hidden lg:block max-w-[92px] truncate text-xs font-semibold text-white">
              {currentUser?.username || 'Sign in'}
            </span>
          </button>

          <button
            onClick={onRandomGame}
            className="btn-flame flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl text-xs"
            title="Play something at random"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Surprise me</span>
          </button>
        </div>
      </div>
    </header>
  );
}
