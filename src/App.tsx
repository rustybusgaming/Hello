import React, { useState, useEffect, useMemo } from 'react';
import { Game } from './types';
import { TopBar } from './components/TopBar';
import { GenreTabs } from './components/GenreTabs';
import { GameCard } from './components/GameCard';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { Loader2, Clock, Heart } from 'lucide-react';
import { useLocalStorage } from './lib/hooks';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [favorites, setFavorites] = useLocalStorage<string[]>('flashhub-favorites', []);
  const [recentlyPlayed, setRecentlyPlayed] = useLocalStorage<string[]>('flashhub-recently-played', []);

  const fetchGames = () => {
    fetch(`/api/games?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setGames(data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch games:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGames();
  }, []);

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
    <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e3] font-sans selection:bg-[#ff8a00]/30 flex flex-col overflow-hidden">
      <TopBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onRandomGame={handleRandomGame} 
        onUploadClick={() => setIsUploadModalOpen(true)}
      />
      
      <GenreTabs 
        genres={allGenres} 
        activeGenre={activeGenre} 
        onSelectGenre={setActiveGenre} 
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#ff8a00]" />
            <p className="text-[10px] tracking-widest uppercase">Loading catalog...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="flex flex-col gap-10">
            {isDefaultView && recentlyPlayedGames.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[#ff8a00]" />
                  <h2 className="text-lg font-bold uppercase tracking-tight text-white">Recently Played</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-[#ff8a00]" fill="#ff8a00" />
                  <h2 className="text-lg font-bold uppercase tracking-tight text-white">My Arcade</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <h2 className="text-lg font-bold uppercase tracking-tight text-white mb-4">All Games</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="text-center py-32 text-gray-500">
            <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-tight">No games found</p>
            <p className="text-[10px] uppercase">Try adjusting your search or category filters.</p>
          </div>
        )}
      </main>

      {selectedGame && (
        <PlayerModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
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
