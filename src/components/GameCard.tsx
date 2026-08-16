import React from 'react';
import { Game } from '../types';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface GameCardProps {
  key?: React.Key;
  game: Game;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, gameId: string) => void;
  onClick: (game: Game) => void;
}

export function GameCard({ game, isFavorite = false, onToggleFavorite, onClick }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 rounded-xl overflow-hidden border border-white/5 group cursor-pointer flex flex-col h-full hover:border-white/20 transition-colors"
      onClick={() => onClick(game)}
    >
      <div className="h-28 bg-zinc-900 relative overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(e, game.id)}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors z-10"
          >
            <Heart 
              className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : 'text-zinc-400'}`} 
            />
          </button>
        )}

        <div className="absolute bottom-2 left-2 flex gap-1.5 items-center">
          <span className={`text-[9px] px-1.5 py-0.5 font-medium rounded-md uppercase tracking-wider ${
            game.source === 'steam' ? 'bg-blue-500/80 text-white' :
            game.source === 'archive' ? 'bg-amber-600/80 text-white' :
            'bg-emerald-500/80 text-white'
          } backdrop-blur-sm`}>
            {game.source}
          </span>
          {game.isArchiveIndependent && (
            <span className="text-[9px] bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded-md backdrop-blur-sm font-medium" title="Runs without Archive.org">
              ⚡ Multi-Mirror
            </span>
          )}
          <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm text-zinc-300 font-medium">
            ★ {game.rating ? game.rating.toFixed(1) : '5.0'}
          </span>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow bg-black/40 backdrop-blur-sm">
        <h3 className="font-medium text-xs truncate text-zinc-200 group-hover:text-white transition-colors">
          {game.title}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1 text-[9px] text-zinc-500">
          {game.genres.slice(0, 2).join(', ')}
        </div>
      </div>
    </motion.div>
  );
}
