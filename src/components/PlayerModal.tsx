import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import { X, ExternalLink, MonitorPlay, Tv, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerModalProps {
  game: Game | null;
  onClose: (elapsedSeconds: number) => void;
}

export function PlayerModal({ game, onClose }: PlayerModalProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isCrtMode, setIsCrtMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.id]);

  if (!game) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    onClose(elapsedSeconds);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${isTheaterMode ? 'bg-black p-0' : 'bg-black/90 backdrop-blur-md p-4 sm:p-6'}`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-zinc-950 overflow-hidden flex flex-col shadow-2xl transition-all duration-500 ${isTheaterMode ? 'w-full h-full rounded-none border-0' : 'w-full max-w-5xl rounded-xl border border-white/10'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between p-3 border-b border-white/5 transition-colors duration-500 ${isTheaterMode ? 'bg-black' : 'bg-zinc-950'}`}>
            <div className="flex items-center gap-3">
              <h2 className={`font-medium text-zinc-200 flex items-center gap-2.5 tracking-wide ${isTheaterMode ? 'text-sm' : 'text-base'}`}>
                {game.title}
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md tracking-widest uppercase ${
                  game.source === 'steam' ? 'bg-blue-500/20 text-blue-400' :
                  game.source === 'archive' ? 'bg-zinc-800 text-zinc-300' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {game.source}
                </span>
              </h2>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-300" title="Active Play Time">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Timer className="w-3 h-3 text-zinc-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCrtMode(!isCrtMode)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${isCrtMode ? 'bg-zinc-200 text-black' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                title="Toggle Retro CRT Effect"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CRT</span>
              </button>
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${isTheaterMode ? 'bg-zinc-200 text-black' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}
                title="Toggle Theater Mode"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theater</span>
              </button>
              
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              
              <a
                href={game.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleClose}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative w-full bg-black flex-grow flex items-center justify-center overflow-hidden">
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
                  src={game.embedUrl}
                  frameBorder="0"
                  width="646"
                  height="190"
                  allow="autoplay; fullscreen"
                  className={`max-w-full ${isCrtMode ? 'rounded-2xl' : ''}`}
                  title={`${game.title} Steam Widget`}
                ></iframe>
              ) : (
                <iframe
                  src={game.embedUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen; speaker; clipboard-read; clipboard-write"
                  className={`w-full h-full ${isTheaterMode ? 'min-h-[80vh]' : 'min-h-[50vh] sm:min-h-[70vh]'} ${isCrtMode ? 'rounded-xl border-2 border-zinc-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]' : ''}`}
                  allowFullScreen
                  title={`${game.title} Embed`}
                ></iframe>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
