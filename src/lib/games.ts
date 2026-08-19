import { Game } from '../types';

/**
 * Whether a catalogue entry is a Flash title, i.e. one that plays through Ruffle.
 *
 * The `Flash` genre is the marker the whole catalogue agrees on: it is set on the quasar
 * Flash entries and the curated Archive.org items, and `formatGameInfo` preserves it when
 * it rewrites a game's genres — so client and server read the same answer off the same
 * field. Save slots are a Flash-only feature and this is the gate for them.
 */
export function isFlashGame(game: Pick<Game, 'genres'> | undefined | null): boolean {
  return !!game?.genres?.some(g => g.toLowerCase() === 'flash');
}
