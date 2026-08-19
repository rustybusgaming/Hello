import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Game, UserAccount, GameSave, GameMirror } from '../types';
import {
  X,
  ExternalLink,
  MonitorPlay,
  Tv,
  Timer,
  Save,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldCheck,
  RefreshCw,
  Server,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotFoundPanel } from './NotFoundPanel';
import { useEscapeKey, useFullscreen } from '../lib/hooks';

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
  const [showSaveDrawer, setShowSaveDrawer] = useState(false);
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
          name: 'Ruffle Player (Load SWF)',
          type: 'ruffle',
          url: game.swfUrl
            ? `/play.html?title=${encodeURIComponent(game.title)}&swf=${encodeURIComponent(game.swfUrl)}&autoplay=1`
            : `/play.html?title=${encodeURIComponent(game.title)}`,
          isArchiveIndependent: true
        });
        mirrors.push({
          id: 'archive-org',
          name: 'Internet Archive Embed',
          type: 'archive',
          url: game.embedUrl,
          isArchiveIndependent: false
        });
      } else {
        mirrors.push({
          id: 'primary-webport',
          name: 'HTML5 WebPort (Primary)',
          type: 'webport',
          url: game.embedUrl,
          isArchiveIndependent: true
        });
      }
    }

    // Always include Custom Ruffle File Player fallback
    mirrors.push({
      id: 'local-ruffle',
      name: 'Custom File / Drag & Drop',
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
    if (!game?.id) return;
    const userIdQuery = currentUser?.id ? `userId=${encodeURIComponent(currentUser.id)}&` : '';
    fetch(`/api/saves?${userIdQuery}gameId=${encodeURIComponent(game.id)}`)
      .then(res => res.ok ? res.json() : { status: 'error', data: [] })
      .then(d => {
        if (d && d.status === 'ok') setGameSaves(d.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (showSaveDrawer) {
      fetchGameSaves();
    }
  }, [showSaveDrawer, game?.id]);

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

      if (currentUser?.id) {
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
      if (Object.keys(state).length > 0) setStateStatus('restored');
    };

    load();
    return () => { cancelled = true; };
  }, [game?.id, currentUser?.id]);

  // Talk to the sandboxed frame
  useEffect(() => {
    if (!game) return;

    const persist = async (state: Record<string, string>) => {
      gameState.current = state;

      try {
        window.localStorage.setItem(localStateKey, JSON.stringify(state));
      } catch { /* quota or private mode; the account copy below still applies */ }

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
  }, [game?.id, currentUser?.id, localStateKey]);

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
    if (!game) return;

    setIsSaving(true);
    try {
      const payload = {
        gameId: game.id,
        gameTitle: game.title,
        userId: currentUser?.id || 'guest',
        slotName: slotName || 'Quick Save',
        saveData: JSON.stringify({
          sessionSeconds: elapsedSeconds,
          savedAt: new Date().toISOString(),
          notes: saveNotes,
          score: saveScore ? Number(saveScore) : undefined,
          mirrorId: selectedMirrorId
        }),
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
        let successMsg = 'Save state committed to cloud!';
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
        className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${isTheaterMode ? 'bg-black p-0' : 'bg-void/92 backdrop-blur-lg p-3 sm:p-6'}`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className={`bg-pit overflow-hidden flex flex-col shadow-[0_50px_120px_-40px_rgba(0,0,0,1)] transition-all duration-500 ${isTheaterMode ? 'w-full h-full rounded-none border-0' : 'sheet w-full max-w-6xl h-[min(88dvh,940px)]'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Control Bar */}
          <div className={`flex flex-wrap items-center justify-between px-3.5 py-3 border-b border-edge gap-2 ${isTheaterMode ? 'bg-void' : 'bg-surface/60'}`}>
            <div className="flex items-center gap-3">
              <h2 className={`font-semibold text-zinc-100 flex items-center gap-2 tracking-tight ${isTheaterMode ? 'text-xs' : 'text-sm'}`}>
                {game.title}
                <span className={`chip ${
                  game.source === 'steam' ? 'chip-steam' :
                  game.source === 'archive' ? 'chip-archive' :
                  game.source === 'custom' ? 'chip-custom' : 'chip-web'
                }`}>
                  {game.source}
                </span>
                {game.isArchiveIndependent && (
                  <span className="hidden sm:inline-flex chip chip-flash">
                    <ShieldCheck className="w-2.5 h-2.5" /> Archive-free
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/50 border border-edge text-[11px] font-mono text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
                <Timer className="w-3 h-3 text-zinc-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              {isolationBlocked && (
                <span
                  className="hidden sm:inline-flex chip chip-archive"
                  title="This browser would not load the game from a separate origin, so it is running on the hub's origin instead."
                >
                  Isolation unavailable
                </span>
              )}

              {stateStatus !== 'idle' && (
                <span
                  className="hidden sm:inline-flex chip chip-web"
                  title={
                    currentUser
                      ? 'This game\'s progress is stored on your account'
                      : 'Progress is stored in this browser. Sign in to carry it across devices.'
                  }
                >
                  {stateStatus === 'restored' && 'Progress restored'}
                  {stateStatus === 'saving' && 'Saving…'}
                  {stateStatus === 'saved' && 'Progress saved'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Save State Keeper toggle */}
              <button
                onClick={() => setShowSaveDrawer(!showSaveDrawer)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all ${
                  showSaveDrawer ? 'btn-volt' : 'btn-ghost'
                }`}
                title="Manage Cloud Saves"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Keeper</span>
                {showSaveDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setIsCrtMode(!isCrtMode)}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold transition-all ${isCrtMode ? 'bg-volt text-white shadow-[0_6px_18px_-8px_rgba(139,92,246,1)]' : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'}`}
                title="Toggle Retro CRT Scanlines"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CRT</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold transition-all ${isFullscreen ? 'bg-volt text-white shadow-[0_6px_18px_-8px_rgba(139,92,246,1)]' : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'}`}
                title={isFullscreen ? 'Exit fullscreen' : 'Play fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Fullscreen</span>
              </button>

              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold transition-all ${isTheaterMode ? 'bg-volt text-white shadow-[0_6px_18px_-8px_rgba(139,92,246,1)]' : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'}`}
                title="Toggle Theater Mode"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theater</span>
              </button>

              <button
                onClick={() => setShow404Panel(!show404Panel)}
                className={`p-2 rounded-xl transition-all ${
                  show404Panel ? 'bg-rose/20 text-rose' : 'text-zinc-400 hover:text-amber hover:bg-white/[0.07]'
                }`}
                title="Report 404 / Port Diagnostics"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              
              <a
                href={currentEmbedUrl || game.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.07] rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.07] rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Mirrors & Outage Protection Bar */}
          {availableMirrors.length > 1 && (
            <div className="bg-surface/40 px-3.5 py-2.5 border-b border-edge flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="eyebrow flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-beam" />
                  Source
                </span>
                {availableMirrors.map((m) => {
                  const isActive = selectedMirrorId === m.id || currentEmbedUrl === m.url;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMirror(m)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                        isActive ? 'bg-volt text-white shadow-[0_6px_18px_-8px_rgba(139,92,246,1)]' : 'btn-ghost'
                      }`}
                    >
                      {m.isArchiveIndependent && <span className="w-1.5 h-1.5 rounded-full bg-mint"></span>}
                      {m.name}
                    </button>
                  );
                })}
              </div>

              {isCurrentArchive && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber bg-amber/10 border border-amber/25 px-2 py-1 rounded-lg">
                    Archive.org unreliable?
                  </span>
                  <button
                    onClick={() => {
                      const nonArchive = availableMirrors.find(m => m.isArchiveIndependent);
                      if (nonArchive) handleSelectMirror(nonArchive);
                    }}
                    className="btn-volt text-[11px] px-2.5 py-0.5 rounded flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Switch to Fallback
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expandable Save Keeper Drawer */}
          <AnimatePresence>
            {showSaveDrawer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-edge bg-void/90 p-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create New Save Slot */}
                  <form onSubmit={handleCreateSave} className="panel p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-volt" />
                        Create / Overwrite Save Slot
                      </span>
                      {saveMessage && (
                        <span className="text-[11px] text-volt font-semibold">{saveMessage}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Slot Name (e.g. Slot 1, Level 4)"
                        value={slotName}
                        onChange={e => setSlotName(e.target.value)}
                        className="field px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Score / Checkpoint (optional)"
                        value={saveScore}
                        onChange={e => setSaveScore(e.target.value)}
                        className="field px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Notes / Boss battle status..."
                      value={saveNotes}
                      onChange={e => setSaveNotes(e.target.value)}
                      className="field w-full px-2.5 py-1.5 text-xs"
                    />

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-volt w-full py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving to Cloud...' : 'Commit Save State'}
                    </button>
                  </form>

                  {/* Existing Saves List for this game */}
                  <div className="panel p-3.5 flex flex-col">
                    <span className="text-xs font-bold text-white mb-2">Saved States ({gameSaves.length})</span>
                    <div className="flex-1 overflow-y-auto max-h-28 space-y-1.5">
                      {gameSaves.length === 0 ? (
                        <div className="text-[11px] text-zinc-500 py-4 text-center">No save states stored for this cartridge.</div>
                      ) : (
                        gameSaves.map(s => (
                          <div key={s.id} className="p-2.5 rounded-xl bg-black/40 border border-edge flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-zinc-200">{s.slotName}</span>
                              <span className="text-[10px] text-zinc-500 block">
                                {new Date(s.timestamp).toLocaleDateString()} {s.notes && `• ${s.notes}`}
                              </span>
                            </div>
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
                              className="btn-ghost p-1 rounded"
                              title="Download JSON save"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Game Screen or 404 Diagnostics Panel */}
          <div ref={stageRef} className="relative w-full bg-void flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            {show404Panel ? (
              <div className="w-full h-full flex items-center justify-center p-6 bg-void overflow-y-auto">
                <NotFoundPanel
                  errorTitle={`Port Diagnostics: ${game.title}`}
                  errorMessage="If this cartridge fails to boot in the player window, switch mirrors above or drag your own SWF file directly."
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
                {/* CRT Effect Overlay */}
                {isCrtMode && (
                  <div className="absolute inset-0 pointer-events-none z-10 crt-overlay mix-blend-overlay opacity-30"></div>
                )}
                {isCrtMode && (
                  <div className="absolute inset-0 pointer-events-none z-20 scanlines opacity-10"></div>
                )}
                <div className={`w-full h-full min-h-[280px] flex items-center justify-center transition-transform duration-300 ${isCrtMode ? 'scale-[0.98]' : ''}`} style={{ transform: 'translateZ(0)' }}>
                  {game.source === 'steam' ? (
                    <iframe
                      key={iframeKey}
                      src={frameSrc}
                      frameBorder="0"
                      width="646"
                      height="190"
                      allow="autoplay; fullscreen"
                      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                      className={`max-w-full ${isCrtMode ? 'rounded-2xl' : ''}`}
                      title={`${game.title} Steam Widget`}
                    ></iframe>
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
                      className={`w-full h-full min-h-[280px] ${isCrtMode ? 'rounded-xl border-2 border-black shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]' : ''}`}
                      title={`${game.title} Embed`}
                    ></iframe>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
