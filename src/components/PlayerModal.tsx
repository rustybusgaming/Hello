import React, { useState } from 'react';
import { Game } from '../types';
import { X, ExternalLink, MonitorPlay, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerModalProps {
  game: Game | null;
  onClose: () => void;
}

export function PlayerModal({ game, onClose }: PlayerModalProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isCrtMode, setIsCrtMode] = useState(false);

  if (!game) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${isTheaterMode ? 'bg-black p-0' : 'bg-black/80 backdrop-blur-sm p-4 sm:p-8'}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-[#121214] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 ${isTheaterMode ? 'w-full h-full rounded-none border-0' : 'w-full max-w-5xl rounded-xl border border-[#2d2d30]'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between p-4 border-b border-[#2d2d30] transition-colors duration-500 ${isTheaterMode ? 'bg-black' : 'bg-[#121214]'}`}>
            <h2 className={`font-bold text-[#e1e1e3] flex items-center gap-3 uppercase tracking-tight ${isTheaterMode ? 'text-lg' : 'text-xl'}`}>
              {game.title}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                game.source === 'steam' ? 'bg-blue-600 text-white' :
                game.source === 'archive' ? 'bg-zinc-700 text-white' :
                'bg-emerald-600 text-white'
              }`}>
                {game.source}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCrtMode(!isCrtMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${isCrtMode ? 'bg-[#ff8a00] text-black' : 'text-gray-400 hover:text-white hover:bg-[#2d2d30]'}`}
                title="Toggle Retro CRT Effect"
              >
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">CRT</span>
              </button>
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${isTheaterMode ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#2d2d30]'}`}
                title="Toggle Theater Mode"
              >
                <MonitorPlay className="w-4 h-4" />
                <span className="hidden sm:inline">Theater</span>
              </button>
              
              <div className="w-px h-6 bg-[#2d2d30] mx-1"></div>

              <a
                href={game.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-white hover:bg-[#2d2d30] rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white hover:bg-red-500/20 hover:text-red-500 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
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
                  className={`max-w-full ${isCrtMode ? 'rounded-3xl' : ''}`}
                  title={`${game.title} Steam Widget`}
                ></iframe>
              ) : (
                <iframe
                  src={game.embedUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen; speaker; clipboard-read; clipboard-write"
                  className={`w-full h-full ${isTheaterMode ? 'min-h-[80vh]' : 'min-h-[50vh] sm:min-h-[70vh]'} ${isCrtMode ? 'rounded-2xl border-4 border-[#1a1a1a] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]' : ''}`}
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
