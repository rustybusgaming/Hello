import React from 'react';

interface GenreTabsProps {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreTabs({ genres, activeGenre, onSelectGenre }: GenreTabsProps) {
  return (
    <div className="sticky top-16 z-20 border-b border-edge/70 bg-void/70 backdrop-blur-lg">
      {/* The fade mask hints that the rail keeps scrolling past the viewport edge */}
      <div
        className="max-w-[1400px] mx-auto px-4 sm:px-6"
        style={{
          maskImage: 'linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 24px), transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 24px), transparent)'
        }}
      >
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2.5">
          {genres.map((genre) => {
            const isActive = activeGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => onSelectGenre(genre)}
                className={`flex-shrink-0 px-3 h-7 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-flame text-black shadow-[0_6px_18px_-8px_rgba(255,138,0,0.9)]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
