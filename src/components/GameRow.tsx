import React from 'react';
import { Heart } from 'lucide-react';
import { LibraryEntry, formatMinutes, formatSeconds, formatWhen } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { gameHref } from '../lib/router';
import { GameArt } from './GameArt';
import { LaunchButton } from './LaunchButton';

/**
 * The library's list view: one game per row with what a launcher's list needs to compare —
 * where it launches, its kind, when it was last played and for how long. Played time is the
 * player's own: Flashhub sessions measured here, Steam playtime as Steam reports it.
 */
export function GameRow({ entry }: { entry: LibraryEntry }) {
  const { history, isFavourite, toggleFavourite } = useLibrary();
  const record = history[entry.key];
  const favourite = isFavourite(entry.key);

  const lastPlayed = entry.launch === 'steam' ? formatWhen(entry.steam?.lastPlayedAt) : formatWhen(record?.lastPlayedAt);
  const played =
    entry.launch === 'steam'
      ? formatMinutes(entry.steam?.playtimeMinutes ?? 0)
      : record && record.totalSeconds > 0
        ? formatSeconds(record.totalSeconds)
        : null;

  return (
    <li className="group relative grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-hair py-3 md:grid-cols-[64px_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_96px_80px_auto]">
      <div className="art-frame aspect-[4/3] w-16">
        <GameArt entry={entry} />
      </div>

      <div className="min-w-0">
        <a
          href={gameHref(entry.key)}
          data-nav-item
          className="block truncate text-[14px] font-semibold text-ink outline-none after:absolute after:inset-0 after:content-['']"
        >
          {entry.title}
        </a>
        {/* On a phone the other columns fold into this second line */}
        <p className="mt-0.5 truncate text-[13px] text-faint md:hidden">
          {[entry.launch === 'steam' ? 'Steam' : entry.runtime, lastPlayed, played].filter(Boolean).join(' · ')}
        </p>
      </div>

      <span className="hidden truncate text-[13px] text-muted md:block">
        {entry.launch === 'steam' ? 'Opens in Steam' : `Flashhub · ${entry.runtime}`}
      </span>
      <span className="hidden truncate text-[13px] text-muted md:block">{entry.genres[0] || <span className="text-faint">—</span>}</span>
      <span className="hidden text-right text-[13px] tabular-nums text-muted md:block">{lastPlayed || <span className="text-faint">—</span>}</span>
      <span className="hidden text-right text-[13px] tabular-nums text-muted md:block">{played || <span className="text-faint">—</span>}</span>

      <div className="relative z-10 flex items-center justify-end gap-1 md:w-[176px]">
        <button
          type="button"
          onClick={() => toggleFavourite(entry.key)}
          aria-pressed={favourite}
          aria-label={favourite ? `Remove ${entry.title} from favourites` : `Add ${entry.title} to favourites`}
          className={`btn-quiet h-9 w-9 ${favourite ? 'text-accent-lit hover:text-accent-lit' : ''}`}
        >
          <Heart className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} aria-hidden />
        </button>
        {/* Repeated on every row, so it is the quiet button: red down a whole list is a stripe */}
        <LaunchButton entry={entry} variant="quiet" className="hidden sm:inline-flex" />
      </div>
    </li>
  );
}

/** Column heads for the list view; grey, sentence case, numbers right-aligned. */
export function GameRowHeader() {
  return (
    <div className="hidden grid-cols-[64px_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_96px_80px_auto] gap-x-4 pb-2 text-[12px] text-faint md:grid">
      <span />
      <span>Title</span>
      <span>Launches in</span>
      <span>Genre</span>
      <span className="text-right">Last played</span>
      <span className="text-right">Played</span>
      <span className="w-[176px]" />
    </div>
  );
}
