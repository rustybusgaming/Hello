import React from 'react';

interface GenreTabsProps {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
  resultCount: number;
}

/** The FILTER band from 1a: a mono label, ruled off, then the genre options. */
export function GenreTabs({ genres, activeGenre, onSelectGenre, resultCount }: GenreTabsProps) {
  return (
    <div className="sticky top-[61px] z-20 border-b-2 border-rule bg-shade">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-7 flex items-center gap-2">
        <span className="eyebrow flex-shrink-0 pr-3 py-2.5 border-r border-hair">Filter</span>

        <div
          className="flex-1 min-w-0"
          style={{
            maskImage: 'linear-gradient(90deg, #000 calc(100% - 32px), transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, #000 calc(100% - 32px), transparent)'
          }}
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2.5 pr-8">
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

        <span className="hidden md:block flex-shrink-0 pl-4 text-[11px] text-ink/55">
          {resultCount.toLocaleString()} shown, sorted by rating
        </span>
      </div>
    </div>
  );
}
