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
    <div className="max-w-3xl border border-rule bg-paper">
      {/* The accent runs as a field here — this is the page's one poster statement. */}
      <div className="bg-accent text-paper px-7 py-8">
        <div className="tabular-nums text-[12px] opacity-85 mb-3">
          System error 404 · page fault
        </div>
        <h2 className="font-display text-[34px] leading-[1.02] font-extrabold tracking-[-0.03em]">
          {errorTitle}
        </h2>
      </div>

      <div className="px-7 py-6 border-b border-rule">
        <p className="text-[14px] leading-relaxed max-w-[62ch]">{errorMessage}</p>
        {targetId && (
          <div className="mt-5 flex items-baseline gap-3 border border-hair bg-shade px-3 py-2.5">
            <span className="eyebrow flex-shrink-0">Queried identifier</span>
            <code className="tabular-nums text-[12px] text-accent-deep truncate">{targetId}</code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="px-7 py-6 border-r-0 sm:border-r border-hair">
          <div className="eyebrow mb-3">Possible explanations</div>
          <ul className="text-[13px] leading-relaxed space-y-1.5 text-ink/80">
            <li>Upstream repo moved or renamed files</li>
            <li>Asset is currently being cached or proxied</li>
            <li>Invalid game ID, or a typo in the search query</li>
          </ul>
        </div>
        <div className="px-7 py-6 border-t sm:border-t-0 border-hair">
          <div className="eyebrow mb-3">Quick troubleshooting</div>
          <ul className="text-[13px] leading-relaxed space-y-1.5 text-ink/80">
            <li>Roll a random title and come back later</li>
            <li>Use admin sync to re-index the repo catalogue</li>
            <li>Upload a custom .swf or HTML5 backup</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-7 py-5 border-t border-rule">
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
          Random title
        </button>
      </div>
    </div>
  );
}
