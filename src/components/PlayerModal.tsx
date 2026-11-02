import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, UserAccount, GameSave, GameMirror } from '../types';
import {
  ArrowLeft,
  ExternalLink,
  PanelRight,
  Tv,
  Save,
  Download,
  AlertTriangle,
  Plus,
  RefreshCw,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { NotFoundPanel } from './NotFoundPanel';
import { useEscapeKey, useFullscreen, useLocalStorage } from '../lib/hooks';
import { isFlashGame } from '../lib/games';
import { runtimeOf } from '../lib/library';

interface PlayerModalProps {
  game: Game | null;
  onClose: (elapsedSeconds: number) => void;
  currentUser?: UserAccount | null;
  /** Separate origin games are framed from; empty falls back to same-origin. */
  gameOrigin?: string;
  /**
   * The server configured that origin, so isolation is not optional: a slow game origin is
   * waited for (it may be waking up), never swapped for the hub's own origin.
   */
  isolationRequired?: boolean;
}

export function PlayerModal({ game, onClose, currentUser, gameOrigin = '', isolationRequired = false }: PlayerModalProps) {
  // The side panel (runtimes and saves) folds away so the game can have the whole window.
  // Flash titles open with it shown, because that is where their save slots live.
  const [panelOpen, setPanelOpen] = useLocalStorage<boolean>('flashhub-player-panel', true);
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
  // While a required game origin has not answered: 'waking', then 'failed' after 90 seconds
  const [originStatus, setOriginStatus] = useState<'ok' | 'waking' | 'failed'>('ok');
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
      setOriginStatus('ok');

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
    setOriginStatus('ok');
    let giveUp: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      if (!frameSpokeUp.current && isolationRequired) {
        // A configured game origin is never traded for the hub's own: wait for it to wake
        setOriginStatus('waking');
        giveUp = setTimeout(() => {
          if (!frameSpokeUp.current) setOriginStatus('failed');
        }, 90000);
        return;
      }
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

    return () => {
      clearTimeout(timer);
      if (giveUp) clearTimeout(giveUp);
    };
  }, [game?.id, gameOrigin, isolationBlocked, isolationRequired, currentEmbedUrl, iframeKey]);

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

  const runtime = runtimeOf(game);
  const iconButton = 'btn-quiet h-9 w-9 flex-none';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex flex-col bg-ground text-ink"
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${game.title}`}
    >
      {/* One compact bar: back, the game's name, the session, and the controls as icons */}
      <header className="flex h-14 flex-none items-center gap-2 border-b border-hair px-2 sm:gap-3 sm:px-4">
        <button type="button" onClick={handleClose} className="btn-quiet h-9 flex-none gap-2 px-2.5 text-[13px]" aria-label="Back to the library">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Library</span>
        </button>

        <div className="min-w-0 flex-1 border-l border-hair pl-3">
          <p className="truncate text-[14px] font-semibold leading-5">{game.title}</p>
          <p className="truncate text-[12px] leading-4 text-faint">
            {runtime}
            {canSave && stateStatus !== 'idle' && (
              <span title={currentUser ? "This game's progress is stored on your account" : 'Progress is stored in this browser. Sign in to carry it across devices.'}>
                {' · '}
                {stateStatus === 'restored' && 'Progress restored'}
                {stateStatus === 'saving' && 'Saving…'}
                {stateStatus === 'saved' && 'Progress saved'}
              </span>
            )}
          </p>
        </div>

        <span className="hidden flex-none text-[13px] tabular-nums text-muted sm:block" aria-label="Session time">
          {formatTimer(elapsedSeconds)}
        </span>

        <div className="flex flex-none items-center">
          {canSave && (
            <button
              type="button"
              onClick={handleCreateSave}
              disabled={isSaving}
              className="btn-primary mr-1 h-9 px-3 text-[13px]"
              title="Write a save slot for this game"
            >
              <Save className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save'}</span>
            </button>
          )}
          <button type="button" onClick={() => setIframeKey(k => k + 1)} className={iconButton} aria-label="Restart the game" title="Restart">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={toggleFullscreen} className={iconButton} aria-pressed={isFullscreen} aria-label="Fullscreen" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setIsCrtMode(!isCrtMode)} className={`${iconButton} hidden sm:inline-flex`} aria-pressed={isCrtMode} aria-label="CRT scanlines" title="CRT scanlines">
            <Tv className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setShow404Panel(!show404Panel)} className={`${iconButton} hidden sm:inline-flex`} aria-pressed={show404Panel} aria-label="Diagnostics" title="Diagnostics">
            <AlertTriangle className="h-4 w-4" />
          </button>
          <a href={currentEmbedUrl || game.embedUrl} target="_blank" rel="noopener noreferrer" className={`${iconButton} hidden sm:inline-flex`} aria-label="Open in a new tab" title="Open in a new tab">
            <ExternalLink className="h-4 w-4" />
          </a>
          <button type="button" onClick={() => setPanelOpen(!panelOpen)} className={iconButton} aria-pressed={panelOpen} aria-label="Runtimes and saves" title="Runtimes and saves">
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* The stage: the game is the only lit thing on screen */}
        <div ref={stageRef} className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-black">
          {show404Panel ? (
            <div className="h-full w-full overflow-y-auto bg-ground p-4 sm:p-6">
              <NotFoundPanel
                errorTitle={`Diagnostics: ${game.title}`}
                errorMessage="If the game does not start, switch to another way of running it in the side panel, or open it in a new tab."
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
              {isCrtMode && <div className="crt-overlay pointer-events-none absolute inset-0 z-10 opacity-30 mix-blend-overlay" />}
              {isCrtMode && <div className="scanlines pointer-events-none absolute inset-0 z-20 opacity-20" />}
              <iframe
                key={iframeKey}
                ref={frameRef}
                src={frameSrc}
                frameBorder="0"
                allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
                /*
                 * Isolation comes from gameOrigin being a different origin than the hub, not
                 * from dropping allow-same-origin: an opaque sandbox stops the game's own
                 * scripts from running at all.
                 */
                sandbox={
                  useIsolatedOrigin
                    ? 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock'
                    : 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups allow-presentation allow-orientation-lock'
                }
                className="h-full w-full"
                title={game.title}
              />
            </>
          )}
          {/* The game server is separate and may be asleep: say so over the stage while it wakes */}
          {originStatus !== 'ok' && !show404Panel && (
            <div role="status" className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-ground/90 px-6 text-center">
              {originStatus === 'waking' ? (
                <>
                  <p className="text-[16px] font-semibold">Waking the game server…</p>
                  <p className="max-w-[44ch] text-[14px] text-muted">
                    Games run on their own server, kept apart from your account. After a quiet spell it can take up to a minute to start.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[16px] font-semibold">The game server is not answering</p>
                  <p className="max-w-[44ch] text-[14px] text-muted">It may still be starting, or it may be down. Try again in a moment.</p>
                  <button type="button" onClick={() => setIframeKey(k => k + 1)} className="btn-ghost h-9 px-4 text-[13px]">
                    <RefreshCw className="h-4 w-4" aria-hidden /> Try again
                  </button>
                </>
              )}
            </div>
          )}
          {saveMessage && (
            <p role="status" className="absolute bottom-3 left-3 z-30 max-w-[320px] truncate bg-shade px-3 py-2 text-[13px] text-ink">
              {saveMessage}
            </p>
          )}
        </div>

        {/* Side panel: how the game runs, and its saves. Over the stage on small screens. */}
        {panelOpen && (
          <aside
            aria-label="Runtimes and saves"
            className="absolute inset-y-0 right-0 z-40 w-full max-w-[340px] overflow-y-auto border-l border-hair bg-paper shadow-[-16px_0_40px_rgba(0,0,0,0.45)] lg:static lg:w-[320px] lg:shadow-none"
          >
            <div className="flex items-center justify-between px-5 pb-1 pt-4 lg:hidden">
              <p className="text-[14px] font-semibold">Runtimes and saves</p>
              <button type="button" onClick={() => setPanelOpen(false)} className="btn-quiet h-9 w-9" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="border-b border-hair px-5 py-4" aria-labelledby="runtime-heading">
              <h2 id="runtime-heading" className="text-[14px] font-semibold">How it runs</h2>
              <div className="mt-3 flex flex-col gap-1">
                {availableMirrors.map(m => {
                  const isActive = selectedMirrorId === m.id || currentEmbedUrl === m.url;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMirror(m)}
                      aria-pressed={isActive}
                      className={`flex h-10 items-center justify-between gap-3 px-3 text-left text-[13px] transition-colors duration-150 ${
                        isActive ? 'bg-shade text-ink' : 'text-muted hover:bg-shade hover:text-ink'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      {isActive && <span className="flex-none text-[12px] text-accent-lit">Running</span>}
                    </button>
                  );
                })}
              </div>
              {isCurrentArchive && (
                <button
                  type="button"
                  onClick={() => {
                    const nonArchive = availableMirrors.find(m => m.isArchiveIndependent);
                    if (nonArchive) handleSelectMirror(nonArchive);
                  }}
                  className="mt-3 text-[13px] font-semibold text-accent-lit hover:text-ink"
                >
                  Try a different runtime
                </button>
              )}
              {isolationBlocked && (
                <p className="mt-3 text-[12px] leading-relaxed text-faint">
                  This browser refused a separate game origin, so the game runs on the hub's own origin.
                </p>
              )}
              {frameError && <p className="mt-3 text-[12px] leading-relaxed text-accent-lit">{frameError}</p>}
            </section>

            {canSave ? (
              <>
                <section className="border-b border-hair px-5 py-4" aria-labelledby="saves-heading">
                  <h2 id="saves-heading" className="text-[14px] font-semibold">
                    Save slots <span className="font-normal text-faint">{gameSaves.length}</span>
                  </h2>
                  {gameSaves.length === 0 ? (
                    <p className="mt-2 text-[13px] text-muted">No saves for this game yet.</p>
                  ) : (
                    <ul className="mt-2">
                      {gameSaves.map(s => {
                        const loadable = readSlotState(s) !== null;
                        return (
                          <li key={s.id} className="flex items-center justify-between gap-2 border-b border-hair py-2.5 last:border-b-0">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold">{s.slotName}</p>
                              <p className="truncate text-[12px] text-faint">
                                {new Date(s.timestamp).toLocaleDateString()}
                                {s.notes ? ` · ${s.notes}` : ''}
                                {!loadable && ' · no game state'}
                              </p>
                            </div>
                            <div className="flex flex-none items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleLoadSave(s)}
                                disabled={!loadable}
                                className="btn-ghost h-8 px-3 text-[12px]"
                                title={loadable ? 'Restart the game from this slot' : 'This slot was written before saves captured game state'}
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const blob = new Blob([s.saveData], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${game.title}_${s.slotName}.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="btn-quiet h-8 w-8"
                                aria-label={`Download ${s.slotName} as JSON`}
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <form onSubmit={handleCreateSave} className="px-5 py-4" aria-labelledby="new-slot-heading">
                  <h2 id="new-slot-heading" className="text-[14px] font-semibold">New slot</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5 text-[13px] text-muted">
                      Name
                      <input type="text" value={slotName} onChange={e => setSlotName(e.target.value)} className="field h-9 px-3 text-[13px]" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] text-muted">
                      Score or checkpoint
                      <input type="number" value={saveScore} onChange={e => setSaveScore(e.target.value)} className="field h-9 px-3 text-[13px]" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] text-muted">
                      Notes
                      <input type="text" value={saveNotes} onChange={e => setSaveNotes(e.target.value)} className="field h-9 px-3 text-[13px]" />
                    </label>
                    <button type="submit" disabled={isSaving} className="btn-ghost h-9 px-4 text-[13px]">
                      <Plus className="h-4 w-4" aria-hidden />
                      {isSaving ? 'Saving…' : 'Save to a new slot'}
                    </button>
                  </div>
                  {!currentUser && <p className="mt-3 text-[12px] leading-relaxed text-faint">Signed out: slots stay in this browser.</p>}
                </form>
              </>
            ) : (
              <section className="px-5 py-4" aria-labelledby="saves-heading">
                <h2 id="saves-heading" className="text-[14px] font-semibold">Saves</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Save slots are for Flash games. This game keeps its own progress in this browser while you play, but it cannot be written to a slot or carried to another computer.
                </p>
              </section>
            )}
          </aside>
        )}
      </div>
    </motion.div>
  );
}
