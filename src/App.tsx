import React, { useState, useEffect, useMemo } from 'react';
import { Game } from './types';
import { TopBar } from './components/TopBar';
import { GenreTabs } from './components/GenreTabs';
import { GameCard } from './components/GameCard';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { Loader2, Clock, Heart, Timer, X } from 'lucide-react';
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [favorites, setFavorites] = useLocalStorage<string[]>('flashhub-favorites', []);
  const [recentlyPlayed, setRecentlyPlayed] = useLocalStorage<string[]>('flashhub-recently-played', []);

  const fetchGames = () => {
    fetch(`/api/games?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setGames(data.data);
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
        .then((res) => res.json())
        .then((data) => {
          if (!data.isSyncing) {
            setIsSyncing(false);
            fetchGames();
          }
        })
        .catch((err) => console.error('Error polling sync status:', err));
    }, 3000);

    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleTriggerSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    fetch('/api/sync', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        console.log('Sync trigger response:', data);
      })
      .catch((err) => {
        console.error('Failed to trigger sync:', err);
        setIsSyncing(false);
      });
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
    if (filteredGames.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    handleGameClick(filteredGames[randomIndex]);
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
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

  const isDefaultView = searchQuery === '' && activeGenre === 'All';

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 flex flex-col overflow-hidden">
      <TopBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onRandomGame={handleRandomGame} 
        onUploadClick={() => setIsUploadModalOpen(true)}
        onSyncClick={handleTriggerSync}
        isSyncing={isSyncing}
      />
      
      <GenreTabs 
        genres={allGenres} 
        activeGenre={activeGenre} 
        onSelectGenre={setActiveGenre} 
      />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin mb-4 text-zinc-400" />
            <p className="text-[10px] tracking-widest uppercase">Loading catalog...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="flex flex-col gap-10">
            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Recently Played</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                  <h2 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">My Arcade</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                  <h2 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">All Games</h2>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
          <div className="text-center py-32 text-zinc-500">
            <p className="text-sm font-medium text-zinc-400 mb-1">No games found</p>
            <p className="text-[11px]">Try adjusting your search or category filters.</p>
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

      {selectedGame && (
        <PlayerModal 
          game={selectedGame} 
          onClose={handleCloseModal} 
        />
      )}

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={fetchGames}
        />
      )}
    </div>
  );
}
