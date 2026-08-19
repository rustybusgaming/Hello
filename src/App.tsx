import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Game, UserAccount } from './types';
import { TopBar } from './components/TopBar';
import { GenreTabs } from './components/GenreTabs';
import { GameCard } from './components/GameCard';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { AdminPanel } from './components/AdminPanel';
import { AccountModal } from './components/AccountModal';
import { NotFoundPanel } from './components/NotFoundPanel';
import { Loader2, Clock, Heart, Timer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/hooks';
import { formatGameInfo } from './utils/gameTitles';

// 1b: equal-width cells, no gaps — the hairline borders on each cell draw the grid.
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 border-t border-l border-hair';

/**
 * Loopback has two names, and they are separate origins to the browser. Framing games from
 * the other one keeps third-party game code away from the hub's cookie and storage without
 * any extra configuration during local development.
 */
function deriveGameOrigin(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  const suffix = port ? `:${port}` : '';
  if (hostname === 'localhost') return `${protocol}//127.0.0.1${suffix}`;
  if (hostname === '127.0.0.1') return `${protocol}//localhost${suffix}`;
  return '';
}

/**
 * The shelf header from 1b: a mono kicker, then the shelf's statement set flush left and
 * solid. The count sits opposite it on the same baseline.
 */
function ShelfHeader({
  kicker,
  title,
  count
}: {
  kicker: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-6 px-1 pb-5 pt-9">
      <div className="min-w-0">
        <div className="eyebrow mb-2.5">{kicker}</div>
        <h2 className="font-display text-[28px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em] max-w-[22ch] text-pretty">
          {title}
        </h2>
      </div>
      <span className="flex-shrink-0 font-mono text-[11px] text-ink/55 sm:pb-1.5">
        {count.toLocaleString()} title{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

/** One cell of the stat band under the masthead (1a). */
function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="stat border-r-2 border-rule [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r-2 lg:last:border-r-0">
      <div className="eyebrow mb-1.5">{label}</div>
      <div className={`stat-value ${accent ? 'text-accent' : ''}`}>{value.toLocaleString()}</div>
    </div>
  );
}

interface SessionRecap {
  title: string;
  seconds: number;
  durationText: string;
}

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sessionRecap, setSessionRecap] = useState<SessionRecap | null>(null);
  const recapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The grid renders in pages. Mounting all ~300 cards at once costs thousands of DOM nodes
  // and starts every thumbnail download up front, which is bandwidth a running game needs.
  const PAGE_SIZE = 60;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollMemory = useRef(0);
  const pendingScrollRestore = useRef(false);
  
  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [show404View, setShow404View] = useState(false);

  // User Authentication State. The session itself lives in an httpOnly cookie the browser
  // sends automatically, so nothing here is readable by page or frame scripts.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  // Origin that game frames load from; kept separate from the hub so game code cannot
  // reach the session. Derived locally first so the very first frame already points at the
  // right place — waiting on /api/config would make an early click load same-origin and
  // then reload the game when the answer arrived.
  const [gameOrigin, setGameOrigin] = useState(deriveGameOrigin);
  const [, setAuthChecked] = useState(false);

  const [favorites, setFavorites] = useLocalStorage<string[]>('flashhub-favorites', []);
  const [recentlyPlayed, setRecentlyPlayed] = useLocalStorage<string[]>('flashhub-recently-played', []);

  // Ask the server who we are; the session cookie rides along automatically
  const refreshSession = () => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(d => setCurrentUser(d && d.status === 'ok' && d.user ? d.user : null))
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecked(true));
  };

  useEffect(() => {
    // Older builds kept the session token and profile in localStorage, where any
    // same-origin script could read them. Clear those leftovers on first load.
    try {
      window.localStorage.removeItem('flashhub-auth-token');
      window.localStorage.removeItem('flashhub-active-user');
    } catch { /* private mode */ }

    refreshSession();

    // The server has the final say (a deployment may set GAME_ORIGIN), but an older or
    // unreachable endpoint just leaves the derived value in place.
    fetch('/api/config')
      .then(res => (res.ok ? res.json() : null))
      .then(d => {
        if (d?.gameOrigin) setGameOrigin(d.gameOrigin);
      })
      .catch(() => {});
  }, []);

  const handleUpdateUser = (user: UserAccount | null) => {
    setCurrentUser(user);
    setAuthChecked(true);
  };

  const fetchGames = () => {
    fetch(`/api/games?t=${Date.now()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.status === 'ok') {
          const formattedList = (data.data || []).map((g: Game) => {
            const info = formatGameInfo(g.id, g.title, g.genres);
            return {
              ...g,
              title: info.title,
              genres: (info.genres && info.genres.length > 0) ? info.genres : g.genres,
              description: g.description || info.description,
              rating: g.rating || info.rating || 4.8
            };
          });

          // Games hidden from the admin panel never reach the catalog view
          setGames(formattedList.filter((g: Game) => !g.hidden));
          if (typeof data.isSyncing === 'boolean') {
            setIsSyncing(data.isSyncing);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch games:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGames();
    return () => {
      if (recapTimeout.current) clearTimeout(recapTimeout.current);
    };
  }, []);

  // Poll sync status if currently syncing
  useEffect(() => {
    if (!isSyncing) return;
    const interval = setInterval(() => {
      fetch('/api/sync-status')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data && !data.isSyncing) {
            setIsSyncing(false);
            fetchGames();
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [isSyncing]);

  const allGenres = useMemo(() => {
    // A tag needs a few games behind it to earn a slot in the rail; one-off tags from
    // Archive.org metadata would otherwise bury the genres people actually browse by.
    const counts = new Map<string, number>();
    games.forEach((game) => game.genres.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1)));

    const ranked = Array.from(counts.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 22)
      .map(([genre]) => genre);

    return ['All', ...ranked];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        game.title.toLowerCase().includes(q) ||
        (game.description && game.description.toLowerCase().includes(q)) ||
        game.genres.some(g => g.toLowerCase().includes(q));

      const matchesGenre = activeGenre === 'All' || game.genres.includes(activeGenre);
      return matchesSearch && matchesGenre;
    });
  }, [games, searchQuery, activeGenre]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeGenre]);

  const recentlyPlayedGames = useMemo(() => {
    return recentlyPlayed.map(id => games.find(g => g.id === id)).filter(Boolean) as Game[];
  }, [recentlyPlayed, games]);

  const favoriteGames = useMemo(() => {
    return favorites.map(id => games.find(g => g.id === id)).filter(Boolean) as Game[];
  }, [favorites, games]);

  const handleRandomGame = () => {
    if (games.length === 0) return;
    setShow404View(false);
    const pool = filteredGames.length > 0 ? filteredGames : games;
    const randomIndex = Math.floor(Math.random() * pool.length);
    handleGameClick(pool[randomIndex]);
  };

  const handleGameClick = (game: Game) => {
    // Remember where the player was so closing the game puts them back
    scrollMemory.current = window.scrollY;
    setSelectedGame(game);
    setShow404View(false);
    setRecentlyPlayed(prev => {
      const updated = [game.id, ...prev.filter(id => id !== game.id)].slice(0, 8);
      return updated;
    });
  };

  const formatSessionTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins} min${mins === 1 ? '' : 's'}`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleCloseModal = (elapsedSeconds: number) => {
    // Bank the sitting so the profile's playtime covers every game, not just the Flash
    // titles that have save slots. Rounded up, so a short session still counts as one.
    if (currentUser && elapsedSeconds >= 30) {
      fetch('/api/auth/playtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: Math.max(1, Math.round(elapsedSeconds / 60)) })
      })
        .then(res => (res.ok ? res.json() : null))
        .then(d => { if (d?.status === 'ok' && d.user) setCurrentUser(d.user); })
        .catch(() => { /* the session is still over; the counter can miss one */ });
    }

    // Restore the scroll position the grid had before it was hidden. The <main> is still
    // `hidden` at this point, so the document has no height to scroll to yet — the restore
    // has to wait for the frame *after* React has painted the grid back in.
    pendingScrollRestore.current = true;
    if (selectedGame && elapsedSeconds > 0) {
      const durationText = formatSessionTime(elapsedSeconds);
      const recap: SessionRecap = {
        title: selectedGame.title,
        seconds: elapsedSeconds,
        durationText,
      };
      setSessionRecap(recap);

      // Auto-dismiss after 6.5 seconds
      if (recapTimeout.current) clearTimeout(recapTimeout.current);
      recapTimeout.current = setTimeout(() => {
        setSessionRecap(prev => (prev?.title === recap.title && prev?.seconds === recap.seconds ? null : prev));
      }, 6500);
    }
    setSelectedGame(null);
  };

  const handleToggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  // Runs once the grid is back in the layout, so the document is tall enough to scroll
  useEffect(() => {
    if (selectedGame || !pendingScrollRestore.current) return;
    pendingScrollRestore.current = false;
    const target = scrollMemory.current;
    requestAnimationFrame(() => window.scrollTo(0, target));
  }, [selectedGame]);

  const pagedGames = useMemo(() => filteredGames.slice(0, visibleCount), [filteredGames, visibleCount]);
  const hasMore = visibleCount < filteredGames.length;

  // Reveal the next page as the sentinel comes into view
  useEffect(() => {
    if (!hasMore || selectedGame) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisibleCount(count => Math.min(count + PAGE_SIZE, filteredGames.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, filteredGames.length, selectedGame]);

  const isDefaultView = searchQuery === '' && activeGenre === 'All' && !show404View;

  // The figures the stat band reports
  const catalogStats = useMemo(() => {
    const flash = games.filter((g) => g.genres.some((x) => x.toLowerCase() === 'flash')).length;
    const genres = new Set<string>();
    games.forEach((g) => g.genres.forEach((x) => genres.add(x)));
    return { total: games.length, flash, ports: games.length - flash, genres: genres.size };
  }, [games]);

  return (
    <div className="min-h-screen text-ink flex flex-col">
      <TopBar 
        searchQuery={searchQuery} 
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (show404View) setShow404View(false);
        }} 
        onRandomGame={handleRandomGame} 
        onUploadClick={() => setIsUploadModalOpen(true)}
        currentUser={currentUser}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onTrigger404={() => setShow404View(prev => !prev)}
        totalTitles={games.length}
      />
      
      {!show404View && (
        <GenreTabs
          genres={allGenres}
          activeGenre={activeGenre}
          onSelectGenre={setActiveGenre}
          resultCount={filteredGames.length}
        />
      )}

      <main
        className="flex-1 w-full max-w-[1480px] mx-auto px-4 sm:px-7 pb-20"
        hidden={!!selectedGame}
      >
        {selectedGame ? null : loading ? (
          <div className="flex flex-col items-start justify-center py-40">
            <Loader2 className="w-5 h-5 animate-spin text-accent mb-4" />
            <p className="eyebrow">Reading the catalogue…</p>
          </div>
        ) : show404View ? (
          <div className="py-6">
            <NotFoundPanel
              errorTitle="404 - Cartridge Not Found"
              errorMessage="The requested cartridge, cloud save, or custom game port could not be resolved from the repository catalogue."
              targetId={searchQuery || 'cartridge://null'}
              onGoHome={() => {
                setShow404View(false);
                setSearchQuery('');
                setActiveGenre('All');
              }}
              onRandomGame={handleRandomGame}
              onRetry={fetchGames}
            />
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="flex flex-col">
            {isDefaultView && (
              /* 1a's stat band: four equal cells, divided by 2px rules, sitting directly
                 under the masthead with no card around them. */
              <section className="grid grid-cols-2 lg:grid-cols-4 border-b-2 border-rule [&>*:nth-child(-n+2)]:border-b-2 [&>*:nth-child(-n+2)]:border-rule lg:[&>*]:border-b-0">
                <Stat label="Titles" value={catalogStats.total} />
                <Stat label="Ruffle-playable" value={catalogStats.flash} />
                <Stat label="Webports" value={catalogStats.ports} />
                <Stat label="Genres" value={catalogStats.genres} accent />
              </section>
            )}

            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <ShelfHeader
                  kicker="Shelf 01 — recently played"
                  title="Where you left off."
                  count={recentlyPlayedGames.length}
                />
                <div className={GRID}>
                  {recentlyPlayedGames.map((game, i) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      index={i}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={handleGameClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {isDefaultView && favoriteGames.length > 0 && (
              <section>
                <ShelfHeader
                  kicker="Shelf 02 — your shelf"
                  title="Titles you kept."
                  count={favoriteGames.length}
                />
                <div className={GRID}>
                  {favoriteGames.map((game, i) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      index={i}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={handleGameClick}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <ShelfHeader
                kicker={
                  searchQuery
                    ? 'Search results'
                    : activeGenre === 'All'
                      ? 'Shelf 03 — most played, all years'
                      : `Shelf 03 — ${activeGenre.toLowerCase()}`
                }
                title={
                  searchQuery
                    ? `Titles matching "${searchQuery}".`
                    : activeGenre === 'All'
                      ? `${filteredGames.length.toLocaleString()} games that outlived their plugin.`
                      : `Everything filed under ${activeGenre.toLowerCase()}.`
                }
                count={filteredGames.length}
              />
              <div className={GRID}>
                {pagedGames.map((game, i) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={i}
                    isFavorite={favorites.includes(game.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={handleGameClick}
                  />
                ))}
              </div>

              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-between gap-4 border-t-2 border-rule px-1 py-4"
                >
                  <span className="text-[11px] text-ink/55">
                    Showing {visibleCount.toLocaleString()} of {filteredGames.length.toLocaleString()}
                  </span>
                  <button
                    onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredGames.length))}
                    className="btn-ghost px-4 h-9 text-[12px]"
                  >
                    Load next {Math.min(PAGE_SIZE, filteredGames.length - visibleCount)}
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="py-6">
            <NotFoundPanel
              errorTitle={`No matches for "${searchQuery}"`}
              errorMessage={`We couldn't find any games matching "${searchQuery}" in the ${activeGenre} catalog.`}
              targetId={searchQuery}
              onGoHome={() => {
                setSearchQuery('');
                setActiveGenre('All');
              }}
              onRandomGame={handleRandomGame}
              onRetry={fetchGames}
            />
          </div>
        )}
      </main>

      {/* The site's one footer: attribution and the two policy pages, ruled off like everything
          else. Hidden while a game is open so it cannot appear under the player. */}
      {!selectedGame && (
        <footer className="border-t-2 border-rule bg-paper mt-auto">
          <div className="max-w-[1480px] mx-auto px-4 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <span className="font-display text-[13px] font-extrabold tracking-[-0.02em]">FLASHHUB</span>
            <p className="text-[12px] text-ink/55 max-w-lg leading-relaxed">
              A preservation front end. Every game belongs to its original authors — see the
              credits for who preserved and ported them.
            </p>
            <nav className="sm:ml-auto flex items-center gap-5 text-[12px] font-semibold">
              <a href="/credits.html" className="text-ink hover:text-accent transition-colors">Credits</a>
              <a href="/terms.html" className="text-ink hover:text-accent transition-colors">Terms</a>
              <a href="/privacy.html" className="text-ink hover:text-accent transition-colors">Privacy</a>
            </nav>
          </div>
        </footer>
      )}

      {/* Floating Session Duration Toast / Display when player modal is closed */}
      <AnimatePresence>
        {sessionRecap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed bottom-0 right-0 z-40 flex items-stretch max-w-md bg-paper border-t-2 border-l-2 border-ink"
          >
            <div className="w-9 flex items-center justify-center bg-accent text-paper flex-shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 px-4 py-3">
              <p className="eyebrow">Session complete</p>
              <p className="text-[13px] truncate mt-1">
                <span className="font-semibold">{sessionRecap.title}</span>
                <span className="text-ink/55"> · </span>
                <span className="font-mono">{sessionRecap.durationText}</span>
              </p>
            </div>
            <button
              onClick={() => setSessionRecap(null)}
              className="w-9 flex items-center justify-center text-ink/55 hover:bg-shade hover:text-ink transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Modal */}
      {selectedGame && (
        <PlayerModal 
          game={selectedGame} 
          onClose={handleCloseModal} 
          currentUser={currentUser}
          gameOrigin={gameOrigin}
        />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={fetchGames}
          isAuthenticated={!!currentUser}
        />
      )}

      {/* Admin Panel Modal */}
      {isAdminModalOpen && (
        <AdminPanel
          games={games}
          onClose={() => setIsAdminModalOpen(false)}
          onRefreshGames={fetchGames}
          currentUser={currentUser}
        />
      )}

      {/* User Account & Steam Linking Modal */}
      {isAccountModalOpen && (
        <AccountModal
          currentUser={currentUser}
          onClose={() => setIsAccountModalOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
}
