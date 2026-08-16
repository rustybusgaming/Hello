import React from 'react';
import { Search, Shuffle } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRandomGame: () => void;
  onUploadClick: () => void;
}

export function TopBar({ searchQuery, setSearchQuery, onRandomGame, onUploadClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#121214] border-b border-[#2d2d30]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-[#ff8a00] rounded-sm flex items-center justify-center font-bold text-black italic text-xl">
            F
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white hidden sm:block">
            FlashHub
          </h1>
        </div>

        <div className="flex-1 max-w-xl relative flex items-center justify-center sm:justify-start">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
              <Search className="h-4 w-4 text-white" />
            </div>
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-1.5 border border-[#2d2d30] rounded-full leading-5 bg-[#1c1c1f] text-sm text-[#e1e1e3] placeholder-gray-500 focus:outline-none focus:border-[#ff8a00] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            className="flex-shrink-0 flex items-center gap-2 bg-[#1c1c1f] border border-[#2d2d30] hover:bg-[#2d2d30] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
          >
            <span className="text-blue-400">↑</span>
            <span className="hidden sm:inline uppercase">Upload</span>
          </button>
          
          <button
            onClick={onRandomGame}
            className="flex-shrink-0 flex items-center gap-2 bg-[#1c1c1f] border border-[#2d2d30] hover:bg-[#2d2d30] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
          >
            <span className="text-[#ff8a00]">✦</span>
            <span className="hidden sm:inline uppercase">Random Game</span>
          </button>
        </div>

      </div>
    </header>
  );
}
