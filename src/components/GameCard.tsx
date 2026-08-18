import React, { useState } from 'react';
import { Game } from '../types';
import { Heart, Play, Star } from 'lucide-react';
import { motion } from 'motion/react';

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
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 12) * 0.015 }}
      onClick={() => onClick(game)}
      aria-label={`Play ${game.title}`}
      className="panel panel-hover group relative text-left overflow-hidden flex flex-col focus:outline-none focus-visible:border-flame"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-pit">
        <img
          src={imageFailed ? fallbackCover : game.thumbnail}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent" />

        {/* Play affordance on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-flame text-black text-[11px] font-bold shadow-[0_10px_30px_-10px_rgba(255,138,0,1)]">
            <Play className="w-3 h-3" fill="currentColor" />
            PLAY
          </span>
        </div>

        <span className={`chip ${chip.className} absolute top-2 left-2`}>{chip.label}</span>

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
            className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
              isFavorite
                ? 'bg-flame/20 border-flame/50 text-flame'
                : 'bg-black/50 border-white/10 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1">
        <h3 className="font-display text-[13px] font-semibold text-zinc-100 truncate group-hover:text-white">
          {game.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-500 truncate">
            {game.genres.filter((g) => g.toLowerCase() !== 'flash').slice(0, 2).join(' · ') || 'Arcade'}
          </span>
          <span className="flex items-center gap-0.5 font-mono text-[10px] text-zinc-400 flex-shrink-0">
            <Star className="w-2.5 h-2.5 text-flame" fill="currentColor" />
            {(game.rating || 5).toFixed(1)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
