import React, { useState } from 'react';
import { LibraryEntry } from '../lib/library';

interface GameArtProps {
  entry: LibraryEntry;
  className?: string;
  eager?: boolean;
}

/**
 * A game's cover in a fixed frame. Square and 4:3 art fills the frame; wide art (Steam's
 * 460x215 headers, whose logos run to the edges) is shown whole on a black mat, like a
 * widescreen game on the player's stage, rather than cropped through its title. A failed image
 * falls back to the drawn cover.
 *
 * Both facts are remembered against the URL they were measured on, not reset in an effect: a
 * cached image can finish loading before an effect runs, and the reset would then undo it.
 */
export function GameArt({ entry, className = '', eager = false }: GameArtProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [wideSrc, setWideSrc] = useState<string | null>(null);

  const src = failedSrc === entry.art ? entry.artFallback : entry.art;
  const wide = wideSrc === src;

  return (
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={e => {
        const img = e.currentTarget;
        if (img.naturalHeight) setWideSrc(img.naturalWidth / img.naturalHeight > 1.6 ? src : null);
      }}
      onError={() => {
        if (src !== entry.artFallback) setFailedSrc(entry.art);
      }}
      className={`h-full w-full ${wide ? 'bg-black object-contain' : 'object-cover'} ${className}`}
    />
  );
}
