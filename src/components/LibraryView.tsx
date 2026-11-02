import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { LibraryEntry, RUNTIME_ORDER, Runtime } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { LibraryTab, hrefFor } from '../lib/router';
import { onGridKeyDown } from '../lib/navigation';
import { GameCard, GameCardSkeleton } from './GameCard';
import { GameRow, GameRowHeader } from './GameRow';
import { CARD_GRID, EmptyBlock } from './Section';

export type SortOrder = 'catalogue' | 'title' | 'recent' | 'played';

export interface LibraryFilters {
  runtime: Runtime | 'all';
  genre: string;
  sort: SortOrder;
  view: 'grid' | 'list';
}

export const DEFAULT_FILTERS: LibraryFilters = { runtime: 'all', genre: 'all', sort: 'catalogue', view: 'grid' };

interface LibraryViewProps {
  tab: LibraryTab;
  searchQuery: string;
  onClearSearch: () => void;
  filters: LibraryFilters;
  onFilters: (next: LibraryFilters) => void;
}

const TAB_LABEL: Record<LibraryTab, string> = {
  all: 'All',
  flashhub: 'Plays in Flashhub',
  steam: 'Steam',
  favourites: 'Favourites',
  recent: 'Recently played'
};

const SORT_LABEL: Record<SortOrder, string> = {
  catalogue: 'Catalogue order',
  title: 'Title, A to Z',
  recent: 'Last played',
  played: 'Most played'
};

// Divisible by 2, 3, 4, 5 and 6, so every page ends on a full row
const PAGE_SIZE = 60;

