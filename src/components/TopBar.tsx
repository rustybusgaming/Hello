import React, { useEffect, useRef } from 'react';
import { Search, Shuffle, UploadCloud, Shield, Stethoscope } from 'lucide-react';
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
  totalTitles: number;
}

export function TopBar({
  searchQuery,
  setSearchQuery,
  onRandomGame,
  onUploadClick,
  currentUser,
  onOpenAccount,
  onOpenAdmin,
  onTrigger404,
  totalTitles
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
    <header className="sticky top-0 z-30 border-b-2 border-rule bg-paper">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-7 py-3 sm:py-3.5 flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6">
        {/* Wordmark. Flush left, set solid, with the archive's own datum beside it. */}
        <button
          onClick={() => setSearchQuery('')}
          className="order-1 flex items-baseline flex-shrink-0"
          title="Back to the full catalogue"
        >
          <span className="font-display text-[19px] font-extrabold leading-none tracking-[-0.02em]">
            FLASHHUB
          </span>
        </button>

        {/* Search. One hairline box, the shortcut hint set flush right inside it. */}
        <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 flex items-center border border-rule sm:max-w-[420px] sm:ml-auto bg-shade focus-within:outline-2 focus-within:outline-accent">
          <Search className="w-4 h-4 ml-2.5 text-ink/45 flex-shrink-0 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder={`Search ${totalTitles.toLocaleString()} titles`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 border-0 bg-transparent px-2.5 py-2 text-[13px] text-ink placeholder:text-ink/45 outline-none"
          />
          <span className="hidden sm:block font-mono text-[10px] text-ink/45 px-2.5">/</span>
        </div>

        {/* Actions. Outlined squares; only the random-title action carries the accent. */}
        <div className="order-2 ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUploadClick}
            className="btn-ghost hidden sm:flex items-center justify-center w-9 h-9 p-0"
            title="Upload your own SWF or HTML5 game"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
          <button
            onClick={onTrigger404}
            className="btn-ghost hidden sm:flex items-center justify-center w-9 h-9 p-0"
            title="Catalogue diagnostics"
          >
            <Stethoscope className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn-ghost flex items-center justify-center w-9 h-9 p-0"
              title="Admin & sync console"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenAccount}
            className="btn-ghost flex items-center gap-2 h-9 pl-1 pr-1 lg:pr-3"
            title={currentUser ? 'Your player profile' : 'Sign in for cloud saves'}
          >
            <span className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
                alt=""
                className="w-7 h-7 object-cover bg-shade duotone"
              />
              {currentUser?.steamId && (
                <span className="absolute -bottom-px -right-px w-2 h-2 bg-accent" />
              )}
            </span>
            <span className="hidden lg:block max-w-[92px] truncate font-display text-[12px] font-semibold">
              {currentUser?.username || 'Sign in'}
            </span>
          </button>

          <button
            onClick={onRandomGame}
            className="btn-primary flex items-center gap-2 h-9 px-3.5 text-[12px]"
            title="Play something at random"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Random title</span>
          </button>
        </div>
      </div>
    </header>
  );
}
