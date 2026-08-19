import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, UserAccount, GameSave, GameMirror } from '../types';
import {
  ExternalLink,
  MonitorPlay,
  Tv,
  Save,
  Download,
  AlertTriangle,
  Plus,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotFoundPanel } from './NotFoundPanel';
import { useEscapeKey, useFullscreen } from '../lib/hooks';
import { isFlashGame } from '../lib/games';

interface PlayerModalProps {
  game: Game | null;
  onClose: (elapsedSeconds: number) => void;
  currentUser?: UserAccount | null;
  /** Separate origin games are framed from; empty falls back to same-origin. */
  gameOrigin?: string;
}

export function PlayerModal({ game, onClose, currentUser, gameOrigin = '' }: PlayerModalProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isCrtMode, setIsCrtMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [show404Panel, setShow404Panel] = useState(false);

  // Mirrors state
  const [selectedMirrorId, setSelectedMirrorId] = useState<string>('');
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>('');
  const [iframeKey, setIframeKey] = useState(0);

  // The stage is what goes fullscreen, so the game fills the display without the chrome
  const stageRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(stageRef);

  // --- Game state bridge -------------------------------------------------------------
  // Game frames are sandboxed into an opaque origin, so their own localStorage is gone.
  // The frame's storage is proxied here instead: seeded on load, persisted on change.
  const frameRef = useRef<HTMLIFrameElement>(null);
  const gameState = useRef<Record<string, string>>({});
  const stateLoaded = useRef(false);
  const seedSent = useRef(false);
  const autoSaveId = useRef<string | null>(null);
  const [stateStatus, setStateStatus] = useState<'idle' | 'restored' | 'saving' | 'saved'>('idle');
  // Read by the save bridge without being one of its dependencies: the timer ticks every
  // second, and re-subscribing the message listener that often is pure overhead mid-game.
  const elapsedRef = useRef(0);
  const [frameError, setFrameError] = useState<string | null>(null);
  // Some browsers and privacy extensions refuse to embed a second loopback origin. When
  // that happens the game frame is simply never reachable, so the player falls back to the
  // hub's own origin rather than showing a black rectangle.
  const [isolationBlocked, setIsolationBlocked] = useState(false);
  const frameSpokeUp = useRef(false);

  /*
   * Save slots are a Flash-only feature. Ruffle titles are the ones whose progress this hub
   * can meaningfully snapshot and restore; the Unity and HTML5 webports keep their own
   * state in ways the storage bridge does not fully capture, so offering them a slot would
   * promise a restore that does not survive.
   *
   * The frame storage bridge itself stays on for every game — that is what makes a
   * sandboxed game keep its progress at all within this browser, not a save slot.
   */
  const canSave = isFlashGame(game);

  const localStateKey = game ? `flashhub-game-state:${game.id}` : '';
  const AUTO_SLOT = 'Progress (auto)';

  // Save Keeper state
  const [gameSaves, setGameSaves] = useState<GameSave[]>([]);
  const [slotName, setSlotName] = useState('Slot 1');
  const [saveNotes, setSaveNotes] = useState('');
  const [saveScore, setSaveScore] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Generate complete list of mirrors for this game
  const availableMirrors = useMemo<GameMirror[]>(() => {
    if (!game) return [];
    
    if (game.mirrors && game.mirrors.length > 0) {
      return game.mirrors;
    }

    const mirrors: GameMirror[] = [];

    // If game has embedUrl
    if (game.embedUrl) {
      if (game.embedUrl.includes('archive.org')) {
        // Offer Ruffle WASM as primary replacement for Archive outages
        mirrors.push({
          id: 'ruffle-wasm',
          name: 'Ruffle',
          type: 'ruffle',
          url: game.swfUrl
            ? `/play.html?title=${encodeURIComponent(game.title)}&swf=${encodeURIComponent(game.swfUrl)}&autoplay=1`
            : `/play.html?title=${encodeURIComponent(game.title)}`,
          isArchiveIndependent: true
        });
        mirrors.push({
          id: 'archive-org',
          name: 'Archive.org',
          type: 'archive',
          url: game.embedUrl,
          isArchiveIndependent: false
        });
      } else {
        mirrors.push({
          id: 'primary-webport',
          name: 'Web port',
          type: 'webport',
          url: game.embedUrl,
          isArchiveIndependent: true
        });
      }
    }

    // Always include Custom Ruffle File Player fallback
    mirrors.push({
      id: 'local-ruffle',
      name: 'Your own file',
      type: 'custom',
      url: `/play.html?title=${encodeURIComponent(game.title)}`,
      isArchiveIndependent: true
    });

    return mirrors;
  }, [game]);

  // Set initial mirror on game load
  useEffect(() => {
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setShow404Panel(false);

    if (game) {
      // If the primary embed is archive.org and user needs reliability, we check available mirrors
      const defaultMirror = availableMirrors[0];
      if (defaultMirror) {
        setSelectedMirrorId(defaultMirror.id);
        setCurrentEmbedUrl(defaultMirror.url);
      } else {
        setCurrentEmbedUrl(game.embedUrl);
      }
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        elapsedRef.current = prev + 1;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.id, availableMirrors]);

  // Load saves for this game
  const fetchGameSaves = () => {
    if (!game?.id || !canSave) return;
    const userIdQuery = currentUser?.id ? `userId=${encodeURIComponent(currentUser.id)}&` : '';
    fetch(`/api/saves?${userIdQuery}gameId=${encodeURIComponent(game.id)}`)
      .then(res => res.ok ? res.json() : { status: 'error', data: [] })
      .then(d => {
        if (d && d.status === 'ok') setGameSaves(d.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    setGameSaves([]);
    fetchGameSaves();
  }, [game?.id, currentUser?.id, canSave]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pull the player's stored progress for this game: their account when signed in,
  // otherwise this browser, so guests keep their saves too.
  useEffect(() => {
    if (!game) return;

    let cancelled = false;
    stateLoaded.current = false;
    seedSent.current = false;
    setFrameError(null);
    autoSaveId.current = null;
    gameState.current = {};
    setStateStatus('idle');

    const readLocal = (): Record<string, string> => {
      try {
        const raw = window.localStorage.getItem(localStateKey);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    const load = async () => {
      let state = readLocal();

      if (currentUser?.id && canSave) {
        try {
          const res = await fetch(`/api/saves?gameId=${encodeURIComponent(game.id)}`);
          if (res.ok) {
            const d = await res.json();
            const auto = (d.data || []).find((entry: GameSave) => entry.slotName === AUTO_SLOT);
            if (auto) {
              autoSaveId.current = auto.id;
              try {
                const parsed = JSON.parse(auto.saveData);
                // The account copy wins: it is the one that follows the player across devices
                if (parsed && typeof parsed === 'object') state = parsed;
              } catch { /* corrupt slot, fall back to the local copy */ }
            }
          }
        } catch { /* offline: the local copy still works */ }
      }

      if (cancelled) return;
      gameState.current = state;
      stateLoaded.current = true;
      if (canSave && Object.keys(state).length > 0) setStateStatus('restored');
    };

    load();
    return () => { cancelled = true; };
  }, [game?.id, currentUser?.id, canSave]);

  // Talk to the sandboxed frame
  useEffect(() => {
    if (!game) return;

    const persist = async (state: Record<string, string>) => {
      gameState.current = state;

      try {
        window.localStorage.setItem(localStateKey, JSON.stringify(state));
      } catch { /* quota or private mode; the account copy below still applies */ }

      // A non-Flash game still gets its browser mirror — without it the sandboxed frame has
      // no storage at all — but nothing is written to the account and nothing is announced.
      if (!canSave) return;

      if (!currentUser?.id) {
        setStateStatus('saved');
        return;
      }

      setStateStatus('saving');
      try {
        const res = await fetch('/api/saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: autoSaveId.current || undefined,
            gameId: game.id,
            gameTitle: game.title,
            userId: currentUser.id,
            slotName: AUTO_SLOT,
            saveData: JSON.stringify(state),
            playtimeMinutes: Math.round(elapsedRef.current / 60),
            notes: 'Captured from the game automatically'
          })
        });
        const d = await res.json();
        if (res.ok && d.status === 'ok') {
          autoSaveId.current = d.data.id;
          setStateStatus('saved');
        } else {
          setStateStatus('idle');
        }
      } catch {
        setStateStatus('idle');
      }
    };

    const onMessage = (event: MessageEvent) => {
      // A sandboxed frame has a null origin, so identify it by its window instead
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      frameSpokeUp.current = true;

      if (msg.type === 'flashhub:storage-request') {
        const send = () => {
          frameRef.current?.contentWindow?.postMessage(
            { type: 'flashhub:storage-data', data: gameState.current },
            '*'
          );
          seedSent.current = true;
        };
        // Answer once the saved state is in hand, so nothing boots on a blank slate
        if (stateLoaded.current) send();
        else {
          const waitFor = setInterval(() => {
            if (stateLoaded.current) {
              clearInterval(waitFor);
              send();
            }
          }, 120);
          setTimeout(() => { clearInterval(waitFor); if (!seedSent.current) send(); }, 3000);
        }
        return;
      }

      if (msg.type === 'flashhub:frame-error') {
        // Keep the last failure so the diagnostics panel can explain a blank game screen
        console.warn('[FlashHub] Game frame error:', msg.message, msg.detail || '');
        setFrameError(String(msg.message || 'The game reported an error'));
        return;
      }

      if (msg.type === 'flashhub:storage-changed' && msg.data && typeof msg.data === 'object') {
        // Ignore writes from a frame that never received our seed: it would overwrite a
        // real save with whatever the game started from.
        if (!seedSent.current) return;
        persist(msg.data as Record<string, string>);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [game?.id, currentUser?.id, localStateKey, canSave]);

  // Watch for the frame checking in. Every game document this app serves carries the
  // storage bridge, so silence means the frame never ran.
  useEffect(() => {
    if (!game || !gameOrigin || isolationBlocked) return;
    if (!(currentEmbedUrl || game.embedUrl).startsWith('/')) return;

    frameSpokeUp.current = false;
    const timer = setTimeout(() => {
      if (!frameSpokeUp.current) {
        console.warn(
          `[FlashHub] No response from the isolated game origin (${gameOrigin}); ` +
          'falling back to same-origin so the game can run.'
        );
        setIsolationBlocked(true);
        // Remount rather than re-point: an iframe whose navigation was refused does not
        // reliably load a new document when only its src changes.
        setIframeKey(k => k + 1);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [game?.id, gameOrigin, isolationBlocked, currentEmbedUrl, iframeKey]);

  const handleClose = () => {
    onClose(elapsedSeconds);
  };

  useEscapeKey(handleClose);

  if (!game) return null;

  const handleSelectMirror = (m: GameMirror) => {
    setSelectedMirrorId(m.id);
    setCurrentEmbedUrl(m.url);
    setIframeKey(k => k + 1);
  };

  // Perform quick save
  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !canSave) return;

    if (Object.keys(gameState.current).length === 0) {
      setSaveMessage('Nothing to save yet — play until the game writes its progress.');
      setTimeout(() => setSaveMessage(''), 4000);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        gameId: game.id,
        gameTitle: game.title,
        userId: currentUser?.id || 'guest',
        slotName: slotName || 'Quick Save',
        // The slot carries the game's own storage, which is the only thing that can be
        // loaded back. Everything about the session goes in the columns built for it.
        saveData: JSON.stringify(gameState.current),
        playtimeMinutes: Math.round(elapsedSeconds / 60),
        highScore: saveScore ? Number(saveScore) : undefined,
        notes: saveNotes
      };

      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const d = await res.json();
      if (res.ok && d.status === 'ok') {
        let successMsg = `Saved to "${payload.slotName}".`;
        if (d.newlyEarned && d.newlyEarned.length > 0) {
          successMsg += ` You earned ${d.newlyEarned.length} achievement(s)!`;
        }
        setSaveMessage(successMsg);
        setTimeout(() => setSaveMessage(''), 3500);
        fetchGameSaves();
      } else {
        setSaveMessage(d.error || 'Could not commit save state');
        setTimeout(() => setSaveMessage(''), 3500);
      }
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * A slot holds a mirror of the game's own localStorage, so every value is a string.
   * Slots written before saves captured game state hold session metadata instead (with a
   * numeric `sessionSeconds`), which would boot the game onto nonsense — those are refused.
   */
  const readSlotState = (save: GameSave): Record<string, string> | null => {
    try {
      const parsed = JSON.parse(save.saveData);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      const entries = Object.entries(parsed);
      if (entries.length === 0) return null;
      if (!entries.every(([, v]) => typeof v === 'string')) return null;
      return parsed as Record<string, string>;
    } catch {
      return null;
    }
  };

  /**
   * Put a slot back into the game. The frame asks for its storage on boot, so the state is
   * swapped in and the frame remounted — it then reads the slot instead of what it had.
   */
  const handleLoadSave = (save: GameSave) => {
    if (!canSave) return;
    const state = readSlotState(save);
    if (!state) {
      setSaveMessage('That slot holds no game state and cannot be loaded.');
      setTimeout(() => setSaveMessage(''), 4000);
      return;
    }

    gameState.current = state;
    stateLoaded.current = true;
    // The frame is about to be replaced; until the new one is seeded, ignore its writes so
    // a booting game cannot overwrite the slot that was just loaded.
    seedSent.current = false;

    try {
      window.localStorage.setItem(localStateKey, JSON.stringify(state));
    } catch { /* quota or private mode; the frame is still seeded from memory */ }

    setStateStatus('restored');
    setShow404Panel(false);
    setIframeKey(k => k + 1);
    setSaveMessage(`Loaded "${save.slotName}".`);
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const isCurrentArchive = currentEmbedUrl.includes('archive.org');

  // Relative URLs are served by this app, so they move to the isolated game origin.
  // Everything the game then loads resolves against that origin too.
  const useIsolatedOrigin = !!gameOrigin && !isolationBlocked;
  const toFrameUrl = (url: string) =>
    useIsolatedOrigin && url.startsWith('/') ? gameOrigin + url : url;
  const frameSrc = toFrameUrl(currentEmbedUrl || game.embedUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isTheaterMode ? 'bg-ink p-0' : 'bg-ink/70 p-0 sm:p-6'
        }`}
        onClick={handleClose}
      >
        {/*
          1e — ink surround. The player is the one place the system inverts: the game is the
          only lit thing on the page, so everything around it goes to ink and the metadata
          moves into a fixed sidecar rail rather than sitting under the frame.
        */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className={`bg-ink text-paper overflow-hidden flex flex-col ${
            isTheaterMode ? 'w-full h-full' : 'w-full max-w-6xl h-full sm:h-[min(88dvh,940px)] border-2 border-ink'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Masthead */}
          <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 border-b-2 border-rule-lit flex-shrink-0">
            <span className="font-display text-[16px] font-extrabold leading-none tracking-[-0.02em] hidden sm:block">
              FLASHHUB
            </span>
            <span className="font-display text-[12px] font-semibold truncate">{game.title}</span>
            <span className="hidden md:block font-mono text-[11px] text-paper/50 uppercase truncate">
              {game.source} · {game.genres.filter(g => g.toLowerCase() !== 'flash')[0] || 'Arcade'}
            </span>

            <div className="ml-auto flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <span className="font-mono text-[11px] text-paper/50 tabular-nums">
                {formatTimer(elapsedSeconds)}
              </span>
              {canSave && stateStatus !== 'idle' && (
                <span
                  className="hidden lg:block font-mono text-[11px] text-paper/50 uppercase"
                  title={
                    currentUser
                      ? "This game's progress is stored on your account"
                      : 'Progress is stored in this browser. Sign in to carry it across devices.'
                  }
                >
                  {stateStatus === 'restored' && 'Progress restored'}
                  {stateStatus === 'saving' && 'Saving…'}
                  {stateStatus === 'saved' && 'Progress saved'}
                </span>
              )}
              <button
                onClick={handleClose}
                className="font-display text-[11px] font-extrabold tracking-[0.06em] text-accent-lit hover:text-paper transition-colors"
              >
                EXIT TO CATALOGUE
              </button>
            </div>
          </div>

          {/* Stage + sidecar */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_300px]">
            {/* Stage */}
            <div className="flex flex-col min-h-0 border-r-0 lg:border-r-2 border-rule-lit p-4 sm:p-5 gap-3.5">
              <div ref={stageRef} className="relative flex-1 min-h-[240px] bg-black flex items-center justify-center overflow-hidden">
                {show404Panel ? (
                  <div className="w-full h-full overflow-y-auto bg-ground p-4">
                    <NotFoundPanel
                      errorTitle={`Port diagnostics: ${game.title}`}
                      errorMessage="If this cartridge fails to boot in the player window, switch runtimes in the rail or drag your own SWF file directly."
                      targetId={game.id}
                      onGoHome={() => setShow404Panel(false)}
                      onRandomGame={() => {
                        setShow404Panel(false);
                        onClose(0);
                      }}
                      onRetry={() => {
                        setShow404Panel(false);
                        setIframeKey(k => k + 1);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {isCrtMode && <div className="absolute inset-0 pointer-events-none z-10 crt-overlay mix-blend-overlay opacity-30" />}
                    {isCrtMode && <div className="absolute inset-0 pointer-events-none z-20 scanlines opacity-10" />}
                    {game.source === 'steam' ? (
                      <iframe
                        key={iframeKey}
                        src={frameSrc}
                        frameBorder="0"
                        width="646"
                        height="190"
                        allow="autoplay; fullscreen"
                        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                        className="max-w-full"
                        title={`${game.title} Steam Widget`}
                      />
                    ) : (
                      <iframe
                        key={iframeKey}
                        ref={frameRef}
                        src={frameSrc}
                        frameBorder="0"
                        allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
                        /*
                         * Isolation comes from gameOrigin being a different origin than the
                         * hub, not from dropping allow-same-origin: an opaque sandbox stops
                         * the game's own scripts from running at all.
                         */
                        sandbox={
                          useIsolatedOrigin
                            ? 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock'
                            : 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups allow-presentation allow-orientation-lock'
                        }
                        className="w-full h-full"
                        title={`${game.title} Embed`}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Transport. The accent lands on the one action that writes something. */}
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                {canSave && (
                  <button
                    onClick={handleCreateSave}
                    disabled={isSaving}
                    className="btn-primary h-9 px-3.5 text-[12px]"
                    title="Commit a save slot for this title"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving…' : 'Save state'}
                  </button>
                )}
                <button
                  onClick={() => setIframeKey(k => k + 1)}
                  className="btn-ghost btn-ghost-lit h-9 px-3 text-[12px]"
                  title="Reload the cartridge"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restart
                </button>
                <button
                  onClick={toggleFullscreen}
                  className={`h-9 px-3 text-[12px] ${isFullscreen ? 'btn-primary' : 'btn-ghost btn-ghost-lit'}`}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
                <button
                  onClick={() => setIsCrtMode(!isCrtMode)}
                  className={`h-9 px-3 text-[12px] ${isCrtMode ? 'btn-primary' : 'btn-ghost btn-ghost-lit'}`}
                  title="Toggle retro CRT scanlines"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CRT</span>
                </button>
                <button
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`h-9 px-3 text-[12px] ${isTheaterMode ? 'btn-primary' : 'btn-ghost btn-ghost-lit'}`}
                  title="Toggle theater mode"
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Theater</span>
                </button>
                <button
                  onClick={() => setShow404Panel(!show404Panel)}
                  className={`h-9 w-9 justify-center ${show404Panel ? 'btn-primary' : 'btn-ghost btn-ghost-lit'}`}
                  title="Port diagnostics"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                <a
                  href={currentEmbedUrl || game.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-ghost-lit h-9 w-9 justify-center"
                  title="Open in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {saveMessage && (
                  <span className="ml-auto font-mono text-[11px] text-accent-lit truncate max-w-[240px]">
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Sidecar rail */}
            <aside className="overflow-y-auto border-t-2 lg:border-t-0 border-rule-lit">
              {/* Runtime & mirrors */}
              <div className="px-5 py-4 border-b border-hair-lit">
                <div className="eyebrow eyebrow-lit mb-2.5">Runtime</div>
                <div className="flex flex-col gap-2">
                  {availableMirrors.map((m) => {
                    const isActive = selectedMirrorId === m.id || currentEmbedUrl === m.url;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMirror(m)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                          isActive
                            ? 'border border-rule-lit'
                            : 'border border-hair-lit hover:bg-paper/10'
                        }`}
                      >
                        {isActive ? (
                          <span className="chip chip-accent flex-shrink-0">Active</span>
                        ) : (
                          <span className="font-mono text-[11px] text-paper/45 flex-shrink-0">ALT</span>
                        )}
                        <span className={`text-[12px] truncate ${isActive ? 'font-semibold' : 'text-paper/75'}`}>
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isCurrentArchive && (
                  <button
                    onClick={() => {
                      const nonArchive = availableMirrors.find(m => m.isArchiveIndependent);
                      if (nonArchive) handleSelectMirror(nonArchive);
                    }}
                    className="mt-2.5 font-display text-[11px] font-extrabold text-accent-lit hover:text-paper transition-colors"
                  >
                    Try a different runtime →
                  </button>
                )}
                {isolationBlocked && (
                  <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-paper/45">
                    This browser refused a separate game origin; running on the hub's origin.
                  </p>
                )}
                {frameError && (
                  <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-accent-lit">
                    {frameError}
                  </p>
                )}
              </div>

              {canSave ? (
                <>
                  {/* Cloud saves */}
                  <div className="px-5 py-4 border-b border-hair-lit">
                    <div className="eyebrow eyebrow-lit mb-2.5">
                      Saves · {gameSaves.length} slot{gameSaves.length === 1 ? '' : 's'}
                    </div>
                    {gameSaves.length === 0 ? (
                      <p className="text-[12px] text-paper/45">No save states stored for this cartridge.</p>
                    ) : (
                      <div className="flex flex-col">
                        {gameSaves.map(s => {
                          const loadable = readSlotState(s) !== null;
                          return (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-2 py-2 border-b border-hair-lit last:border-b-0"
                            >
                              <div className="min-w-0">
                                <div className="text-[12px] font-semibold truncate">{s.slotName}</div>
                                <div className="text-[11px] text-paper/45 truncate">
                                  {new Date(s.timestamp).toLocaleDateString()}
                                  {s.notes ? ` · ${s.notes}` : ''}
                                  {!loadable && ' · no state'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleLoadSave(s)}
                                  disabled={!loadable}
                                  className="font-display text-[11px] font-extrabold text-accent-lit hover:text-paper disabled:text-paper/25 disabled:cursor-not-allowed transition-colors"
                                  title={
                                    loadable
                                      ? 'Restart the game from this slot'
                                      : 'This slot was written before saves captured game state'
                                  }
                                >
                                  LOAD
                                </button>
                                <button
                                  onClick={() => {
                                    const blob = new Blob([s.saveData], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${game.title}_${s.slotName}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="text-paper/50 hover:text-paper transition-colors"
                                  title="Download JSON save"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* New slot */}
                  <form onSubmit={handleCreateSave} className="px-5 py-4">
                    <div className="eyebrow eyebrow-lit mb-2.5">New slot</div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Slot name"
                        value={slotName}
                        onChange={e => setSlotName(e.target.value)}
                        className="w-full bg-transparent border border-rule-lit px-2.5 py-2 text-[12px] text-paper placeholder:text-paper/40 outline-none focus:border-accent-lit"
                      />
                      <input
                        type="number"
                        placeholder="Score / checkpoint"
                        value={saveScore}
                        onChange={e => setSaveScore(e.target.value)}
                        className="w-full bg-transparent border border-rule-lit px-2.5 py-2 text-[12px] text-paper placeholder:text-paper/40 outline-none focus:border-accent-lit"
                      />
                      <input
                        type="text"
                        placeholder="Notes"
                        value={saveNotes}
                        onChange={e => setSaveNotes(e.target.value)}
                        className="w-full bg-transparent border border-rule-lit px-2.5 py-2 text-[12px] text-paper placeholder:text-paper/40 outline-none focus:border-accent-lit"
                      />
                      <button type="submit" disabled={isSaving} className="btn-primary h-9 px-3.5 text-[12px]">
                        <Plus className="w-3.5 h-3.5" />
                        {isSaving ? 'Committing…' : 'Commit slot'}
                      </button>
                    </div>
                    {!currentUser && (
                      <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-paper/45">
                        Signed out — slots stay in this browser.
                      </p>
                    )}
                  </form>
                </>
              ) : (
                /* Ruffle titles are the ones this hub can snapshot and restore, so a
                   webport says so plainly rather than offering a slot that would not
                   survive a reload. */
                <div className="px-5 py-4">
                  <div className="eyebrow eyebrow-lit mb-2.5">Saves</div>
                  <p className="text-[12px] leading-relaxed text-paper/45">
                    Save slots are available on Flash titles only. This game keeps its own
                    progress in this browser while you play, but it cannot be committed to a
                    slot or carried to another machine.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
