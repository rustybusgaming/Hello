import { LibraryEntry } from './library';
import { PlayHistory } from './playHistory';

/**
 * "Because you played …" suggestions.
 *
 * Every suggestion has a reason a player can check: a game they really played (a Flashhub
 * session, or Steam's own record of playing it) and the genres the suggestion shares with it.
 * Nothing is scored from invented signals. Steam games bring their genres from the Steam store;
 * one whose store genres are not known is simply not used as a seed.
 */

export interface Recommendation {
  seed: LibraryEntry;
  /** The genres the seed and every suggestion share, in the seed's order */
  sharedGenres: string[];
  games: LibraryEntry[];
}

// Store genres that say how a game is sold rather than what it is like
const IGNORED_GENRES = new Set(['indie', 'free to play', 'early access', 'casual', 'massively multiplayer', 'utilities']);

const norm = (g: string) => g.trim().toLowerCase();

export function meaningfulGenres(genres: string[]): string[] {
  return genres.filter(g => !IGNORED_GENRES.has(norm(g)));
}

export function recommend({
  seeds,
  candidates,
  history,
  genresOf,
  perSeed = 6,
  maxSeeds = 2
}: {
  /** Played games, most recent first: Flashhub and Steam */
  seeds: LibraryEntry[];
  /** Games that can be suggested: Flashhub games the player can start right here */
  candidates: LibraryEntry[];
  history: PlayHistory;
  /** A seed's genres: its catalogue genres, or for a Steam game, its store genres when known */
  genresOf: (entry: LibraryEntry) => string[];
  perSeed?: number;
  maxSeeds?: number;
}): Recommendation[] {
  const played = new Set(Object.keys(history));
  const used = new Set<string>();
  const out: Recommendation[] = [];

  for (const seed of seeds) {
    if (out.length >= maxSeeds) break;
    const seedGenres = meaningfulGenres(genresOf(seed));
    if (!seedGenres.length) continue;
    const wanted = new Set(seedGenres.map(norm));

    const scored = candidates
      .map((entry, index) => {
        const shared = entry.genres.filter(g => wanted.has(norm(g)));
        return { entry, index, shared };
      })
      .filter(x => x.shared.length > 0 && x.entry.key !== seed.key && !played.has(x.entry.key) && !used.has(x.entry.key))
      // Most genres in common first; then what is being played on the hub this month; then the
      // catalogue's own order, so the list is stable from one visit to the next
      .sort((a, b) => b.shared.length - a.shared.length || (b.entry.plays?.recent ?? 0) - (a.entry.plays?.recent ?? 0) || a.index - b.index)
      .slice(0, perSeed);

    // A row of one or two looks like a mistake; a seed needs a handful of honest matches
    if (scored.length < 3) continue;
    scored.forEach(x => used.add(x.entry.key));
    const sharedAll = seedGenres.filter(g => scored.some(x => x.shared.some(s => norm(s) === norm(g))));
    out.push({ seed, sharedGenres: sharedAll, games: scored.map(x => x.entry) });
  }

  return out;
}