export function LibraryView({ tab, searchQuery, onClearSearch, filters, onFilters }: LibraryViewProps) {
  const { entries, byKey, favourites, recentKeys, history, steam, reloadSteam, currentUser, openAccount, loading, loadError, reloadCatalogue } =
    useLibrary();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);

  const tabEntries = useMemo<Record<LibraryTab, LibraryEntry[]>>(() => {
    const pick = (keys: string[]) => keys.map(k => byKey.get(k)).filter(Boolean) as LibraryEntry[];
    return {
      all: entries,
      flashhub: entries.filter(e => e.launch === 'flashhub'),
      steam: entries.filter(e => e.launch === 'steam'),
      favourites: pick(favourites),
      recent: pick(recentKeys)
    };
  }, [entries, byKey, favourites, recentKeys]);

  const base = tabEntries[tab];

  const runtimes = useMemo(() => RUNTIME_ORDER.filter(r => base.some(e => e.runtime === r)), [base]);
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    base.forEach(e => e.genres.forEach(g => counts.set(g, (counts.get(g) || 0) + 1)));
    return Array.from(counts.entries())
      .filter(([, n]) => n >= 3)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([g]) => g);
  }, [base]);

  const playedSeconds = (e: LibraryEntry) =>
    e.launch === 'steam' ? (e.steam?.playtimeMinutes ?? 0) * 60 : history[e.key]?.totalSeconds ?? 0;
  const lastPlayed = (e: LibraryEntry) =>
    (e.launch === 'steam' ? e.steam?.lastPlayedAt : history[e.key]?.lastPlayedAt) || '';

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = base.filter(e => {
      if (filters.runtime !== 'all' && e.runtime !== filters.runtime) return false;
      if (filters.genre !== 'all' && !e.genres.includes(filters.genre)) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.genres.some(g => g.toLowerCase().includes(q)) ||
        !!e.description?.toLowerCase().includes(q)
      );
    });
    // The recently played tab is already in play order; other sorts are on request
    const sort = filters.sort;
    if (sort === 'title') list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'recent') list = list.slice().sort((a, b) => lastPlayed(b).localeCompare(lastPlayed(a)));
    if (sort === 'played') list = list.slice().sort((a, b) => playedSeconds(b) - playedSeconds(a));
    return list;
  }, [base, filters, searchQuery, history]);

  useEffect(() => setVisible(PAGE_SIZE), [tab, filters, searchQuery]);

  const hasMore = visible < results.length;
  useEffect(() => {
    if (!hasMore || !sentinel.current) return;
    const observer = new IntersectionObserver(
      items => {
        if (items.some(i => i.isIntersecting)) setVisible(v => Math.min(v + PAGE_SIZE, results.length));
      },
      { rootMargin: '800px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, results.length]);

  const set = (patch: Partial<LibraryFilters>) => onFilters({ ...filters, ...patch });
  const filtered = filters.runtime !== 'all' || filters.genre !== 'all' || !!searchQuery;

  const flashhubCount = tabEntries.flashhub.length;
  const steamCount = tabEntries.steam.length;
  const subtitle =
    steam.status === 'ready'
      ? `${entries.length.toLocaleString()} games: ${flashhubCount.toLocaleString()} play in Flashhub, ${steamCount.toLocaleString()} open in Steam.`
      : `${flashhubCount.toLocaleString()} games play in Flashhub. Link Steam to add your Steam games.`;

  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-semibold">Library</h1>
        <p className="text-[14px] text-muted">{loading ? 'Loading the catalogue…' : subtitle}</p>
      </div>

      {/* The list's states, on one full-width rule */}
      <div role="tablist" aria-label="Library views" className="no-scrollbar mt-5 flex gap-6 overflow-x-auto border-b border-rule">
        {(Object.keys(TAB_LABEL) as LibraryTab[]).map(t => {
          const count = t === 'steam' && steam.status !== 'ready' ? null : tabEntries[t].length;
          return (
            <a
              key={t}
              role="tab"
              aria-selected={tab === t}
              href={hrefFor({ name: 'library', tab: t })}
              className="tab flex flex-none items-center gap-2"
            >
              {TAB_LABEL[t]}
              {count !== null && <span className="text-[12px] tabular-nums text-faint">{count.toLocaleString()}</span>}
            </a>
          );
        })}
      </div>

      {tab === 'steam' && steam.status !== 'ready' ? (
        <SteamState />
      ) : (
        <>
          {/* Toolbar: scope on the left, the count and the view on the right */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="filter-runtime">Runs on</label>
            <select
              id="filter-runtime"
              className="select"
              value={filters.runtime}
              onChange={e => set({ runtime: e.target.value as LibraryFilters['runtime'] })}
            >
              <option value="all">Any runtime</option>
              {runtimes.map(r => (
                <option key={r} value={r}>{r === 'Steam' ? 'Steam library' : r}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="filter-genre">Genre</label>
            <select id="filter-genre" className="select" value={filters.genre} onChange={e => set({ genre: e.target.value })}>
              <option value="all">Any genre</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="filter-sort">Sort by</label>
            <select id="filter-sort" className="select" value={filters.sort} onChange={e => set({ sort: e.target.value as SortOrder })}>
              {(Object.keys(SORT_LABEL) as SortOrder[]).map(s => (
                <option key={s} value={s}>{s === 'catalogue' && tab === 'recent' ? 'Play order' : SORT_LABEL[s]}</option>
              ))}
            </select>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  onFilters({ ...filters, runtime: 'all', genre: 'all' });
                  onClearSearch();
                }}
                className="btn-quiet h-9 px-3 text-[13px]"
              >
                Clear filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-[13px] tabular-nums text-faint">
                {results.length.toLocaleString()} {results.length === 1 ? 'game' : 'games'}
                {searchQuery && <> matching “{searchQuery}”</>}
              </span>
              <div className="flex" role="group" aria-label="Layout">
                <button
                  type="button"
                  onClick={() => set({ view: 'grid' })}
                  aria-pressed={filters.view === 'grid'}
                  aria-label="Show as a grid"
                  className="btn-quiet h-9 w-9"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => set({ view: 'list' })}
                  aria-pressed={filters.view === 'list'}
                  aria-label="Show as a list"
                  className="btn-quiet h-9 w-9"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {loadError ? (
              <EmptyBlock
                action={
                  <button type="button" onClick={reloadCatalogue} className="btn-ghost h-9 px-4 text-[13px]">
                    <RefreshCw className="h-4 w-4" aria-hidden /> Retry
                  </button>
                }
              >
                The catalogue did not load. Check the connection and try again.
              </EmptyBlock>
            ) : loading ? (
              <div className={CARD_GRID} aria-busy="true">
                {Array.from({ length: 18 }, (_, i) => <GameCardSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <EmptyBlock
                action={
                  filtered ? (
                    <button
                      type="button"
                      onClick={() => {
                        onFilters({ ...filters, runtime: 'all', genre: 'all' });
                        onClearSearch();
                      }}
                      className="btn-ghost h-9 px-4 text-[13px]"
                    >
                      Clear filters
                    </button>
                  ) : undefined
                }
              >
                {filtered
                  ? `No games in ${TAB_LABEL[tab].toLowerCase()} match${searchQuery ? ` “${searchQuery}”` : ' these filters'}.`
                  : tab === 'favourites'
                    ? 'No favourites yet. Press the heart on any game to keep it here.'
                    : tab === 'recent'
                      ? 'Nothing played yet. Games you launch show up here, newest first.'
                      : 'This part of the library is empty.'}
              </EmptyBlock>
            ) : filters.view === 'grid' ? (
              <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
                {results.slice(0, visible).map((entry, i) => (
                  <GameCard key={entry.key} entry={entry} eager={i < 12} />
                ))}
              </div>
            ) : (
              <>
                <GameRowHeader />
                <ul className="border-t border-hair" onKeyDown={onGridKeyDown}>
                  {results.slice(0, visible).map(entry => (
                    <GameRow key={entry.key} entry={entry} />
                  ))}
                </ul>
              </>
            )}

            {hasMore && !loading && (
              <div ref={sentinel} className="mt-8 flex items-center justify-between gap-4">
                <span className="text-[13px] tabular-nums text-faint">
                  {visible.toLocaleString()} of {results.length.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setVisible(v => Math.min(v + PAGE_SIZE, results.length))}
                  className="btn-ghost h-9 px-4 text-[13px]"
                >
                  Show {Math.min(PAGE_SIZE, results.length - visible)} more
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  /** What the Steam tab shows when there is no list to show, and what to do about it. */
  function SteamState() {
    const box = (text: React.ReactNode, action?: React.ReactNode) => (
      <div className="mt-6">
        <EmptyBlock action={action}>{text}</EmptyBlock>
      </div>
    );
    switch (steam.status) {
      case 'loading':
        return (
          <div className={`${CARD_GRID} mt-6`} aria-busy="true">
            {Array.from({ length: 12 }, (_, i) => <GameCardSkeleton key={i} />)}
          </div>
        );
      case 'signed-out':
        return box(
          'Sign in and link your Steam account to see your Steam games here. They open in the Steam client.',
          <button type="button" onClick={openAccount} className="btn-ghost h-9 px-4 text-[13px]">Sign in</button>
        );
      case 'not-linked':
        return box(
          'Link your Steam account and its games join this library, each marked to open in Steam.',
          <button type="button" onClick={openAccount} className="btn-ghost h-9 px-4 text-[13px]">Link Steam</button>
        );
      case 'needs-key':
        return box(
          currentUser?.role === 'admin'
            ? 'Steam libraries need a Steam Web API key on the server. Set STEAM_API_KEY and restart.'
            : 'This server has no Steam Web API key yet, so Steam libraries cannot be read. Ask the admin to add one.'
        );
      case 'private':
        return box(
          'Steam hides this account’s games because its game details are private. Make them public in Steam’s privacy settings, then refresh.',
          <div className="flex gap-2">
            <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 px-4 text-[13px]">
              Privacy settings
            </a>
            <button type="button" onClick={reloadSteam} className="btn-ghost h-9 px-4 text-[13px]">Refresh</button>
          </div>
        );
      case 'error':
        return box(
          `${steam.message}. Your Flashhub games are unaffected.`,
          <button type="button" onClick={reloadSteam} className="btn-ghost h-9 px-4 text-[13px]">
            <RefreshCw className="h-4 w-4" aria-hidden /> Retry
          </button>
        );
      default:
        return null;
    }
  }
}
