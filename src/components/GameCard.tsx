import React, { useState } from 'react';
import { Game } from '../types';
import { Heart } from 'lucide-react';
import { isFlashGame } from '../lib/games';

interface GameCardProps {
  game: Game;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, gameId: string) => void;
  onClick: (game: Game) => void;
  index?: number;
  showRuntimeBadges?: boolean;
  showRatings?: boolean;
}

/**
 * The runtime a title actually plays under. The mockup carries this as one accent-filled
 * badge rather than a colour per source — the label does the distinguishing, not a hue.
 */
function runtimeOf(game: Game): string {
  if (isFlashGame(game)) return 'RUFFLE';
  if (game.source === 'archive') return 'ARCHIVE';
  if (game.source === 'steam') return 'STEAM';
  if (game.source === 'custom') return 'CUSTOM';
  return 'WEBPORT';
}

/** One cell of the 1b modular grid: hairline-ruled, duotone cover, meta beneath. */
export function GameCard({
  game,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  index = 0,
  showRuntimeBadges = true,
  showRatings = true
}: GameCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // Generated cover art beats a broken-image icon when an upstream thumbnail disappears
  const fallbackCover = `/api/cover/${encodeURIComponent(game.id)}?title=${encodeURIComponent(game.title)}`;
  const genre = game.genres.filter((g) => g.toLowerCase() !== 'flash')[0] || 'Arcade';

  return (
    <button
      type="button"
      style={{ animationDelay: `${Math.min(index, 12) * 12}ms` }}
      onClick={() => onClick(game)}
      aria-label={`Play ${game.title}`}
      className="card-enter row-hover group relative text-left flex flex-col border-r border-b border-hair p-4 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden hatch">
        <img
          src={imageFailed ? fallbackCover : game.thumbnail}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover duotone"
        />

        {/* Nothing floats over the cover until the pointer is on it */}
        <span className="absolute inset-0 flex items-end p-2 bg-ink/0 group-hover:bg-ink/70 transition-colors duration-100">
          <span className="font-display text-[11px] font-extrabold tracking-[0.1em] text-paper opacity-0 group-hover:opacity-100">
            PLAY →
          </span>
        </span>

        {onToggleFavorite && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? 'Remove from shelf' : 'Add to shelf'}
            onClick={(e) => onToggleFavorite(e, game.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(e as unknown as React.MouseEvent, game.id);
              }
            }}
            className={`absolute top-0 right-0 w-7 h-7 flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-accent text-paper'
                : 'bg-paper/90 text-ink opacity-0 group-hover:opacity-100 hover:bg-ink hover:text-paper'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-3">
        <span className="font-display text-[15px] font-semibold truncate">{game.title}</span>
        {showRatings && (
          <span className="font-mono text-[11px] text-ink/55 flex-shrink-0">
            {(game.rating || 5).toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        {showRuntimeBadges && <span className="chip chip-accent">{runtimeOf(game)}</span>}
        <span className="text-[11px] text-ink/55 truncate">{genre}</span>
      </div>
    </button>
  );
}
