import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface GenreTabsProps {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreTabs({ genres, activeGenre, onSelectGenre }: GenreTabsProps) {
  return (
    <div className="sticky top-[68px] z-20 border-b border-edge/60 bg-void/65 backdrop-blur-xl">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-7 flex items-center gap-3">
        {/* Fixed label so the rail reads as a filter, not as page navigation */}
        <span className="hidden md:flex items-center gap-2 py-3 pr-3 border-r border-edge/70 flex-shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-volt" />
          <span className="eyebrow">Filter</span>
        </span>

        {/* The fade mask hints that the rail keeps scrolling past the viewport edge */}
        <div
          className="flex-1 min-w-0"
          style={{
            maskImage: 'linear-gradient(90deg, #000 calc(100% - 40px), transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, #000 calc(100% - 40px), transparent)'
          }}
        >
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2.5 pr-10">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => onSelectGenre(genre)}
                data-active={activeGenre === genre}
                className="rail-pill"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
