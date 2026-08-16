import React from 'react';

interface GenreTabsProps {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreTabs({ genres, activeGenre, onSelectGenre }: GenreTabsProps) {
  return (
    <div className="flex overflow-x-auto px-4 py-3 bg-black border-b border-white/5 no-scrollbar whitespace-nowrap text-[10px] font-medium tracking-wide items-center z-20">
      <div className="flex gap-1.5 w-full max-w-6xl mx-auto">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-3 py-1 rounded-md transition-all duration-300 ${
              activeGenre === genre
                ? 'bg-white text-black'
                : 'bg-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
