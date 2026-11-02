import { createContext, useContext } from 'react';
import { UserAccount } from '../types';
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

  steam: SteamLibraryState;
  reloadSteam: () => void;

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
