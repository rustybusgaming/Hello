import React, { useState, useEffect, useMemo } from 'react';
import { Game, UserAccount } from './types';
import { TopBar } from './components/TopBar';
import { GenreTabs } from './components/GenreTabs';
import { GameCard } from './components/GameCard';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { AdminPanel } from './components/AdminPanel';
import { AccountModal } from './components/AccountModal';
import { NotFoundPanel } from './components/NotFoundPanel';
import { Loader2, Clock, Heart, Timer, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/hooks';

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
  
  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [show404View, setShow404View] = useState(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useLocalStorage<UserAccount | null>('flashhub-active-user', null);
  const [authToken, setAuthToken] = useLocalStorage<string | null>('flashhub-auth-token', null);

  const [favorites, setFavorites] = useLocalStorage<string[]>('flashhub-favorites', []);
  const [recentlyPlayed, setRecentlyPlayed] = useLocalStorage<string[]>('flashhub-recently-played', []);

  // Validate session on launch or sync active user
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(d => {
          if (d && d.status === 'ok' && d.user) {
            setCurrentUser(d.user);
          } else {
            // Expired or invalid token
            setAuthToken(null);
          }
        })
        .catch(() => setAuthToken(null));
    } else {
      // Fallback check if accounts exist
      fetch('/api/accounts')
        .then(res => res.ok ? res.json() : null)
        .then(d => {
          if (d && d.status === 'ok' && Array.isArray(d.data) && d.data.length > 0) {
            if (!currentUser) {
              setCurrentUser(d.data[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const handleUpdateUser = (user: UserAccount | null, token?: string) => {
    setCurrentUser(user);
    if (token !== undefined) {
      setAuthToken(token);
    }
  };

  const fetchGames = () => {
    fetch(`/api/games?t=${Date.now()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.status === 'ok') {
          // Filter out hidden games for regular view unless search matches
          const visibleGames = (data.data || []).filter((g: Game) => !g.hidden);
          setGames(visibleGames.length > 0 ? visibleGames : (data.data || []));
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

  const handleTriggerSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    fetch('/api/sync', { method: 'POST' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) console.log('Sync trigger response:', data);
      })
      .catch((err) => {
        console.error('Failed to trigger sync:', err);
        setIsSyncing(false);
      });
  };

  const handleSwitchUser = async (username: string) => {
    try {
      const res = await fetch('/api/accounts/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.status === 'ok') {
          setCurrentUser(d.data || d.user);
          if (d.token) setAuthToken(d.token);
        }
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    games.forEach((game) => game.genres.forEach((g) => genres.add(g)));
    return ['All', ...Array.from(genres).sort()];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = activeGenre === 'All' || game.genres.includes(activeGenre);
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
      setTimeout(() => {
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

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 flex flex-col overflow-hidden">
      <TopBar 
        searchQuery={searchQuery} 
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (show404View) setShow404View(false);
        }} 
        onRandomGame={handleRandomGame} 
        onUploadClick={() => setIsUploadModalOpen(true)}
        onSyncClick={handleTriggerSync}
        isSyncing={isSyncing}
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

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin mb-4 text-zinc-400" />
            <p className="text-[10px] tracking-widest uppercase">Loading catalog...</p>
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
          <div className="flex flex-col gap-10">
            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Recently Played</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {recentlyPlayedGames.map((game) => (
                    <GameCard 
                      key={game.id} 
                      game={game}
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
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-zinc-400" fill="currentColor" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">My Arcade</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {favoriteGames.map((game) => (
                    <GameCard 
                      key={game.id} 
                      game={game}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={handleGameClick} 
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              {isDefaultView && (recentlyPlayedGames.length > 0 || favoriteGames.length > 0) && (
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                    All Games ({games.length})
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {filteredGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
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
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3.5 bg-zinc-950/90 backdrop-blur-xl border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl max-w-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Timer className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Session Completed</p>
              <p className="text-xs text-zinc-200 truncate">
                Played <span className="text-white font-medium">{sessionRecap.title}</span> for <span className="text-emerald-400 font-medium font-mono">{sessionRecap.durationText}</span>
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
          authToken={authToken}
          onClose={() => setIsAccountModalOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
}
