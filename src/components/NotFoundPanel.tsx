import React from 'react';
import { RefreshCw, Shuffle, HelpCircle, ArrowLeft, Bug, ShieldAlert } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="sheet max-w-2xl mx-auto my-8 p-6 sm:p-8"
    >
      {/* Dot matrix backdrop, the way a dead cabinet screen looks up close */}
      <div className="absolute inset-0 bg-[radial-gradient(#fb5c72_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.06] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full bg-rose/20 blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 border-b border-edge pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose/10 border border-rose/30 flex items-center justify-center text-rose flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="eyebrow text-rose/80">Error 404 · page fault</span>
              <h2 className="mt-1 text-xl font-bold text-white tracking-tight">{errorTitle}</h2>
            </div>
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono text-zinc-400 border border-edge bg-white/[0.03]">
            HTTP 404
          </span>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
          {errorMessage}
        </p>

        {targetId && (
          <div className="bg-black/50 border border-edge rounded-xl p-3.5 mb-6 font-mono text-xs text-zinc-400 flex items-center justify-between gap-3">
            <span className="flex-shrink-0">Queried identifier</span>
            <code className="text-rose bg-rose/10 px-2 py-0.5 rounded-md border border-rose/25 truncate">
              {targetId}
            </code>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="panel p-4">
            <h3 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-volt" />
              Possible explanations
            </h3>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside marker:text-volt/60">
              <li>Upstream repo moved or renamed files</li>
              <li>Asset is currently being cached/proxied</li>
              <li>Invalid game ID or typo in search query</li>
            </ul>
          </div>

          <div className="panel p-4">
            <h3 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-beam" />
              Quick troubleshooting
            </h3>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside marker:text-beam/60">
              <li>Roll a random game and come back later</li>
              <li>Use Admin Sync to re-index the repo catalogue</li>
              <li>Upload a custom .swf or HTML5 backup</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-edge">
          <button
            onClick={onGoHome}
            className="btn-ghost flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the arcade
          </button>

          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-ghost flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry loading
              </button>
            )}

            <button
              onClick={onRandomGame}
              className="btn-volt flex items-center gap-2 px-4 h-10 rounded-xl text-xs"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Roll random game
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
