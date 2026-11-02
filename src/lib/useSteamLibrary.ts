import { useCallback, useEffect, useState } from 'react';
import { SteamOwnedLibrary, UserAccount } from '../types';

/**
 * The linked player's Steam library, in one of a handful of honest states. The library never
 * depends on this: Flashhub's own games render whatever Steam says.
 */
export type SteamLibraryState =
  | { status: 'signed-out' }
  | { status: 'not-linked' }
  | { status: 'loading' }
  | { status: 'needs-key' }
  | { status: 'private'; library: SteamOwnedLibrary }
  | { status: 'ready'; library: SteamOwnedLibrary }
  | { status: 'error'; message: string };

export function useSteamLibrary(user: UserAccount | null) {
  const [state, setState] = useState<SteamLibraryState>({ status: 'signed-out' });
  const steamId = user?.steamId || null;

  const load = useCallback(async (force = false) => {
    if (!user) return setState({ status: 'signed-out' });
    if (!steamId) return setState({ status: 'not-linked' });

    // A refresh keeps the list on screen while Steam answers; a first load shows the skeleton
    setState(prev => (force && (prev.status === 'ready' || prev.status === 'private') ? prev : { status: 'loading' }));
    try {
      const res = await fetch(force ? '/api/steam/owned?refresh=1' : '/api/steam/owned');
      const body = await res.json().catch(() => null);
      if (res.ok && body?.status === 'ok') {
        const library = body.data as SteamOwnedLibrary;
        // Steam hides the list of a private profile, or of a public one whose game details
        // are private; either way the empty list needs explaining, not a blank shelf.
        if (library.games.length === 0 && library.visibility !== 'public') {
          return setState({ status: 'private', library });
        }
        return setState({ status: 'ready', library });
      }
      if (body?.needsLink) return setState({ status: 'not-linked' });
      if (body?.needsKey || body?.configured === false) return setState({ status: 'needs-key' });
      setState({ status: 'error', message: body?.error || 'Steam did not answer' });
    } catch {
      setState({ status: 'error', message: 'Could not reach the server' });
    }
  }, [user, steamId]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback((force = false) => {
    load(force);
  }, [load]);

  return { state, reload };
}
