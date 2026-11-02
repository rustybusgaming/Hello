import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { LibraryEntry } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { gameHref } from '../lib/router';
import { GameArt } from './GameArt';
import { LaunchButton } from './LaunchButton';

interface FeaturedBannerProps {
  entry: LibraryEntry;
  /** One plain line under the name: why this game is here and what is known about it */
  line: string;
  headingLevel?: 'h1' | 'h2';
  /** Told when the wide art fails, so a featured slot can move on to a game that has it */
  onHeroError?: (key: string) => void;
}

/**
 * The lead block of Home: one game, large. With Steam's wide library art the picture runs the
 * full width behind a neutral scrim that only covers the text; without it, the cover sits whole
 * at the right of a flat panel, because a 225px square blown up to 1,100px would be mush.
 */
export function FeaturedBanner({ entry, line, headingLevel = 'h2', onHeroError }: FeaturedBannerProps) {
  const { isFavourite, toggleFavourite } = useLibrary();
  const [heroFailed, setHeroFailed] = useState(false);
  useEffect(() => setHeroFailed(false), [entry.key]);

  const hasHero = !!entry.heroArt && !heroFailed;
  const favourite = isFavourite(entry.key);
  const Heading = headingLevel;

  const actions = (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <LaunchButton entry={entry} size="lg" />
      <a href={gameHref(entry.key)} className="btn-ghost h-11 px-5 text-[14px]">
        Game details
      </a>
      <button
        type="button"
        onClick={() => toggleFavourite(entry.key)}
        aria-pressed={favourite}
        aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
        className={`btn-ghost h-11 w-11 p-0 ${favourite ? 'text-accent-lit' : ''}`}
      >
        <Heart className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </div>
  );

  if (hasHero) {
    return (
      <section aria-label="Featured" className="relative h-[300px] overflow-hidden bg-paper sm:h-[340px]">
        <img
          src={entry.heroArt!}
          alt=""
          onError={() => {
            setHeroFailed(true);
            onHeroError?.(entry.key);
          }}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        {/* Neutral scrim under the text only, so the art stays untouched on the right */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(14,13,13,0.92) 0%, rgba(14,13,13,0.78) 34%, rgba(14,13,13,0) 68%)' }} // taste-skill-ignore: the neutral scrim over a photo
        />
        <div className="relative flex h-full max-w-[560px] flex-col justify-end p-6 sm:p-8">
          <Heading className="text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">{entry.title}</Heading>
          <p className="mt-2 text-[14px] text-muted">{line}</p>
          {actions}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Featured" className="grid overflow-hidden bg-paper sm:h-[300px] sm:grid-cols-[minmax(0,1fr)_400px]">
      <div className="order-2 flex flex-col justify-end p-6 sm:order-1 sm:p-8">
        <Heading className="text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">{entry.title}</Heading>
        <p className="mt-2 max-w-[52ch] text-[14px] text-muted">{line}</p>
        {actions}
      </div>
      <div className="order-1 aspect-[4/3] bg-shade sm:order-2 sm:aspect-auto sm:h-[300px]">
        <GameArt entry={entry} eager />
      </div>
    </section>
  );
}
