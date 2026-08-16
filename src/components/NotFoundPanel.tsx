import React from 'react';
import { AlertTriangle, Home, RefreshCw, Shuffle, HelpCircle, ArrowLeft, Bug, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface NotFoundPanelProps {
  errorTitle?: string;
  errorMessage?: string;
  targetId?: string;
  onGoHome: () => void;
  onRandomGame: () => void;
  onRetry?: () => void;
}

export function NotFoundPanel({
  errorTitle = '404 - Cartridge Not Found',
  errorMessage = 'The requested webport, flash game, or save file could not be located in the repository catalog.',
  targetId,
  onGoHome,
  onRandomGame,
  onRetry
}: NotFoundPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-zinc-950/90 border border-red-500/20 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl"
    >
      {/* Subtle CRT / Arcade aesthetic grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 font-semibold">
                SYSTEM ERROR CODE: 404_PAGE_FAULT
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{errorTitle}</h2>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
            HTTP 404
          </span>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
          {errorMessage}
        </p>

        {targetId && (
          <div className="bg-black/60 border border-zinc-800/80 rounded-xl p-3.5 mb-6 font-mono text-xs text-zinc-400 flex items-center justify-between">
            <span>Queried Identifier:</span>
            <code className="text-red-300 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/40">
              {targetId}
            </code>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <h3 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              Possible Explanations
            </h3>
            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
              <li>Upstream repo moved or renamed files</li>
              <li>Asset is currently being cached/proxied</li>
              <li>Invalid game ID or typo in search query</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <h3 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Quick Troubleshooting
            </h3>
            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
              <li>Click "Try Next Random Game"</li>
              <li>Use Admin Sync to re-index repo catalog</li>
              <li>Upload custom .swf or HTML5 zip backup</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Arcade Hub
          </button>

          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Loading
              </button>
            )}

            <button
              onClick={onRandomGame}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/30 transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Roll Random Game
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
