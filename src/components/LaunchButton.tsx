import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { LibraryEntry, steamRunUrl } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';

interface LaunchButtonProps {
  entry: LibraryEntry;
  size?: 'md' | 'lg';
  /** Red for the one primary action on a screen; quiet where it repeats down a list */
  variant?: 'primary' | 'quiet';
  className?: string;
}

/**
 * The one primary action for a game, worded for where it launches: "Play" starts it in the
 * Flashhub player, "Open in Steam" hands it to the Steam client with a steam:// link (the
 * browser asks first, and it needs Steam installed on this computer).
 */
export function LaunchButton({ entry, size = 'md', variant = 'primary', className = '' }: LaunchButtonProps) {
  const { play } = useLibrary();
  const sizing = size === 'lg' ? 'h-11 px-6 text-[14px]' : 'h-9 px-4 text-[13px]';
  const look = variant === 'primary' ? 'btn-primary' : 'btn-ghost';

  if (entry.launch === 'steam' && entry.steamAppId) {
    return (
      <a
        href={steamRunUrl(entry.steamAppId)}
        className={`${look} ${sizing} ${className}`}
        title="Opens the Steam client on this computer"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Open in Steam
      </a>
    );
  }

  return (
    <button type="button" onClick={() => play(entry)} className={`${look} ${sizing} ${className}`}>
      <Play className="h-4 w-4 fill-current" aria-hidden />
      Play
    </button>
  );
}
