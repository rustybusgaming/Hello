import React, { useEffect, useState } from 'react';
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
 */
export function GameArt({ entry, className = '', eager = false }: GameArtProps) {
  const [src, setSrc] = useState(entry.art);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    setSrc(entry.art);
    setWide(false);
  }, [entry.art]);

  return (
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={e => {
        const img = e.currentTarget;
        if (img.naturalHeight) setWide(img.naturalWidth / img.naturalHeight > 1.6);
      }}
      onError={() => {
        if (src !== entry.artFallback) setSrc(entry.artFallback);
      }}
      className={`h-full w-full ${wide ? 'bg-black object-contain' : 'object-cover'} ${className}`}
    />
  );
}
