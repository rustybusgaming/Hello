import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, UserAccount } from './types';
import { TopBar } from './components/TopBar';
import { GenreTabs } from './components/GenreTabs';
import { GameCard } from './components/GameCard';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { AdminPanel } from './components/AdminPanel';
import { AccountModal } from './components/AccountModal';
import { NotFoundPanel } from './components/NotFoundPanel';
import { Loader2, Clock, Heart, Timer, X, Sparkles, Zap, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/hooks';
import { formatGameInfo } from './utils/gameTitles';

const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5';

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
  
  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [show404View, setShow404View] = useState(false);

  // User Authentication State. The session itself lives in an httpOnly cookie the browser
  // sends automatically, so nothing here is readable by page or frame scripts.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
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

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin mb-4 text-flame" />
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
          <div className="flex flex-col gap-10 pt-6">
            {isDefaultView && (
              <section className="panel relative overflow-hidden px-6 py-8 sm:px-10 sm:py-11">
                <div className="absolute inset-0 grid-drift opacity-[0.55] pointer-events-none" />
                <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-flame/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-28 right-0 w-80 h-80 rounded-full bg-plasma/15 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-flame/30 bg-flame/10 text-flame font-mono text-[10px] tracking-[0.18em] uppercase">
                      <Zap className="w-3 h-3" fill="currentColor" />
                      Ruffle + WebAssembly
                    </span>
                    <h1 className="mt-4 font-display text-3xl sm:text-[42px] leading-[1.05] font-bold text-white">
                      The whole arcade,
                      <br />
                      <span className="bg-gradient-to-r from-flame via-ember to-plasma bg-clip-text text-transparent">
                        nothing to install.
                      </span>
                    </h1>
                    <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                      Flash classics streamed straight into Ruffle, plus HTML5 and Unity webports —
                      all playable in the browser, with cloud saves that follow your account.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 lg:items-end">
                    <div className="flex gap-6">
                      {[
                        { label: 'Games', value: catalogStats.total, icon: Gamepad2 },
                        { label: 'Flash', value: catalogStats.flash, icon: Zap },
                        { label: 'Webports', value: catalogStats.ports, icon: Sparkles }
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex flex-col">
                          <span className="font-display text-2xl font-bold text-white tabular-nums">{value}</span>
                          <span className="eyebrow flex items-center gap-1 mt-0.5">
                            <Icon className="w-2.5 h-2.5" />
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleRandomGame}
                      className="btn-flame h-10 px-5 rounded-xl text-xs self-start lg:self-auto"
                    >
                      Roll a random game
                    </button>
                  </div>
                </div>
              </section>
            )}

            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="rule-flame" />
                  <Clock className="w-3.5 h-3.5 text-flame" />
                  <h2 className="eyebrow text-zinc-300">Jump back in</h2>
                </div>
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
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="rule-flame" />
                  <Heart className="w-3.5 h-3.5 text-plasma" fill="currentColor" />
                  <h2 className="eyebrow text-zinc-300">My arcade</h2>
                </div>
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
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="rule-flame" />
                  <h2 className="eyebrow text-zinc-300">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : activeGenre === 'All'
                        ? 'Every game'
                        : activeGenre}
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                  {filteredGames.length} title{filteredGames.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className={GRID}>
                {filteredGames.map((game, i) => (
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
            className="panel fixed bottom-6 right-6 z-40 flex items-center gap-3.5 bg-surface/95 backdrop-blur-xl text-white px-4 py-3 shadow-2xl max-w-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-flame/15 border border-flame/25 flex items-center justify-center flex-shrink-0">
              <Timer className="w-4 h-4 text-flame" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow">Session complete</p>
              <p className="text-xs text-zinc-200 truncate mt-0.5">
                Played <span className="text-white font-semibold">{sessionRecap.title}</span> for <span className="text-flame font-semibold font-mono">{sessionRecap.durationText}</span>
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
