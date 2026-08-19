import React, { useEffect, useRef } from 'react';
import { Search, Shuffle, UploadCloud, Shield, Zap, Stethoscope } from 'lucide-react';
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
  onOpenAdmin,
  onTrigger404
}: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  /*
   * The console is admin-only on the server — every /api/admin route checks the session —
   * so showing the button to everyone else was an affordance that could never work.
   */
  const isAdmin = currentUser?.role === 'admin';

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
    <header className="sticky top-0 z-30 border-b border-edge/70 bg-void/75 backdrop-blur-2xl">
      {/* A lit filament under the bar ties the chrome to the accent gradient */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-volt/45 to-transparent" />

      <div className="max-w-[1480px] mx-auto px-4 sm:px-7 h-[68px] flex items-center gap-3 sm:gap-6">
        {/* Wordmark */}
        <button
          onClick={() => setSearchQuery('')}
          className="flex items-center gap-3 flex-shrink-0 group"
          title="Back to the full catalogue"
        >
          <span className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-volt via-volt to-beam flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(139,92,246,0.95)] transition-transform duration-200 group-hover:scale-105">
            <span className="absolute inset-px rounded-[15px] bg-gradient-to-br from-white/25 to-transparent" />
            <Zap className="relative w-5 h-5 text-white" fill="currentColor" strokeWidth={2} />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-none">
            <span className="font-display text-[16px] font-bold tracking-tight text-white">
              FLASH<span className="text-gradient">HUB</span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.24em] text-zinc-500 mt-1.5">
              PLAY ANYTHING · INSTALL NOTHING
            </span>
          </span>
        </button>

        {/* Search */}
        <div className="flex-1 max-w-2xl relative group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none transition-colors group-focus-within:text-volt" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search Flash classics, webports, HTML5…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field w-full h-11 pl-11 pr-14 text-sm rounded-2xl"
          />
          <kbd className="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 h-[22px] min-w-[22px] px-1.5 items-center justify-center rounded-lg border border-edge bg-white/5 font-mono text-[10px] text-zinc-500">
            /
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Utility cluster: grouped so the primary action stands alone on the right */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl border border-edge bg-white/[0.025]">
            <button
              onClick={onUploadClick}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-volt/15 transition-colors"
              title="Upload your own SWF or HTML5 game"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
            <button
              onClick={onTrigger404}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-volt/15 transition-colors"
              title="Catalogue diagnostics"
            >
              <Stethoscope className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-volt/15 transition-colors"
                title="Admin & sync console"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn-ghost sm:hidden flex items-center justify-center w-10 h-10 rounded-xl"
              title="Admin & sync console"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenAccount}
            className="btn-ghost flex items-center gap-2.5 h-11 pl-1.5 pr-1.5 lg:pr-3.5 rounded-2xl"
            title={currentUser ? 'Your player profile' : 'Sign in for cloud saves'}
          >
            <span className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
                alt=""
                className="w-8 h-8 rounded-xl object-cover bg-surface"
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
            className="btn-volt flex items-center gap-2 h-11 px-3.5 sm:px-5 rounded-2xl text-xs"
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
