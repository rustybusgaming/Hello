import { createContext, useContext } from 'react';
import { GameCollection, UserAccount } from '../types';
import { LibraryEntry } from './library';
import { PlayHistory } from './playHistory';
import { SteamLibraryState } from './useSteamLibrary';

/** Everything the library screens share, provided once by App. */
export interface LibraryContextValue {
  /** Flashhub's catalogue followed by the player's Steam games */
  entries: LibraryEntry[];
  byKey: Map<string, LibraryEntry>;
  /** Steam app id -> the player's Steam entry, for "also in your Steam library" */
  ownedSteam: Map<number, LibraryEntry>;
  loading: boolean;
  loadError: boolean;
  reloadCatalogue: () => void;

  favourites: string[];
  isFavourite: (key: string) => boolean;
  toggleFavourite: (key: string) => void;

  history: PlayHistory;
  /** Library keys by last play, newest first, Flashhub and Steam merged */
  recentKeys: string[];
  /** Take a Flashhub game out of recently played (Steam's own record is Steam's) */
  removeFromHistory: (key: string) => Promise<void>;

  /** The player's collections (empty when signed out: collections live on the account) */
  collections: GameCollection[];
  createCollection: (name: string, keys?: string[]) => Promise<GameCollection>;
  renameCollection: (id: string, name: string) => Promise<void>;
  setCollectionKeys: (id: string, keys: string[]) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  /** When the catalogue's dates start: games older than this have no date added */
  catalogueSince: string | null;

  steam: SteamLibraryState;
  /** Ask Steam again; `force` skips the server's five-minute cache (at most once a minute) */
  reloadSteam: (force?: boolean) => void;
  /** Go to Steam to link or confirm the account (signed in), or open sign-in (signed out) */
  linkSteam: () => void;

  currentUser: UserAccount | null;
  openAccount: () => void;
  /** Starts a Flashhub game in the player; Steam entries are links, not this */
  play: (entry: LibraryEntry) => void;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used inside LibraryContext');
  return value;
}
