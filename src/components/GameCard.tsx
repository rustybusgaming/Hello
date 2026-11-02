import React from 'react';
import { Heart, Play, ExternalLink } from 'lucide-react';
import { LibraryEntry, formatMinutes, steamRunUrl } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { gameHref } from '../lib/router';
import { GameArt } from './GameArt';

interface GameCardProps {
  entry: LibraryEntry;
  /** Replaces the default second line, e.g. "Today · 14 min" in a recently-played row */
  meta?: string;
  eager?: boolean;
  /** A small text action under the card, e.g. "Remove" on a collection page */
  action?: { label: string; onClick: () => void };
}

/** The second line every card carries: what it runs on, or for Steam, how much it was played. */
export function defaultMeta(entry: LibraryEntry): string {
  if (entry.launch === 'steam') {
    const minutes = entry.steam?.playtimeMinutes ?? 0;
    return minutes > 0 ? `Steam · ${formatMinutes(minutes)}` : 'Steam · not played';
  }
  return [entry.runtime, entry.genres[0]].filter(Boolean).join(' · ');
}

/**
 * One game in a grid. The whole card is a link to the game's page; the quick launch and the
 * favourite toggle sit above that link as their own buttons, so nothing interactive is nested
 * inside anything else.
 */
export function GameCard({ entry, meta, eager, action }: GameCardProps) {
  const { isFavourite, toggleFavourite, play } = useLibrary();
  const favourite = isFavourite(entry.key);
  const isSteam = entry.launch === 'steam';

  return (
    <article className="group relative min-w-0">
      <div className="art-frame aspect-[4/3]">
        <GameArt entry={entry} eager={eager} />

        {isSteam && (
          <span className="chip chip-ink pointer-events-none absolute left-2 top-2">Steam</span>
        )}

        <button
          type="button"
          onClick={() => toggleFavourite(entry.key)}
          aria-pressed={favourite}
          aria-label={favourite ? `Remove ${entry.title} from favourites` : `Add ${entry.title} to favourites`}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center transition-[opacity,background-color,color] duration-150 ${
            favourite
              ? 'bg-ground/85 text-accent-lit opacity-100'
              : 'bg-ground/85 text-ink opacity-0 hover:bg-ground focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          <Heart className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} aria-hidden />
        </button>

        {/* Quick launch: the most frequent job, one click from the grid */}
        {isSteam && entry.steamAppId ? (
          <a
            href={steamRunUrl(entry.steamAppId)}
            aria-label={`Open ${entry.title} in Steam`}
            title="Open in Steam"
            className="btn-primary absolute bottom-2 right-2 z-10 h-9 w-9 p-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => play(entry)}
            aria-label={`Play ${entry.title}`}
            title="Play"
            className="btn-primary absolute bottom-2 right-2 z-10 h-9 w-9 p-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden />
          </button>
        )}
      </div>

      <a
        href={gameHref(entry.key)}
        data-nav-item
        className="mt-2.5 block truncate text-[14px] font-semibold leading-5 text-ink outline-none after:absolute after:inset-0 after:content-['']"
      >
        {entry.title}
      </a>
      <p className="mt-0.5 truncate text-[12px] leading-4 text-faint">{meta ?? defaultMeta(entry)}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="relative z-10 mt-1.5 text-[12px] font-semibold text-muted underline decoration-control underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          {action.label}
        </button>
      )}
    </article>
  );
}

/** The flat placeholder a card shows while the catalogue loads: same size, no shimmer. */
export function GameCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/3]" />
      <div className="skeleton mt-2.5 h-4 w-3/4" />
      <div className="skeleton mt-1.5 h-3 w-1/2" />
    </div>
  );
}
