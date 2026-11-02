import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { LibraryEntry, steamRunUrl } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';

interface LaunchButtonProps {
  entry: LibraryEntry;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * The one primary action for a game, worded for where it launches: "Play" starts it in the
 * Flashhub player, "Open in Steam" hands it to the Steam client with a steam:// link (the
 * browser asks first, and it needs Steam installed on this computer).
 */
export function LaunchButton({ entry, size = 'md', className = '' }: LaunchButtonProps) {
  const { play } = useLibrary();
  const sizing = size === 'lg' ? 'h-11 px-6 text-[15px]' : 'h-9 px-4 text-[14px]';

  if (entry.launch === 'steam' && entry.steamAppId) {
    return (
      <a
        href={steamRunUrl(entry.steamAppId)}
        className={`btn-primary ${sizing} ${className}`}
        title="Opens the Steam client on this computer"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Open in Steam
      </a>
    );
  }

  return (
    <button type="button" onClick={() => play(entry)} className={`btn-primary ${sizing} ${className}`}>
      <Play className="h-4 w-4 fill-current" aria-hidden />
      Play
    </button>
  );
}
