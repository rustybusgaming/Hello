import React from 'react';
import { Game } from '../types';
import { Heart } from 'lucide-react';

interface GameCardProps {
  key?: React.Key;
  game: Game;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, gameId: string) => void;
  onClick: (game: Game) => void;
}

export function GameCard({ game, isFavorite = false, onToggleFavorite, onClick }: GameCardProps) {
  return (
    <div
      className="bg-[#16161a] rounded-lg overflow-hidden border border-[#2d2d30] group cursor-pointer flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50 hover:border-[#3d3d40]"
      onClick={() => onClick(game)}
    >
      <div className="h-36 bg-[#252529] relative overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(e, game.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors z-10"
          >
            <Heart 
              className={`w-4 h-4 ${isFavorite ? 'fill-[#ff8a00] text-[#ff8a00]' : 'text-white'}`} 
            />
          </button>
        )}

        <div className="absolute bottom-2 left-2 flex gap-1 items-center">
          <span className={`text-[10px] px-1.5 font-bold rounded-sm ${
            game.source === 'steam' ? 'bg-blue-600 text-white' :
            game.source === 'archive' ? 'bg-zinc-700 text-white' :
            'bg-emerald-600 text-white'
          } uppercase`}>
            {game.source}
          </span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-sm backdrop-blur-md text-[#e1e1e3]">
            ★ {game.rating ? game.rating.toFixed(1) : '5.0'}
          </span>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-bold text-sm truncate uppercase tracking-tight text-[#e1e1e3] group-hover:text-[#ff8a00] transition-colors">
          {game.title}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-gray-500 uppercase">
          {game.genres.slice(0, 3).join(' • ')}
        </div>
      </div>
    </div>
  );
}
