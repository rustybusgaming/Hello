import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Game, UserAccount } from './types';
import { Shell } from './components/Shell';
import { HomeView } from './components/HomeView';
import { LibraryView, LibraryFilters, DEFAULT_FILTERS } from './components/LibraryView';
import { GameDetailView } from './components/GameDetailView';
import { CollectionView } from './components/CollectionView';
import { PlayerModal } from './components/PlayerModal';
import { UploadModal } from './components/UploadModal';
import { AdminPanel } from './components/AdminPanel';
import { AccountModal } from './components/AccountModal';
import { NotFoundPanel } from './components/NotFoundPanel';
import { Timer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/hooks';
import { formatGameInfo } from './utils/gameTitles';
import { LibraryEntry, Runtime, fromGame, fromSteam, formatSeconds } from './lib/library';
import { useAccountLibrary } from './lib/useAccountLibrary';
import { useSteamLibrary } from './lib/useSteamLibrary';
import { LibraryContext, LibraryContextValue } from './lib/libraryContext';
import { useRoute } from './lib/router';
import { useGamepadNavigation } from './lib/navigation';
import { BASE_URL, PREVIEW_MESSAGE, STATIC_PREVIEW } from './lib/preview';

/**
 * Loopback has two names, and they are separate origins to the browser. Framing games from
 * the other one keeps third-party game code away from the hub's cookie and storage without
 * any extra configuration during local development.
 */
function deriveGameOrigin(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  const suffix = port ? `:${port}` : '';
  if (hostname === 'localhost') return `${protocol}//127.0.0.1${suffix}`;
  if (hostname === '127.0.0.1') return `${protocol}//localhost${suffix}`;
  return '';
}

interface SessionRecap {
  title: string;
  seconds: number;
}

/** What came back from Sign in through Steam, read once from the URL Steam returned to. */
function readSteamOutcome(): { ok: boolean; reason: string } | null {
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('steam');
  if (!outcome) return null;
  const reason = params.get('reason') || '';
  // Clean the address bar so a reload does not repeat the message
  params.delete('steam');
  params.delete('reason');
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  return { ok: outcome === 'verified', reason };
}

export default function App() {
  const { route, navigate } = useRoute();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [catalogueSince, setCatalogueSince] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useLocalStorage<LibraryFilters>('flashhub-library-view', DEFAULT_FILTERS);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sessionRecap, setSessionRecap] = useState<SessionRecap | null>(null);
  const recapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollMemory = useRef(0);
  const pendingScrollRestore = useRef(false);

  // Modals & panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // The session itself lives in an httpOnly cookie the browser sends automatically, so nothing
  // here is readable by page or frame scripts.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  // Origin that game frames load from; kept separate from the hub so game code cannot reach
  // the session. Derived locally first so the very first frame already points at the right
  // place, then confirmed by /api/config.
  const [gameOrigin, setGameOrigin] = useState(deriveGameOrigin);
  const [isolationRequired, setIsolationRequired] = useState(false);

  // Favourites, collections and history: the account's when signed in, this browser's when not.
  // Keys are a Flashhub game id (unchanged from earlier builds) or steam:<appId>.
  const account = useAccountLibrary(currentUser);
  const { favourites, history, recentKeys: playedKeys, recordLaunch, finishSession } = account;
  const { state: steam, reload: reloadSteam } = useSteamLibrary(currentUser);

  // Back from Steam: say what happened, in words
  useEffect(() => {
    const outcome = readSteamOutcome();
    if (!outcome) return;
    if (outcome.ok) {
      setNotice({ tone: 'ok', text: 'Steam confirmed your account. Your Steam games are in the library.' });
      return;
    }
    fetch('/api/auth/steam/messages')
      .then(res => (res.ok ? res.json() : null))
      .then(d => setNotice({ tone: 'error', text: d?.data?.[outcome.reason] || 'Steam did not link the account. Try again.' }))
      .catch(() => setNotice({ tone: 'error', text: 'Steam did not link the account. Try again.' }));
  }, []);

  const refreshSession = () => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(d => setCurrentUser(d && d.status === 'ok' && d.user ? d.user : null))
      .catch(() => setCurrentUser(null));
  };

  useEffect(() => {
    // Older builds kept the session token and profile in localStorage, where any same-origin
    // script could read them. Clear those leftovers on first load.
    try {
      window.localStorage.removeItem('flashhub-auth-token');
      window.localStorage.removeItem('flashhub-active-user');
    } catch { /* private mode */ }

    refreshSession();

    fetch('/api/config')
      .then(res => (res.ok ? res.json() : null))
      .then(d => {
        if (d?.gameOrigin) setGameOrigin(d.gameOrigin);
        setIsolationRequired(d?.isolationRequired === true);
        // A game origin on its own host may be asleep (free hosting plans idle out). Knock now,
        // so it is awake by the time someone presses Play. The answer itself is not needed.
        if (d?.isolationRequired && d.gameOrigin) {
          fetch(`${d.gameOrigin}/play.html`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const fetchGames = useCallback(() => {
    setLoadError(false);
    // The Pages preview reads the catalogue snapshot taken when it was built
    fetch(STATIC_PREVIEW ? `${BASE_URL}catalogue.json` : `/api/games?t=${Date.now()}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(data => {
        if (data && data.status === 'ok') {
          const formattedList = (data.data || []).map((g: Game) => {
            const info = formatGameInfo(g.id, g.title, g.genres);
            return {
              ...g,
              title: info.title,
              genres: info.genres && info.genres.length > 0 ? info.genres : g.genres,
              description: g.description || info.description
            };
          });
          // Games hidden from the admin panel never reach the library
          setGames(formattedList.filter((g: Game) => !g.hidden));
          setCatalogueSince(typeof data.catalogueSince === 'string' ? data.catalogueSince : null);
          if (typeof data.isSyncing === 'boolean') setIsSyncing(data.isSyncing);
        }
      })
      .catch(err => {
        console.error('Failed to fetch games:', err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames();
    return () => {
      if (recapTimeout.current) clearTimeout(recapTimeout.current);
    };
  }, [fetchGames]);

  // Poll sync status while a sync runs, then reload the catalogue
  useEffect(() => {
    if (!isSyncing) return;
    const interval = setInterval(() => {
      fetch('/api/sync-status')
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && !data.isSyncing) {
            setIsSyncing(false);
            fetchGames();
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [isSyncing, fetchGames]);

  // --- The unified library -----------------------------------------------------------

  const flashhubEntries = useMemo(() => games.map(fromGame), [games]);
  const steamEntries = useMemo(
    () => (steam.status === 'ready' ? steam.library.games.map(fromSteam) : []),
    [steam]
  );
  const entries = useMemo(() => [...flashhubEntries, ...steamEntries], [flashhubEntries, steamEntries]);
  const byKey = useMemo(() => new Map(entries.map(e => [e.key, e])), [entries]);
  const ownedSteam = useMemo(() => new Map(steamEntries.map(e => [e.steamAppId!, e])), [steamEntries]);

  // One recency order for both worlds: Flashhub sessions timed here, Steam games by Steam's
  // own last-played clock. Untimed entries carried over from older builds go last.
  const recentKeys = useMemo(() => {
    const timed: { key: string; at: string }[] = [];
    playedKeys.forEach(key => {
      const at = history[key]?.lastPlayedAt;
      if (at) timed.push({ key, at });
    });
    steamEntries.forEach(e => {
      if (e.steam?.lastPlayedAt) timed.push({ key: e.key, at: e.steam.lastPlayedAt });
    });
    timed.sort((a, b) => b.at.localeCompare(a.at));
    const untimed = playedKeys.filter(key => !history[key]?.lastPlayedAt);
    return [...timed.map(t => t.key), ...untimed].filter(key => byKey.has(key));
  }, [playedKeys, history, steamEntries, byKey]);

  const toggleFavourite = account.toggleFavourite;

  const play = useCallback(
    (entry: LibraryEntry) => {
      if (entry.launch !== 'flashhub' || !entry.game) return;
      if (STATIC_PREVIEW) return setNotice({ tone: 'error', text: PREVIEW_MESSAGE });
      // Remember where the player was so closing the game puts them back
      scrollMemory.current = window.scrollY;
      setSelectedGame(entry.game);
      recordLaunch(entry.key);
    },
    [recordLaunch]
  );

  const handleRandomGame = () => {
    if (flashhubEntries.length === 0) return;
    play(flashhubEntries[Math.floor(Math.random() * flashhubEntries.length)]);
  };

  const handleCloseModal = (elapsedSeconds: number) => {
    // The sitting goes to this browser's history and to the server, which counts the play
    // and, when signed in, adds it to the account's history and total playtime
    if (selectedGame) {
      finishSession(selectedGame.id, elapsedSeconds).then(result => {
        if (result.user) setCurrentUser(result.user);
      });
    }

    // The <main> is still hidden at this point, so the restore waits for the frame after
    // React has painted the screen back in.
    pendingScrollRestore.current = true;
    if (selectedGame && elapsedSeconds > 0) {
      const recap: SessionRecap = { title: selectedGame.title, seconds: elapsedSeconds };
      setSessionRecap(recap);
      if (recapTimeout.current) clearTimeout(recapTimeout.current);
      recapTimeout.current = setTimeout(() => {
        setSessionRecap(prev => (prev?.title === recap.title && prev?.seconds === recap.seconds ? null : prev));
      }, 6500);
    }
    setSelectedGame(null);
  };

  useEffect(() => {
    if (selectedGame || !pendingScrollRestore.current) return;
    pendingScrollRestore.current = false;
    const target = scrollMemory.current;
    requestAnimationFrame(() => window.scrollTo(0, target));
  }, [selectedGame]);

  // A new screen starts at the top; game pages handle their own scroll
  useEffect(() => {
    if (route.name !== 'game') window.scrollTo(0, 0);
  }, [route.name, route.name === 'library' ? route.tab : '']);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (q && route.name !== 'library') navigate({ name: 'library', tab: 'all' });
    },
    [route.name, navigate]
  );

  const handleBrowse = (filter: { runtime?: Runtime; genre?: string }) => {
    setSearchQuery('');
    setFilters({
      ...DEFAULT_FILTERS,
      view: filters.view,
      runtime: filter.runtime && filter.runtime !== 'Steam' ? filter.runtime : 'all',
      genre: filter.genre || 'all'
    });
    navigate({ name: 'library', tab: filter.runtime === 'Steam' ? 'steam' : 'all' });
  };

  const anyModalOpen = !!selectedGame || isUploadModalOpen || isAdminModalOpen || isAccountModalOpen;
  useGamepadNavigation(!anyModalOpen);

  const context: LibraryContextValue = {
    entries,
    byKey,
    ownedSteam,
    loading,
    loadError,
    reloadCatalogue: fetchGames,
    favourites,
    isFavourite: key => favourites.includes(key),
    toggleFavourite,
    history,
    recentKeys,
    removeFromHistory: account.removeFromHistory,
    collections: account.collections,
    createCollection: account.createCollection,
    renameCollection: account.renameCollection,
    setCollectionKeys: account.setCollectionKeys,
    deleteCollection: account.deleteCollection,
    catalogueSince,
    steam,
    reloadSteam,
    linkSteam: () => {
      if (STATIC_PREVIEW) setNotice({ tone: 'error', text: PREVIEW_MESSAGE });
      else if (currentUser) window.location.href = '/api/auth/steam/start';
      else setIsAccountModalOpen(true);
    },
    currentUser,
    openAccount: () => (STATIC_PREVIEW ? setNotice({ tone: 'error', text: PREVIEW_MESSAGE }) : setIsAccountModalOpen(true)),
    play
  };

  return (
    <LibraryContext.Provider value={context}>
      <Shell
        route={route}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onRandom={handleRandomGame}
        onUpload={() => (STATIC_PREVIEW ? setNotice({ tone: 'error', text: PREVIEW_MESSAGE }) : setIsUploadModalOpen(true))}
        onAdmin={() => setIsAdminModalOpen(true)}
      >
        <main className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-6 sm:px-[29px] lg:pt-8" hidden={!!selectedGame}>
          {selectedGame ? null : route.name === 'home' ? (
            <HomeView onBrowse={handleBrowse} />
          ) : route.name === 'library' ? (
            <LibraryView
              tab={route.tab}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              filters={filters}
              onFilters={setFilters}
            />
          ) : route.name === 'game' ? (
            <GameDetailView entryKey={route.key} />
          ) : route.name === 'collection' ? (
            <CollectionView id={route.id} />
          ) : (
            <div>
              <h1 className="mb-6 text-[20px] font-semibold">Diagnostics</h1>
              <NotFoundPanel
                errorTitle="Catalogue diagnostics"
                errorMessage="Check whether a game, cloud save or custom upload resolves from the catalogue, retry the catalogue, or jump into a random game."
                targetId={searchQuery || 'catalogue'}
                onGoHome={() => navigate({ name: 'home' })}
                onRandomGame={handleRandomGame}
                onRetry={fetchGames}
              />
            </div>
          )}
        </main>
      </Shell>

      {/* The outcome of Sign in through Steam, and the account sync failing */}
      {(notice || account.syncError) && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-40 flex max-w-md items-start gap-3 border border-rule bg-shade py-3 pl-4 pr-2 shadow-[0_12px_32px_rgba(0,0,0,0.5)] lg:left-[236px]"
        >
          <p className="min-w-0 flex-1 text-[13px] leading-5">
            {notice ? notice.text : 'Your account’s library could not be loaded, so this browser’s copy is showing.'}
          </p>
          <button type="button" onClick={() => setNotice(null)} className="btn-quiet h-8 w-8 flex-none" aria-label="Dismiss" hidden={!notice}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Session recap after a game closes */}
      <AnimatePresence>
        {sessionRecap && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            className="fixed bottom-4 right-4 z-40 flex max-w-sm items-center gap-3 border border-rule bg-shade py-3 pl-4 pr-2 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
          >
            <Timer className="h-4 w-4 flex-none text-accent-lit" aria-hidden />
            <p className="min-w-0 truncate text-[13px]">
              <span className="font-semibold">{sessionRecap.title}</span>
              <span className="text-muted"> · {formatSeconds(sessionRecap.seconds)} played</span>
            </p>
            <button type="button" onClick={() => setSessionRecap(null)} className="btn-quiet h-8 w-8 flex-none" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedGame && (
        <PlayerModal
          game={selectedGame}
          onClose={handleCloseModal}
          currentUser={currentUser}
          gameOrigin={gameOrigin}
          isolationRequired={isolationRequired}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} onUploadComplete={fetchGames} isAuthenticated={!!currentUser} />
      )}

      {isAdminModalOpen && (
        <AdminPanel games={games} onClose={() => setIsAdminModalOpen(false)} onRefreshGames={fetchGames} currentUser={currentUser} />
      )}

      {isAccountModalOpen && (
        <AccountModal
          currentUser={currentUser}
          onClose={() => setIsAccountModalOpen(false)}
          onUpdateUser={user => {
            setCurrentUser(user);
          }}
        />
      )}
    </LibraryContext.Provider>
  );
}
