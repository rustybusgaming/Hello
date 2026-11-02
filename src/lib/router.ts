import { useCallback, useEffect, useState } from 'react';

/**
 * A small hash router. The app is one page served by Express, and hash routes need nothing
 * from the server, keep the back button working, and survive a reload.
 *
 *   #/                     Home
 *   #/library[/<tab>]      Library: all | flashhub | steam | favourites | recent
 *   #/game/<key>           A game's page (key = Flashhub id or steam:<appId>)
 *   #/diagnostics          Catalogue diagnostics
 */

export type LibraryTab = 'all' | 'flashhub' | 'steam' | 'favourites' | 'recent';
export const LIBRARY_TABS: LibraryTab[] = ['all', 'flashhub', 'steam', 'favourites', 'recent'];

export type Route =
  | { name: 'home' }
  | { name: 'library'; tab: LibraryTab }
  | { name: 'game'; key: string }
  | { name: 'diagnostics' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0];
  const [head, ...rest] = path.split('/');
  if (head === 'library') {
    const tab = rest[0] as LibraryTab;
    return { name: 'library', tab: LIBRARY_TABS.includes(tab) ? tab : 'all' };
  }
  if (head === 'game' && rest.length) {
    return { name: 'game', key: decodeURIComponent(rest.join('/')) };
  }
  if (head === 'diagnostics') return { name: 'diagnostics' };
  return { name: 'home' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'library':
      return route.tab === 'all' ? '#/library' : `#/library/${route.tab}`;
    case 'game':
      return `#/game/${encodeURIComponent(route.key)}`;
    case 'diagnostics':
      return '#/diagnostics';
  }
}

export function gameHref(key: string): string {
  return hrefFor({ name: 'game', key });
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    const href = hrefFor(next);
    if (window.location.hash !== href) window.location.hash = href;
    else setRoute(next);
  }, []);

  return { route, navigate };
}
