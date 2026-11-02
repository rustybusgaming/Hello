import React from 'react';
import { RefreshCw, Shuffle, ArrowLeft } from 'lucide-react';

interface NotFoundPanelProps {
  errorTitle?: string;
  errorMessage?: string;
  targetId?: string;
  onGoHome: () => void;
  onRandomGame: () => void;
  onRetry?: () => void;
}

export function NotFoundPanel({
  errorTitle = '404 — cartridge not found',
  errorMessage = 'The requested webport, flash game, or save file could not be located in the repository catalogue.',
  targetId,
  onGoHome,
  onRandomGame,
  onRetry
}: NotFoundPanelProps) {
  return (
    <div className="bg-paper">
      {/* A plain panel: the red is kept for the one action at its foot */}
      <div className="px-7 pt-7">
        <h2 className="text-[20px] font-semibold leading-tight">{errorTitle}</h2>
      </div>

      <div className="px-7 pb-6 pt-2 border-b border-hair">
        <p className="text-[14px] leading-relaxed max-w-[62ch]">{errorMessage}</p>
        {targetId && (
          <div className="mt-5 flex items-baseline gap-3 border border-hair bg-shade px-3 py-2.5">
            <span className="flex-shrink-0 text-[13px] text-faint">Looked up</span>
            <code className="tabular-nums text-[13px] text-ink truncate">{targetId}</code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="px-7 py-6 border-r-0 sm:border-r border-hair">
          <h3 className="mb-3 text-[14px] font-semibold">Possible causes</h3>
          <ul className="text-[14px] leading-relaxed space-y-1.5 text-muted">
            <li>Upstream repo moved or renamed files</li>
            <li>Asset is currently being cached or proxied</li>
            <li>Invalid game ID, or a typo in the search query</li>
          </ul>
        </div>
        <div className="px-7 py-6 border-t sm:border-t-0 border-hair">
          <h3 className="mb-3 text-[14px] font-semibold">What to try</h3>
          <ul className="text-[14px] leading-relaxed space-y-1.5 text-muted">
            <li>Roll a random title and come back later</li>
            <li>Use admin sync to re-index the repo catalogue</li>
            <li>Upload a custom .swf or HTML5 backup</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-7 py-5 border-t border-hair">
        <button onClick={onGoHome} className="btn-ghost h-9 px-3.5 text-[12px]">
          <ArrowLeft className="w-4 h-4" />
          Back to the catalogue
        </button>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost h-9 px-3.5 text-[12px]">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry loading
          </button>
        )}
        <button onClick={onRandomGame} className="btn-primary h-9 px-3.5 text-[12px] ml-auto">
          <Shuffle className="w-3.5 h-3.5" />
          Random game
        </button>
      </div>
    </div>
  );
}
