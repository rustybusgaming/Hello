import React, { useMemo, useState } from 'react';
import { LibraryEntry, RUNTIME_ORDER, Runtime, formatMinutes, formatSeconds, formatWhen } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { hrefFor } from '../lib/router';
import { onGridKeyDown } from '../lib/navigation';
import { FeaturedBanner } from './FeaturedBanner';
import { GameCard, GameCardSkeleton } from './GameCard';
import { CARD_GRID, EmptyBlock, Section, railItemClass } from './Section';
import { recommend } from '../lib/recommend';
import { useStoreDetailsFor } from '../lib/useStoreDetails';

interface HomeViewProps {
  onBrowse: (filter: { runtime?: Runtime; genre?: string }) => void;
}

/** A number that changes once a day, so today's picks stay put while the player browses. */
function dayNumber(): number {
  const now = new Date();
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
}

/** A seeded shuffle: the same day gives the same order. */
function seededPick<T>(items: T[], seed: number, count: number): T[] {
  const copy = items.slice();
  let state = seed % 2147483647 || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 16807) % 2147483647;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function HomeView({ onBrowse }: HomeViewProps) {
  const { entries, byKey, recentKeys, history, favourites, steam, currentUser, linkSteam, loading } = useLibrary();
  const flashhub = useMemo(() => entries.filter(e => e.launch === 'flashhub'), [entries]);
  const recent = useMemo(() => recentKeys.map(k => byKey.get(k)).filter(Boolean) as LibraryEntry[], [recentKeys, byKey]);
  const favouriteEntries = useMemo(() => favourites.map(k => byKey.get(k)).filter(Boolean) as LibraryEntry[], [favourites, byKey]);

  // A player with nothing played or kept yet sees games before empty shelves
  const firstRun = recent.length === 0 && favouriteEntries.length === 0;

  // The lead: the last game played; for a new player, today's pick from the games with full
  // art. Steam's wide art is missing for a few apps, so a pick whose art 404s is skipped.
  const [missingArt, setMissingArt] = useState<Set<string>>(() => new Set());
  const lead = useMemo(() => {
    if (recent[0]) return { entry: recent[0], continuing: true };
    const withArt = flashhub.filter(e => e.heroArt && !missingArt.has(e.key));
    const pool = withArt.length ? withArt : flashhub;
    return pool.length ? { entry: pool[dayNumber() % pool.length], continuing: false } : null;
  }, [recent, flashhub, missingArt]);

  // Counted plays this month, by everyone; a game nobody has played this month is not "popular"
  const popular = useMemo(
    () =>
      flashhub
        .filter(e => (e.plays?.recent ?? 0) > 0)
        .sort((a, b) => b.plays!.recent - a.plays!.recent || b.plays!.total - a.plays!.total)
        .slice(0, 6),
    [flashhub]
  );

  // Games the hub has dated (it arrived after the starting catalogue), last 60 days, newest first
  const newest = useMemo(() => {
    const cutoff = new Date(Date.now() - 60 * 86400000).toISOString();
    return flashhub
      .filter(e => e.addedAt && e.addedAt >= cutoff)
      .sort((a, b) => b.addedAt!.localeCompare(a.addedAt!))
      .slice(0, 6);
  }, [flashhub]);

  const discovery = (
    <>
      {/* A row of one or two looks like a mistake: popular needs three games played this month */}
      {popular.length >= 3 && (
        <Section
          id="popular"
          title="Popular on Flashhub"
          note="Most played this month, by everyone."
          action={{ label: 'View all', href: hrefFor({ name: 'library', tab: 'all' }) }}
        >
          <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
            {popular.map((entry, i) => (
              <div key={entry.key} className={railItemClass(i)}>
                <GameCard entry={entry} meta={`${entry.plays!.recent.toLocaleString()} ${entry.plays!.recent === 1 ? 'play' : 'plays'} this month`} />
              </div>
            ))}
          </div>
        </Section>
      )}
      {newest.length > 0 && (
        <Section id="new" title="New on Flashhub" note="Added in the last two months.">
          <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
            {newest.map((entry, i) => (
              <div key={entry.key} className={railItemClass(i)}>
                <GameCard
                  entry={entry}
                  meta={`Added ${new Date(entry.addedAt!).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                />
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );

  // "Because you played …": seeded by the most recent games from both libraries. A Steam game
  // needs its store genres to be a seed, so only the two most recent ones are looked up.
  const seeds = useMemo(() => recent.slice(0, 5), [recent]);
  const steamSeedIds = useMemo(
    () => seeds.filter(e => e.launch === 'steam' && e.steamAppId).slice(0, 2).map(e => e.steamAppId!),
    [seeds]
  );
  const seedStore = useStoreDetailsFor(steamSeedIds);
  const recommendations = useMemo(
    () =>
      recommend({
        seeds,
        candidates: flashhub,
        history,
        genresOf: e => {
          if (e.launch !== 'steam') return e.genres;
          const details = e.steamAppId ? seedStore.get(e.steamAppId)?.details : null;
          return details && details.type === 'game' ? details.genres : [];
        }
      }),
    [seeds, flashhub, history, seedStore]
  );

  const becauseYouPlayed = recommendations.map(rec => (
    <Section
      key={rec.seed.key}
      id={`because-${rec.seed.key.replace(/[^a-z0-9]/gi, '-')}`}
      title={`Because you played ${rec.seed.title}`}
      note={`${rec.seed.launch === 'steam' ? 'On Steam. ' : ''}These share ${rec.sharedGenres.slice(0, 3).join(', ')} with it, and play right here.`}
    >
      <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
        {rec.games.map((entry, i) => (
          <div key={entry.key} className={railItemClass(i)}>
            <GameCard entry={entry} />
          </div>
        ))}
      </div>
    </Section>
  ));

  const picks = useMemo(() => {
    const played = new Set(recentKeys);
    const suggested = new Set(recommendations.flatMap(r => r.games.map(g => g.key)));
    const unplayed = flashhub.filter(e => !played.has(e.key) && !suggested.has(e.key) && e.key !== lead?.entry.key);
    return seededPick(unplayed, dayNumber(), 12);
  }, [flashhub, recentKeys, lead, recommendations]);

  const runtimeCounts = useMemo(() => {
    const counts = new Map<Runtime, number>();
    entries.forEach(e => counts.set(e.runtime, (counts.get(e.runtime) || 0) + 1));
    return RUNTIME_ORDER.filter(r => counts.get(r)).map(r => ({ runtime: r, count: counts.get(r)! }));
  }, [entries]);

  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    flashhub.forEach(e => e.genres.forEach(g => counts.set(g, (counts.get(g) || 0) + 1)));
    return Array.from(counts.entries())
      .filter(([, n]) => n >= 5)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);
  }, [flashhub]);

  const leadLine = (entry: LibraryEntry, continuing: boolean): string => {
    if (entry.launch === 'steam') {
      const s = entry.steam!;
      return [
        'Opens in Steam',
        formatWhen(s.lastPlayedAt) && `last played ${formatWhen(s.lastPlayedAt)!.toLowerCase()}`,
        `${formatMinutes(s.playtimeMinutes)} played`
      ].filter(Boolean).join(' · ');
    }
    const record = history[entry.key];
    if (continuing) {
      const when = formatWhen(record?.lastPlayedAt);
      return [
        `Continue · ${entry.runtime}`,
        when && `last played ${when.toLowerCase()}`,
        record?.totalSeconds ? `${formatSeconds(record.totalSeconds)} played` : null
      ].filter(Boolean).join(' · ');
    }
    return [`Featured today · ${entry.runtime}`, entry.genres.slice(0, 2).join(', ')].filter(Boolean).join(' · ');
  };

  const recentMeta = (entry: LibraryEntry): string => {
    if (entry.launch === 'steam') {
      return ['Steam', formatWhen(entry.steam?.lastPlayedAt)].filter(Boolean).join(' · ');
    }
    const record = history[entry.key];
    return [formatWhen(record?.lastPlayedAt) || 'Played before', record?.totalSeconds ? formatSeconds(record.totalSeconds) : null]
      .filter(Boolean)
      .join(' · ');
  };

  const finding = recent[0]
    ? `You last played ${recent[0].title}${formatWhen(recent[0].launch === 'steam' ? recent[0].steam?.lastPlayedAt : history[recent[0].key]?.lastPlayedAt) ? `, ${formatWhen(recent[0].launch === 'steam' ? recent[0].steam?.lastPlayedAt : history[recent[0].key]?.lastPlayedAt)!.toLowerCase()}` : ''}.`
    : `${flashhub.length.toLocaleString()} games play right here in the browser. Pick one, or bring in your Steam library.`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold">Home</h1>
        <p className="mt-1 text-[14px] text-muted">{loading ? 'Loading the catalogue…' : finding}</p>
      </div>

      {loading ? (
        <div className="skeleton h-[300px] sm:h-[340px]" aria-hidden />
      ) : lead ? (
        <FeaturedBanner
          entry={lead.entry}
          line={leadLine(lead.entry, lead.continuing)}
          onHeroError={key => {
            if (!lead.continuing) setMissingArt(prev => new Set(prev).add(key));
          }}
        />
      ) : null}

      {firstRun ? (
        <>
      <Section id="picks" title="A few to try" note="Games you have not played yet. A new set every day.">
        <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
          {loading
            ? Array.from({ length: 12 }, (_, i) => <GameCardSkeleton key={i} />)
            : picks.map(entry => <GameCard key={entry.key} entry={entry} />)}
        </div>
      </Section>
          {discovery}
      {/* First run: games first, then one line on what will collect here */}
      <Section id="yours" title="Your games">
        <EmptyBlock
          action={
            steam.status === 'signed-out' || steam.status === 'not-linked' ? (
              <button type="button" onClick={linkSteam} className="btn-ghost h-9 flex-none px-4 text-[13px]">
                {currentUser ? 'Sign in through Steam' : 'Sign in to link Steam'}
              </button>
            ) : undefined
          }
        >
          Games you play and favourite collect here
          {steam.status === 'signed-out' || steam.status === 'not-linked' ? ', beside your Steam library once it is linked.' : '.'}
        </EmptyBlock>
      </Section>
        </>
      ) : (
        <>
      <Section
        id="recent"
        title="Jump back in"
        note={steam.status === 'ready' ? 'Flashhub and Steam, by when you last played.' : undefined}
        action={recent.length > 1 ? { label: 'View all', href: hrefFor({ name: 'library', tab: 'recent' }) } : undefined}
      >
        {recent.length > 1 ? (
          <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
            {recent.slice(1, 7).map((entry, i) => (
              <div key={entry.key} className={railItemClass(i)}>
                <GameCard entry={entry} meta={recentMeta(entry)} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyBlock>
            {recent.length === 1
              ? 'The next games you play line up here beside it, newest first.'
              : 'Games you play show up here, newest first, with how long you played them.'}
          </EmptyBlock>
        )}
      </Section>
      {becauseYouPlayed}
      {steam.status !== 'ready' && steam.status !== 'loading' && (
        <Section id="steam" title="Your Steam library">
          <EmptyBlock
            action={
              steam.status === 'signed-out' || steam.status === 'not-linked' ? (
                <button type="button" onClick={linkSteam} className="btn-ghost h-9 flex-none px-4 text-[13px]">
                  {currentUser ? 'Sign in through Steam' : 'Sign in to link Steam'}
                </button>
              ) : (
                <a href={hrefFor({ name: 'library', tab: 'steam' })} className="btn-ghost h-9 flex-none px-4 text-[13px]">
                  See why
                </a>
              )
            }
          >
            {steam.status === 'signed-out' || steam.status === 'not-linked'
              ? 'Link your Steam account and your Steam games join this library, marked to open in Steam.'
              : steam.status === 'private'
                ? 'Steam is hiding this account’s games: its game details are set to private.'
                : steam.status === 'needs-key'
                  ? 'This server has no Steam Web API key yet, so Steam libraries cannot be read.'
                  : 'Steam did not answer just now.'}
          </EmptyBlock>
        </Section>
      )}
      {/* A link made before Flashhub could check ownership keeps working, and asks to be confirmed */}
      {steam.status !== 'signed-out' && !!currentUser?.steamId && !currentUser.steamVerifiedAt && (
        <Section id="steam-confirm" title="Confirm your Steam account">
          <EmptyBlock action={<button type="button" onClick={linkSteam} className="btn-ghost h-9 flex-none px-4 text-[13px]">Confirm with Steam</button>}>
            This Steam account was linked before Flashhub could check who owns it. It keeps working until you confirm it with Steam.
          </EmptyBlock>
        </Section>
      )}
      <Section
        id="favourites"
        title="Favourites"
        action={favouriteEntries.length ? { label: 'View all', href: hrefFor({ name: 'library', tab: 'favourites' }) } : undefined}
      >
        {favouriteEntries.length ? (
          <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
            {favouriteEntries.slice(0, 6).map((entry, i) => (
              <div key={entry.key} className={railItemClass(i)}>
                <GameCard entry={entry} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyBlock>Press the heart on any game to keep it here.</EmptyBlock>
        )}
      </Section>
          {discovery}
      <Section id="picks" title="A few to try" note="Games you have not played yet. A new set every day.">
        <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
          {loading
            ? Array.from({ length: 12 }, (_, i) => <GameCardSkeleton key={i} />)
            : picks.map(entry => <GameCard key={entry.key} entry={entry} />)}
        </div>
      </Section>
        </>
      )}

      <Section id="browse" title="Browse the library">
        <div className="grid gap-[14px] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="bg-paper p-5">
            <h3 className="text-[14px] font-semibold">By how it runs</h3>
            <ul className="mt-3">
              {runtimeCounts.map(({ runtime, count }) => (
                <li key={runtime}>
                  <button
                    type="button"
                    onClick={() => onBrowse({ runtime })}
                    className="flex h-10 w-full items-center justify-between border-b border-hair text-left text-[14px] text-muted transition-colors duration-150 last:border-b-0 hover:text-ink"
                  >
                    <span>{runtime === 'Steam' ? 'Steam library' : runtime}</span>
                    <span className="tabular-nums text-faint">{count.toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-paper p-5">
            <h3 className="text-[14px] font-semibold">By genre</h3>
            <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {genreCounts.map(([genre, count]) => (
                <li key={genre}>
                  <button
                    type="button"
                    onClick={() => onBrowse({ genre })}
                    className="flex h-10 w-full items-center justify-between border-b border-hair text-left text-[14px] text-muted transition-colors duration-150 hover:text-ink"
                  >
                    <span>{genre}</span>
                    <span className="tabular-nums text-faint">{count.toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
