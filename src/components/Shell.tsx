import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Shuffle,
  Home,
  LayoutGrid,
  Clock,
  Heart,
  Gamepad2,
  UploadCloud,
  Stethoscope,
  Shield,
  Menu,
  User,
  X
} from 'lucide-react';
import { UserAccount } from '../types';
import { Route, hrefFor, gameHref } from '../lib/router';
import { useLibrary } from '../lib/libraryContext';
import { GameArt } from './GameArt';

interface ShellProps {
  route: Route;
  searchQuery: string;
  onSearch: (q: string) => void;
  onRandom: () => void;
  onUpload: () => void;
  onAdmin: () => void;
  children: React.ReactNode;
}

function isActive(route: Route, target: Route): boolean {
  if (route.name !== target.name) return false;
  if (route.name === 'library' && target.name === 'library') return route.tab === target.tab;
  return true;
}

function NavLink({
  route,
  to,
  icon: Icon,
  label,
  count,
  onNavigate
}: {
  route: Route;
  to: Route;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number | string;
  onNavigate?: () => void;
}) {
  const active = isActive(route, to);
  return (
    <a
      href={hrefFor(to)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex h-[34px] items-center gap-3 px-3 text-[14px] transition-colors duration-150 ${
        active ? 'bg-shade text-ink' : 'text-muted hover:bg-paper hover:text-ink'
      }`}
    >
      <Icon className={`h-4 w-4 flex-none ${active ? 'text-ink' : 'text-faint'}`} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-[12px] tabular-nums text-faint">{count}</span>}
    </a>
  );
}

function Avatar({ user, size = 28 }: { user: UserAccount | null; size?: number }) {
  if (user?.avatarUrl || user?.steamAvatar) {
    return (
      <img
        src={user.avatarUrl || user.steamAvatar}
        alt=""
        width={size}
        height={size}
        className="flex-none bg-shade object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  // A signed-in player without a picture gets their initial; a guest gets a plain person glyph
  return (
    <span
      aria-hidden
      className="flex flex-none items-center justify-center bg-shade text-[12px] font-semibold text-muted"
      style={{ width: size, height: size }}
    >
      {user?.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
    </span>
  );
}

/** Sidebar contents, shared by the desktop rail and the phone's menu sheet. */
function SidebarBody({
  route,
  onUpload,
  onAdmin,
  onNavigate
}: {
  route: Route;
  onUpload: () => void;
  onAdmin: () => void;
  onNavigate?: () => void;
}) {
  const { entries, favourites, recentKeys, byKey, steam, currentUser } = useLibrary();
  const flashhubCount = entries.filter(e => e.launch === 'flashhub').length;
  const steamCount = steam.status === 'ready' ? steam.library.games.length : undefined;
  const recent = recentKeys.map(k => byKey.get(k)).filter(Boolean).slice(0, 5);

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Library" className="flex flex-col gap-0.5 px-3 pt-4">
        <NavLink route={route} to={{ name: 'home' }} icon={Home} label="Home" onNavigate={onNavigate} />
        <NavLink route={route} to={{ name: 'library', tab: 'all' }} icon={LayoutGrid} label="Library" count={entries.length.toLocaleString()} onNavigate={onNavigate} />
      </nav>

      <div className="px-3 pt-6">
        <p className="px-3 pb-2 text-[12px] text-faint">Your games</p>
        <div className="flex flex-col gap-0.5">
          <NavLink route={route} to={{ name: 'library', tab: 'recent' }} icon={Clock} label="Recently played" count={recentKeys.length || undefined} onNavigate={onNavigate} />
          <NavLink route={route} to={{ name: 'library', tab: 'favourites' }} icon={Heart} label="Favourites" count={favourites.length || undefined} onNavigate={onNavigate} />
          <NavLink route={route} to={{ name: 'library', tab: 'flashhub' }} icon={Gamepad2} label="Plays in Flashhub" count={flashhubCount.toLocaleString()} onNavigate={onNavigate} />
          <NavLink
            route={route}
            to={{ name: 'library', tab: 'steam' }}
            icon={SteamGlyph}
            label="Steam library"
            count={steamCount !== undefined ? steamCount.toLocaleString() : currentUser?.steamId ? undefined : 'Link'}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {recent.length > 0 && (
        <div className="px-3 pt-6">
          <p className="px-3 pb-2 text-[12px] text-faint">Jump back in</p>
          <ul className="flex flex-col gap-0.5">
            {recent.map(entry => (
              <li key={entry!.key}>
                <a
                  href={gameHref(entry!.key)}
                  onClick={onNavigate}
                  className="flex h-10 items-center gap-3 px-3 text-[13px] text-muted transition-colors duration-150 hover:bg-paper hover:text-ink"
                >
                  <span className="h-6 w-8 flex-none overflow-hidden bg-shade">
                    <GameArt entry={entry!} />
                  </span>
                  <span className="truncate">{entry!.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-3 pt-6">
        <button type="button" onClick={() => { onNavigate?.(); onUpload(); }} className="flex h-[34px] items-center gap-3 px-3 text-left text-[14px] text-muted transition-colors duration-150 hover:bg-paper hover:text-ink">
          <UploadCloud className="h-4 w-4 text-faint" /> Upload a game
        </button>
        <NavLink route={route} to={{ name: 'diagnostics' }} icon={Stethoscope} label="Diagnostics" onNavigate={onNavigate} />
        {currentUser?.role === 'admin' && (
          <button type="button" onClick={() => { onNavigate?.(); onAdmin(); }} className="flex h-[34px] items-center gap-3 px-3 text-left text-[14px] text-muted transition-colors duration-150 hover:bg-paper hover:text-ink">
            <Shield className="h-4 w-4 text-faint" /> Admin console
          </button>
        )}
        <nav aria-label="About" className="flex gap-4 px-3 pt-4 text-[12px] text-faint">
          <a href="/credits.html" className="hover:text-ink">Credits</a>
          <a href="/terms.html" className="hover:text-ink">Terms</a>
          <a href="/privacy.html" className="hover:text-ink">Privacy</a>
        </nav>
      </div>
    </div>
  );
}

/** Steam's mark is a trademark; a plain outline glyph stands in for it in the nav. */
function SteamGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="16" cy="8" r="3.5" />
      <circle cx="8.5" cy="16.5" r="2.5" />
      <path d="M13.2 10.2 10.4 14.6M3 12.5l3.6 1.6" />
    </svg>
  );
}

export function Shell({ route, searchQuery, onSearch, onRandom, onUpload, onAdmin, children }: ShellProps) {
  const { currentUser, openAccount } = useLibrary();
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState(false);

  // "/" jumps to search, as on every library site; Escape leaves it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(input|textarea|select)$/i.test(target.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setPhoneSearch(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        if (searchQuery) onSearch('');
        else searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchQuery, onSearch]);

  // The menu sheet closes when the route changes
  useEffect(() => setMenuOpen(false), [route]);

  const searchField = (
    <label className="flex h-9 w-full items-center gap-2.5 border border-rule bg-paper px-3 transition-colors duration-150 focus-within:border-transparent focus-within:outline-2 focus-within:outline-accent hover:border-control">
      <Search className="h-4 w-4 flex-none text-faint" aria-hidden />
      <span className="sr-only">Search games</span>
      <input
        ref={searchRef}
        type="search"
        value={searchQuery}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search your library"
        className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
      />
      {searchQuery ? (
        <button type="button" onClick={() => onSearch('')} aria-label="Clear search" className="text-faint hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="hidden h-5 items-center bg-shade px-1.5 text-[11px] font-sans text-faint sm:flex">/</kbd>
      )}
    </label>
  );

  return (
    <div className="min-h-screen bg-ground text-ink">
      {/* Desktop sidebar: the wordmark, the library's destinations, the last games played */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-hair bg-ground lg:flex">
        <a href="#/" className="flex h-16 flex-none items-center border-b border-hair px-6" aria-label="Flashhub home">
          <span className="font-display text-[19px] font-extrabold leading-none tracking-[-0.02em]">FLASHHUB</span>
        </a>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarBody route={route} onUpload={onUpload} onAdmin={onAdmin} />
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        {/* Top bar: search, a random pick, and the account behind its own divider */}
        <header className="sticky top-0 z-20 border-b border-hair bg-ground">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-[29px] lg:h-16 lg:gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="btn-quiet -ml-2 h-11 w-11 lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <a href="#/" className="font-display text-[17px] font-extrabold tracking-[-0.02em] lg:hidden">FLASHHUB</a>

            <div className="hidden max-w-[480px] flex-1 md:block">{searchField}</div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneSearch(v => !v);
                  requestAnimationFrame(() => searchRef.current?.focus());
                }}
                className="btn-quiet h-11 w-11 md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button type="button" onClick={onRandom} className="btn-ghost h-9 px-3 text-[13px]" title="Play a random game">
                <Shuffle className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Random game</span>
              </button>
            </div>

            <div className="ml-1 flex h-14 items-center border-l border-hair pl-3 lg:h-16 lg:pl-4">
              <button
                type="button"
                onClick={openAccount}
                className="flex h-11 items-center gap-2.5 px-1 text-left transition-colors duration-150 hover:text-ink"
                aria-label={currentUser ? `Account: ${currentUser.username}` : 'Sign in'}
              >
                <Avatar user={currentUser} />
                <span className="hidden max-w-[120px] truncate text-[13px] font-semibold xl:block">
                  {currentUser ? currentUser.displayName || currentUser.username : 'Sign in'}
                </span>
              </button>
            </div>
          </div>

          {phoneSearch && <div className="border-t border-hair px-4 py-2 md:hidden">{searchField}</div>}
        </header>

        {children}
      </div>

      {/* Phone and tablet: the sidebar becomes a full-screen sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ground lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-14 flex-none items-center justify-between border-b border-hair px-4">
            <span className="font-display text-[17px] font-extrabold tracking-[-0.02em]">FLASHHUB</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="btn-quiet -mr-2 h-11 w-11" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarBody route={route} onUpload={onUpload} onAdmin={onAdmin} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
