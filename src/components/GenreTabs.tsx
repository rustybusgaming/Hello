import React from 'react';

interface GenreTabsProps {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreTabs({ genres, activeGenre, onSelectGenre }: GenreTabsProps) {
  return (
    <div className="flex overflow-x-auto px-6 py-4 bg-[#121214] border-b border-[#2d2d30] no-scrollbar whitespace-nowrap text-[11px] font-bold tracking-widest uppercase items-center shadow-md z-20">
      <div className="flex gap-2 w-full max-w-7xl mx-auto">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
              activeGenre === genre
                ? 'bg-[#ff8a00] text-black shadow-[0_0_15px_rgba(255,138,0,0.4)]'
                : 'bg-[#1c1c1f] text-gray-400 border border-[#2d2d30] hover:bg-[#2d2d30] hover:text-white'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
