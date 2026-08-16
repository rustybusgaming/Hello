import React from 'react';
import { Search, Shuffle, UploadCloud, RefreshCw } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRandomGame: () => void;
  onUploadClick: () => void;
  onSyncClick?: () => void;
  isSyncing?: boolean;
}

export function TopBar({ searchQuery, setSearchQuery, onRandomGame, onUploadClick, onSyncClick, isSyncing = false }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 sm:gap-6">
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center font-bold text-black text-xs">
            F
          </div>
          <h1 className="text-sm font-medium tracking-wide text-white hidden sm:block">
            FlashHub
          </h1>
        </div>

        <div className="flex-1 max-w-md relative flex items-center justify-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
              <Search className="h-3.5 w-3.5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-transparent text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-white/10 focus:border-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSyncClick && (
            <button
              onClick={onSyncClick}
              disabled={isSyncing}
              className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 gap-2 rounded-lg text-xs font-medium transition-all ${
                isSyncing
                  ? 'bg-white/10 text-zinc-400 cursor-wait'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
              title={isSyncing ? 'Synchronizing gameports & quasar...' : 'Sync and download offline games'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={onUploadClick}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 gap-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          
          <button
            onClick={onRandomGame}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 gap-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>
        </div>

      </div>
    </header>
  );
}
