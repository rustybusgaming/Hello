import React from 'react';
import { Search, Shuffle, UploadCloud, RefreshCw, Shield, User, Gamepad2, AlertTriangle } from 'lucide-react';
import { UserAccount } from '../types';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRandomGame: () => void;
  onUploadClick: () => void;
  onSyncClick?: () => void;
  isSyncing?: boolean;
  currentUser: UserAccount | null;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onTrigger404: () => void;
}

export function TopBar({
  searchQuery,
  setSearchQuery,
  onRandomGame,
  onUploadClick,
  onSyncClick,
  isSyncing = false,
  currentUser,
  onOpenAccount,
  onOpenAdmin,
  onTrigger404
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setSearchQuery('')}>
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-black text-black text-xs shadow-md">
            F
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              FlashHub
            </h1>
            <span className="text-[10px] font-mono text-zinc-400">WebPort Arcade & Saves</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative flex items-center justify-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
              <Search className="h-3.5 w-3.5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Search 80+ webports, flash games, steam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:border-zinc-700 transition-all"
            />
          </div>
        </div>

        {/* Action Controls & User/Admin Hub */}
        <div className="flex items-center gap-2">
          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex-shrink-0 flex items-center justify-center h-8 px-2.5 sm:px-3 gap-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition-all shadow-sm"
            title="Open Admin & Sync Center"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin</span>
          </button>

          {/* User Account Button with Steam Badge */}
          <button
            onClick={onOpenAccount}
            className="flex-shrink-0 flex items-center justify-center h-8 px-2 sm:px-2.5 gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition-all"
            title="Manage Player Account & Steam Link"
          >
            <div className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover bg-zinc-800"
              />
              {currentUser?.steamId && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#66c0f4] ring-1 ring-black" />
              )}
            </div>
            <span className="hidden lg:inline font-medium text-white max-w-[90px] truncate">
              {currentUser?.username || 'Account'}
            </span>
          </button>

          {/* 404 Panel quick trigger */}
          <button
            onClick={onTrigger404}
            className="hidden sm:flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-all"
            title="Test 404 Fallback Panel"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition-all"
            title="Upload custom SWF / HTML5 game"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          
          {/* Roll Random Game */}
          <button
            onClick={onRandomGame}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 gap-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-all shadow-lg"
            title="Pick a random game"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>
        </div>

      </div>
    </header>
  );
}
