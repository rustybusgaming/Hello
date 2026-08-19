import React, { useState } from 'react';
import { Game } from '../types';
import { Heart, Play, Star } from 'lucide-react';

interface GameCardProps {
  game: Game;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, gameId: string) => void;
  onClick: (game: Game) => void;
  index?: number;
}

/** One colour per catalogue origin, so the grid is scannable without reading labels. */
const SOURCE_CHIP: Record<string, { className: string; label: string }> = {
  webporting: { className: 'chip-web', label: 'Web' },
  archive: { className: 'chip-archive', label: 'Archive' },
  steam: { className: 'chip-steam', label: 'Steam' },
  custom: { className: 'chip-custom', label: 'Custom' }
};

export function GameCard({ game, isFavorite = false, onToggleFavorite, onClick, index = 0 }: GameCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isFlash = game.genres?.some((g) => g.toLowerCase() === 'flash');
  const chip = isFlash
    ? { className: 'chip-flash', label: 'Flash' }
    : SOURCE_CHIP[game.source] || SOURCE_CHIP.webporting;

  // Generated cover art beats a broken-image icon when an upstream thumbnail disappears
  const fallbackCover = `/api/cover/${encodeURIComponent(game.id)}?title=${encodeURIComponent(game.title)}`;

  return (
    <button
      type="button"
      style={{ animationDelay: `${Math.min(index, 12) * 15}ms` }}
      onClick={() => onClick(game)}
      aria-label={`Play ${game.title}`}
      className="panel panel-hover card-enter group relative text-left overflow-hidden flex flex-col focus:outline-none focus-visible:border-volt"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-pit">
        <img
          src={imageFailed ? fallbackCover : game.thumbnail}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
        />

        {/* Base scrim keeps the badges legible; the tinted wash only appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-void/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-volt/45 via-transparent to-beam/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play affordance on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/95 text-void shadow-[0_14px_36px_-10px_rgba(0,0,0,0.9)] ring-4 ring-white/15">
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </span>
        </div>

        <span className={`chip ${chip.className} absolute top-2.5 left-2.5`}>{chip.label}</span>

        {onToggleFavorite && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? 'Remove from My Arcade' : 'Add to My Arcade'}
            onClick={(e) => onToggleFavorite(e, game.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(e as unknown as React.MouseEvent, game.id);
              }
            }}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center border backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-punch/25 border-punch/55 text-punch'
                : 'bg-black/45 border-white/10 text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-white hover:border-white/30'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        )}
      </div>

      <div className="px-3.5 py-3 flex flex-col gap-1.5">
        <h3 className="font-display text-[13.5px] font-semibold text-zinc-100 truncate group-hover:text-white">
          {game.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] text-zinc-500 truncate">
            {game.genres.filter((g) => g.toLowerCase() !== 'flash').slice(0, 2).join(' · ') || 'Arcade'}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 flex-shrink-0">
            <Star className="w-2.5 h-2.5 text-amber" fill="currentColor" />
            {(game.rating || 5).toFixed(1)}
          </span>
        </div>
      </div>
    </button>
  );
}
