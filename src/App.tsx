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
import { Loader2, Clock, Heart, Timer, X, Sparkles, Zap, Gamepad2, Shuffle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/hooks';
import { formatGameInfo } from './utils/gameTitles';

const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4';

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

/** The header every game row shares: accent rule, eyebrow, display title, count. */
function SectionHeader({
  icon,
  eyebrow,
  title,
  count
}: {
  icon?: React.ReactNode;
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <span className="flex items-center gap-2.5">
          <span className="rule-accent" />
          {icon}
          <span className="eyebrow">{eyebrow}</span>
        </span>
        <h2 className="mt-2 font-display text-[19px] sm:text-[22px] font-bold text-white truncate">
          {title}
        </h2>
      </div>
      <span className="flex-shrink-0 font-mono text-[10px] text-zinc-500 tabular-nums px-2.5 py-1 rounded-lg border border-edge bg-white/[0.03]">
        {count} title{count === 1 ? '' : 's'}
      </span>
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

    return ['All', 'Archive-free', ...ranked];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        game.title.toLowerCase().includes(q) ||
        (game.description && game.description.toLowerCase().includes(q)) ||
        game.genres.some(g => g.toLowerCase().includes(q));

      let matchesGenre = activeGenre === 'All';
      if (activeGenre === 'Archive-free') {
        matchesGenre = Boolean(
          game.isArchiveIndependent ||
          game.source === 'webporting' ||
          (game.mirrors && game.mirrors.some(m => m.isArchiveIndependent))
        );
      } else if (activeGenre !== 'All') {
        matchesGenre = game.genres.includes(activeGenre);
      }
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

  // Headline counts for the hero strip
  const catalogStats = useMemo(() => {
    const flash = games.filter((g) => g.genres.some((x) => x.toLowerCase() === 'flash')).length;
    return { total: games.length, flash, ports: games.length - flash };
  }, [games]);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col">
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
      />
      
      {!show404View && (
        <GenreTabs 
          genres={allGenres} 
          activeGenre={activeGenre} 
          onSelectGenre={setActiveGenre} 
        />
      )}

      <main
        className="flex-1 w-full max-w-[1480px] mx-auto px-4 sm:px-7 pb-20"
        hidden={!!selectedGame}
      >
        {selectedGame ? null : loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-zinc-600">
            <span className="relative flex items-center justify-center w-14 h-14 mb-5">
              <span className="absolute inset-0 rounded-2xl bg-volt/20 blur-xl" />
              <Loader2 className="relative w-6 h-6 animate-spin text-volt" />
            </span>
            <p className="eyebrow">Spinning up the cabinet…</p>
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
          <div className="flex flex-col gap-12 pt-7">
            {isDefaultView && (
              <section className="panel relative overflow-hidden px-6 py-9 sm:px-11 sm:py-14">
                <div className="absolute inset-0 grid-drift opacity-60 pointer-events-none" />
                <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-volt/25 blur-[110px] pointer-events-none" />
                <div className="absolute -bottom-40 right-[-6rem] w-[26rem] h-[26rem] rounded-full bg-beam/15 blur-[110px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-punch/10 blur-[100px] pointer-events-none" />
                {/* A marquee light sweeping across the cabinet glass */}
                <div className="absolute inset-y-0 -left-1/3 w-1/3 marquee-sweep pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void/70 to-transparent pointer-events-none" />

                <div className="relative flex flex-col gap-9">
                  <div className="max-w-2xl">
                    <h1 className="font-display text-[32px] sm:text-[58px] leading-[1.02] sm:leading-[0.98] font-extrabold text-white">
                      The whole arcade,
                      <br />
                      <span className="text-gradient">nothing to install.</span>
                    </h1>
                    <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-lg">
                      Flash classics streamed straight into Ruffle, plus HTML5 and Unity webports —
                      all playable in the browser, with cloud saves that follow your account.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-6">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleRandomGame}
                        className="btn-volt h-11 px-6 rounded-2xl text-[13px] flex items-center gap-2"
                      >
                        <Shuffle className="w-4 h-4" />
                        Roll a random game
                      </button>
                      <button
                        onClick={() => setActiveGenre('Archive-free')}
                        className="btn-ghost h-11 px-5 rounded-2xl text-[13px] font-semibold flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-mint" />
                        Browse archive-free
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { label: 'Games', value: catalogStats.total, icon: Gamepad2, tint: 'text-volt' },
                        { label: 'Flash', value: catalogStats.flash, icon: Zap, tint: 'text-amber' },
                        { label: 'Webports', value: catalogStats.ports, icon: Sparkles, tint: 'text-beam' }
                      ].map(({ label, value, icon: Icon, tint }) => (
                        <div key={label} className="stat">
                          <span className="stat-value">{value}</span>
                          <span className="eyebrow flex items-center gap-1.5">
                            <Icon className={`w-2.5 h-2.5 ${tint}`} />
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Clock className="w-3.5 h-3.5 text-volt" />}
                  eyebrow="Recently played"
                  title="Jump back in"
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
                <SectionHeader
                  icon={<Heart className="w-3.5 h-3.5 text-punch" fill="currentColor" />}
                  eyebrow="Favourites"
                  title="My arcade"
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
              <SectionHeader
                icon={<Gamepad2 className="w-3.5 h-3.5 text-beam" />}
                eyebrow={searchQuery ? 'Search' : activeGenre === 'All' ? 'Catalogue' : 'Genre'}
                title={
                  searchQuery
                    ? `Results for "${searchQuery}"`
                    : activeGenre === 'All'
                      ? 'Every game'
                      : activeGenre
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
                <div ref={loadMoreRef} className="flex justify-center py-10">
                  <button
                    onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredGames.length))}
                    className="btn-ghost px-5 h-11 rounded-2xl text-xs font-semibold"
                  >
                    Show more · {filteredGames.length - visibleCount} left
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

      {/* Floating Session Duration Toast / Display when player modal is closed */}
      <AnimatePresence>
        {sessionRecap && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="sheet fixed bottom-6 right-6 z-40 flex items-center gap-3.5 backdrop-blur-2xl text-white px-4 py-3.5 max-w-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-volt/15 border border-volt/30 flex items-center justify-center flex-shrink-0">
              <Timer className="w-4 h-4 text-volt" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow">Session complete</p>
              <p className="text-xs text-zinc-200 truncate mt-0.5">
                Played <span className="text-white font-semibold">{sessionRecap.title}</span> for <span className="text-volt font-semibold font-mono">{sessionRecap.durationText}</span>
              </p>
            </div>
            <button
              onClick={() => setSessionRecap(null)}
              className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
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
