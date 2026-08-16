import React, { useState, useEffect, useMemo } from 'react';
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
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotFoundPanel } from './NotFoundPanel';

interface PlayerModalProps {
  game: Game | null;
  onClose: (elapsedSeconds: number) => void;
  currentUser?: UserAccount | null;
}

export function PlayerModal({ game, onClose, currentUser }: PlayerModalProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isCrtMode, setIsCrtMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSaveDrawer, setShowSaveDrawer] = useState(false);
  const [show404Panel, setShow404Panel] = useState(false);

  // Mirrors state
  const [selectedMirrorId, setSelectedMirrorId] = useState<string>('');
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>('');
  const [iframeKey, setIframeKey] = useState(0);
  const [showMirrorBar, setShowMirrorBar] = useState(true);

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
          name: 'Ruffle WASM (Zero-Archive)',
          type: 'ruffle',
          url: `/play.html?title=${encodeURIComponent(game.title)}&url=${encodeURIComponent(game.embedUrl)}`,
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
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.id, availableMirrors]);

  // Load saves for this game
  const fetchGameSaves = () => {
    if (!game?.id) return;
    const userIdQuery = currentUser?.id ? `userId=${currentUser.id}&` : '';
    fetch(`/api/saves?${userIdQuery}gameId=${game.id}`)
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

  if (!game) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    onClose(elapsedSeconds);
  };

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
      if (d.status === 'ok') {
        setSaveMessage('Save state committed to cloud!');
        setTimeout(() => setSaveMessage(''), 3500);
        fetchGameSaves();
      }
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentArchive = currentEmbedUrl.includes('archive.org');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${isTheaterMode ? 'bg-black p-0' : 'bg-black/90 backdrop-blur-md p-3 sm:p-5'}`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className={`bg-zinc-950 overflow-hidden flex flex-col shadow-2xl transition-all duration-500 ${isTheaterMode ? 'w-full h-full rounded-none border-0' : 'w-full max-w-5xl rounded-2xl border border-zinc-800/80'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Control Bar */}
          <div className={`flex flex-wrap items-center justify-between p-3 border-b border-zinc-800/80 gap-2 ${isTheaterMode ? 'bg-black' : 'bg-zinc-900/60'}`}>
            <div className="flex items-center gap-3">
              <h2 className={`font-semibold text-zinc-100 flex items-center gap-2 tracking-tight ${isTheaterMode ? 'text-xs' : 'text-sm'}`}>
                {game.title}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono tracking-wider ${
                  game.source === 'steam' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  game.source === 'archive' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {game.source}
                </span>
                {game.isArchiveIndependent && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    <ShieldCheck className="w-2.5 h-2.5" /> 100% Archive-Independent
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Timer className="w-3 h-3 text-zinc-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Save State Keeper toggle */}
              <button
                onClick={() => setShowSaveDrawer(!showSaveDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showSaveDrawer
                    ? 'bg-emerald-500 text-black'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
                title="Manage Cloud Saves"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Keeper</span>
                {showSaveDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setIsCrtMode(!isCrtMode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isCrtMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                title="Toggle Retro CRT Scanlines"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CRT</span>
              </button>

              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isTheaterMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                title="Toggle Theater Mode"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theater</span>
              </button>

              <button
                onClick={() => setShow404Panel(!show404Panel)}
                className={`p-1.5 rounded-lg transition-all ${
                  show404Panel ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
                }`}
                title="Report 404 / Port Diagnostics"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              
              <a
                href={currentEmbedUrl || game.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Mirrors & Outage Protection Bar */}
          {showMirrorBar && availableMirrors.length > 1 && (
            <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400 font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Server className="w-3 h-3 text-amber-400" />
                  Active Mirror:
                </span>
                {availableMirrors.map((m) => {
                  const isActive = selectedMirrorId === m.id || currentEmbedUrl === m.url;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMirror(m)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/60'
                      }`}
                    >
                      {m.isArchiveIndependent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                      {m.name}
                    </button>
                  );
                })}
              </div>

              {isCurrentArchive && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    ⚠️ Archive.org down?
                  </span>
                  <button
                    onClick={() => {
                      const nonArchive = availableMirrors.find(m => m.isArchiveIndependent);
                      if (nonArchive) handleSelectMirror(nonArchive);
                    }}
                    className="text-[11px] font-bold text-black bg-amber-400 hover:bg-amber-300 px-2.5 py-0.5 rounded transition-all flex items-center gap-1"
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
                className="border-b border-zinc-800 bg-zinc-950/95 p-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create New Save Slot */}
                  <form onSubmit={handleCreateSave} className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-emerald-400" />
                        Create / Overwrite Save Slot
                      </span>
                      {saveMessage && (
                        <span className="text-[11px] text-emerald-400 font-semibold">{saveMessage}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Slot Name (e.g. Slot 1, Level 4)"
                        value={slotName}
                        onChange={e => setSlotName(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                      />
                      <input
                        type="number"
                        placeholder="Score / Checkpoint (optional)"
                        value={saveScore}
                        onChange={e => setSaveScore(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Notes / Boss battle status..."
                      value={saveNotes}
                      onChange={e => setSaveNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
                    />

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving to Cloud...' : 'Commit Save State'}
                    </button>
                  </form>

                  {/* Existing Saves List for this game */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col">
                    <span className="text-xs font-bold text-white mb-2">Saved States ({gameSaves.length})</span>
                    <div className="flex-1 overflow-y-auto max-h-28 space-y-1.5">
                      {gameSaves.length === 0 ? (
                        <div className="text-[11px] text-zinc-500 py-4 text-center">No save states stored for this cartridge.</div>
                      ) : (
                        gameSaves.map(s => (
                          <div key={s.id} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
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
                              }}
                              className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white"
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
          <div className="relative w-full bg-black flex-grow flex items-center justify-center overflow-hidden">
            {show404Panel ? (
              <div className="w-full h-full flex items-center justify-center p-6 bg-zinc-950 overflow-y-auto">
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
                <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ${isCrtMode ? 'scale-[0.98]' : ''}`} style={{ transform: 'translateZ(0)' }}>
                  {game.source === 'steam' ? (
                    <iframe
                      key={iframeKey}
                      src={currentEmbedUrl || game.embedUrl}
                      frameBorder="0"
                      width="646"
                      height="190"
                      allow="autoplay; fullscreen"
                      className={`max-w-full ${isCrtMode ? 'rounded-2xl' : ''}`}
                      title={`${game.title} Steam Widget`}
                    ></iframe>
                  ) : (
                    <iframe
                      key={iframeKey}
                      src={currentEmbedUrl || game.embedUrl}
                      frameBorder="0"
                      allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                      className={`w-full h-full ${isTheaterMode ? 'min-h-[85vh]' : 'min-h-[55vh] sm:min-h-[72vh]'} ${isCrtMode ? 'rounded-xl border-2 border-zinc-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]' : ''}`}
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
