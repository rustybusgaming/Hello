import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, Heart } from 'lucide-react';
import { SteamAchievementSet } from '../types';
import {
  LibraryEntry,
  RUNTIME_DESCRIPTION,
  formatMinutes,
  formatSeconds,
  formatWhen,
  steamInstallUrl,
  steamStoreUrl
} from '../lib/library';
import { isFlashGame } from '../lib/games';
import { useLibrary } from '../lib/libraryContext';
import { gameHref, hrefFor } from '../lib/router';
import { GameArt } from './GameArt';
import { LaunchButton } from './LaunchButton';
import { EmptyBlock, CARD_GRID, railItemClass } from './Section';
import { GameCard } from './GameCard';
import { CollectionMenu } from './CollectionMenu';
import { Screenshots, StoreCredit, platformList, storeMatches, storeNote } from './StoreSections';
import { useStoreDetails } from '../lib/useStoreDetails';
import { meaningfulGenres } from '../lib/recommend';

/** Where a Flashhub game's files come from, in words, with a link where one exists. */
function sourceOf(entry: LibraryEntry): { label: string; href?: string } {
  const game = entry.game!;
  if (game.source === 'custom') return { label: 'Uploaded to this hub' };
  if (game.source === 'archive') {
    const item = game.embedUrl.match(/archive-swf\/([^/?&]+)/)?.[1] || game.swfUrl?.match(/archive-swf\/([^/?&]+)/)?.[1];
    return item
      ? { label: 'Internet Archive', href: `https://archive.org/details/${decodeURIComponent(item)}` }
      : { label: 'Internet Archive' };
  }
  if (/\/api\/(webports|webport-proxy)\//.test(game.embedUrl)) {
    return { label: 'genizy/web-port', href: 'https://github.com/genizy/web-port' };
  }
  if (/\/api\/quasar\//.test(game.embedUrl)) {
    return { label: 'slqntdevss/quasar', href: 'https://github.com/slqntdevss/quasar' };
  }
  return { label: 'Flashhub catalogue' };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-hair py-2.5 last:border-b-0">
      <dt className="flex-none text-[13px] text-faint">{label}</dt>
      <dd className="min-w-0 text-right text-[14px] text-ink">{children}</dd>
    </div>
  );
}

/** One container split into equal cells: label above value, nothing else. */
function StatStrip({ stats }: { stats: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className={`grid grid-cols-2 bg-paper ${stats.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`px-5 py-4 ${i % 2 === 1 ? 'border-l border-hair' : ''} ${i >= 2 ? 'border-t border-hair md:border-t-0' : ''} ${i > 0 ? 'md:border-l' : ''}`}
        >
          <dt className="text-[13px] text-faint">{s.label}</dt>
          <dd className="mt-1 text-[24px] font-normal leading-tight tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const Dash = () => <span className="text-faint">—</span>;
/** A missing value in a stat cell: words at the label's size, never a dash at figure size */
const Quiet = ({ children }: { children: React.ReactNode }) => <span className="text-[14px] text-faint">{children}</span>;

export function GameDetailView({ entryKey }: { entryKey: string }) {
  const { byKey, entries, ownedSteam, steam, loading, isFavourite, toggleFavourite, history, currentUser } = useLibrary();
  const entry = byKey.get(entryKey);
  const [heroFailed, setHeroFailed] = useState(false);
  useEffect(() => {
    setHeroFailed(false);
    window.scrollTo(0, 0);
  }, [entryKey]);

  if (!entry) {
    const waiting = loading || (entryKey.startsWith('steam:') && steam.status === 'loading');
    return (
      <div>
        <h1 className="text-[20px] font-semibold">{waiting ? 'Loading…' : 'Game not found'}</h1>
        {!waiting && (
          <div className="mt-6">
            <EmptyBlock action={<a href={hrefFor({ name: 'library', tab: 'all' })} className="btn-ghost h-9 px-4 text-[13px]">Open the library</a>}>
              {entryKey.startsWith('steam:')
                ? 'This Steam game is not in the linked Steam library, or the library could not be read.'
                : 'This game is not in the catalogue. It may have been hidden or removed.'}
            </EmptyBlock>
          </div>
        )}
      </div>
    );
  }

  const isSteam = entry.launch === 'steam';
  const favourite = isFavourite(entry.key);
  const hasHero = !!entry.heroArt && !heroFailed;
  const alsoOnSteam = !isSteam && entry.steamAppId ? ownedSteam.get(entry.steamAppId) : undefined;
  const alsoInFlashhub = isSteam ? entries.filter(e => e.launch === 'flashhub' && e.steamAppId === entry.steamAppId) : [];

  const meta = isSteam
    ? 'In your Steam library · opens in the Steam client'
    : [`Plays in Flashhub`, entry.runtime, ...entry.genres.slice(0, 3)].join(' · ');

  return (
    <article>
      <a href={hrefFor({ name: 'library', tab: 'all' })} onClick={e => { if (window.history.length > 1) { e.preventDefault(); window.history.back(); } }} className="mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </a>

      {hasHero && (
        <div className="relative mb-6 h-[200px] overflow-hidden bg-paper sm:h-[280px]">
          <img src={entry.heroArt!} alt="" onError={() => setHeroFailed(true)} className="h-full w-full object-cover" />
        </div>
      )}

      {/* The page header is the game itself */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        {/* On a phone the banner already shows the game; the cover returns from sm up */}
        <div className={`art-frame aspect-[4/3] w-full flex-none sm:block sm:w-[208px] ${hasHero ? 'hidden' : ''}`}>
          <GameArt entry={entry} eager />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]">{entry.title}</h1>
          <p className="mt-1.5 text-[14px] text-muted">{meta}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LaunchButton entry={entry} size="lg" />
            {isSteam && entry.steamAppId && (
              <>
                <a href={steamInstallUrl(entry.steamAppId)} className="btn-ghost h-11 px-4 text-[14px]">
                  <Download className="h-4 w-4" aria-hidden /> Install
                </a>
                <a href={steamStoreUrl(entry.steamAppId)} target="_blank" rel="noopener noreferrer" className="btn-ghost h-11 px-4 text-[14px]">
                  Store page
                </a>
              </>
            )}
            {!isSteam && (
              <a href={entry.game!.embedUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost h-11 px-4 text-[14px]">
                <ExternalLink className="h-4 w-4" aria-hidden /> Open in a new tab
              </a>
            )}
            <button
              type="button"
              onClick={() => toggleFavourite(entry.key)}
              aria-pressed={favourite}
              className={`btn-ghost h-11 px-4 text-[14px] ${favourite ? 'text-accent-lit' : ''}`}
            >
              <Heart className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} aria-hidden />
              {favourite ? 'Favourite' : 'Add to favourites'}
            </button>
            <CollectionMenu entryKey={entry.key} />
          </div>
          {isSteam && (
            <p className="mt-3 text-[13px] text-faint">
              Flashhub cannot run Steam games itself. Open in Steam starts the Steam client on this computer; your browser asks first.
            </p>
          )}
        </div>
      </header>

      {isSteam ? (
        <SteamBody entry={entry} alsoInFlashhub={alsoInFlashhub} canReadAchievements={!!currentUser} />
      ) : (
        <FlashhubBody entry={entry} alsoOnSteam={alsoOnSteam} history={history} />
      )}
    </article>
  );
}

function FlashhubBody({
  entry,
  alsoOnSteam,
  history
}: {
  entry: LibraryEntry;
  alsoOnSteam?: LibraryEntry;
  history: ReturnType<typeof useLibrary>['history'];
}) {
  const game = entry.game!;
  const canSave = isFlashGame(game);
  const record = history[entry.key];
  const source = sourceOf(entry);
  const [slots, setSlots] = useState<number | null>(null);

  useEffect(() => {
    if (!canSave) return;
    let cancelled = false;
    fetch(`/api/saves?gameId=${encodeURIComponent(game.id)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(d => {
        if (!cancelled && d?.status === 'ok') setSlots(Array.isArray(d.data) ? d.data.length : 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game.id, canSave]);

  const runtimes = game.mirrors?.length || 1;

  // Games that share the most genres with this one; ties keep catalogue order
  const { entries, removeFromHistory } = useLibrary();

  // A browser port of a Steam game: the store's page for the original, when it really is one
  const store = useStoreDetails(entry.steamAppId);
  const original = store?.status === 'done' && store.result.details && storeMatches(entry.title, store.result.details) ? store.result.details : null;
  const similar = useMemo(() => {
    if (!entry.genres.length) return [];
    const wanted = new Set(entry.genres);
    return entries
      .filter(e => e.launch === 'flashhub' && e.key !== entry.key)
      .map((e, index) => ({ e, index, score: e.genres.filter(g => wanted.has(g)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(x => x.e)
      .slice(0, 6);
  }, [entries, entry]);

  return (
    <div className="mt-8 grid gap-[14px] lg:grid-cols-6">
      <section aria-labelledby="stats-heading" className="lg:col-span-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="stats-heading" className="text-[16px] font-semibold">Your play</h2>
          {record && (
            <button
              type="button"
              onClick={() => removeFromHistory(entry.key)}
              className="text-[13px] font-semibold text-muted underline decoration-control underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              Remove from recently played
            </button>
          )}
        </div>
        <StatStrip
          stats={[
            { label: 'Last played', value: formatWhen(record?.lastPlayedAt) || <Quiet>{record ? 'Before this browser kept times' : 'Not played yet'}</Quiet> },
            { label: 'Time played', value: formatSeconds(record?.totalSeconds ?? 0) },
            { label: 'Sessions', value: (record?.sessions ?? 0).toLocaleString() },
            { label: 'Save slots', value: canSave ? (slots === null ? <Quiet>Checking…</Quiet> : slots.toLocaleString()) : <Quiet>Flash games only</Quiet> }
          ]}
        />
      </section>

      {/* About (or, with no description, games like this one) beside the facts */}
      {entry.description ? (
        <section aria-labelledby="about-heading" className="self-start bg-paper p-5 lg:col-span-4">
          <h2 id="about-heading" className="text-[16px] font-semibold">About</h2>
          <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink">{entry.description}</p>
        </section>
      ) : (
        <section aria-labelledby="similar-heading" className="lg:col-span-4">
          <h2 id="similar-heading" className="mb-3 text-[16px] font-semibold">More like this</h2>
          {similar.length ? (
            <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3">
              {similar.slice(0, 3).map((e, i) => (
                // Two on a phone, three from sm up: never a lone card on its own row
                <div key={e.key} className={i === 2 ? 'hidden sm:block' : ''}>
                  <GameCard entry={e} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock>No other games share this one's genres yet.</EmptyBlock>
          )}
        </section>
      )}

      <section aria-labelledby="details-heading" className="bg-paper p-5 lg:col-span-2">
        <h2 id="details-heading" className="text-[16px] font-semibold">Details</h2>
        <DetailsList entry={entry} source={source} runtimes={runtimes} canSave={canSave} />
      </section>

      {entry.description && similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="pt-6 lg:col-span-6">
          <h2 id="similar-heading" className="mb-3 text-[16px] font-semibold">More like this</h2>
          <div className={CARD_GRID}>
            {similar.slice(0, 6).map((e, i) => (
              <div key={e.key} className={railItemClass(i)}>
                <GameCard entry={e} />
              </div>
            ))}
          </div>
        </section>
      )}

      {original && entry.steamAppId && (
        <section aria-labelledby="original-heading" className="flex flex-col gap-4 bg-paper p-5 sm:flex-row sm:items-start sm:justify-between lg:col-span-6">
          <div className="min-w-0">
            <h2 id="original-heading" className="text-[16px] font-semibold">The original on Steam</h2>
            {original.description && <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-muted">{original.description}</p>}
            <p className="mt-2 text-[13px] text-faint">
              {[original.developers.join(', '), original.releaseDate].filter(Boolean).join(' · ')}
              {original.developers.length || original.releaseDate ? '. ' : ''}From the Steam store. This page plays the browser version.
            </p>
          </div>
          <a href={steamStoreUrl(entry.steamAppId)} target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 flex-none px-4 text-[13px]">
            Store page
          </a>
        </section>
      )}

      {alsoOnSteam && (
        <section aria-labelledby="steam-too" className="flex flex-col gap-3 bg-paper p-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-6">
          <div>
            <h2 id="steam-too" className="text-[16px] font-semibold">Also in your Steam library</h2>
            <p className="mt-1 text-[14px] text-muted">
              {alsoOnSteam.title} · {formatMinutes(alsoOnSteam.steam?.playtimeMinutes ?? 0)} played on Steam. This page is the browser version.
            </p>
          </div>
          <a href={gameHref(alsoOnSteam.key)} className="btn-ghost h-9 flex-none px-4 text-[13px]">Steam version</a>
        </section>
      )}
    </div>
  );
}

/** When a game arrived, or for the starting catalogue, since when the hub has had it. */
function addedLabel(addedAt: string | null | undefined, since: string | null): string {
  const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  if (addedAt) return date(addedAt);
  return since ? `Before ${date(since)}` : 'Before records began';
}

function DetailsList({
  entry,
  source,
  runtimes,
  canSave
}: {
  entry: LibraryEntry;
  source: { label: string; href?: string };
  runtimes: number;
  canSave: boolean;
}) {
  const { catalogueSince } = useLibrary();
  return (
    <dl className="mt-2">
      <Fact label="Launches in">Flashhub player</Fact>
      <Fact label="Runs on">{RUNTIME_DESCRIPTION[entry.runtime]}</Fact>
      <Fact label="Genre">{entry.genres.length ? entry.genres.join(', ') : <Dash />}</Fact>
      <Fact label="Source">
        {source.href ? (
          <a href={source.href} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-control underline-offset-4 hover:decoration-ink">
            {source.label}
          </a>
        ) : (
          source.label
        )}
      </Fact>
      <Fact label="Ways to run it">{runtimes === 1 ? 'One' : `${runtimes}, switchable in the player`}</Fact>
      <Fact label="Plays on Flashhub">
        {entry.plays ? `${entry.plays.recent.toLocaleString()} this month · ${entry.plays.total.toLocaleString()} in all` : <Dash />}
      </Fact>
      <Fact label="Added">{addedLabel(entry.addedAt, catalogueSince)}</Fact>
      <Fact label="Save slots">{canSave ? 'Yes, in the player' : 'No; the game keeps its own progress'}</Fact>
    </dl>
  );
}

function SteamBody({
  entry,
  alsoInFlashhub,
  canReadAchievements
}: {
  entry: LibraryEntry;
  alsoInFlashhub: LibraryEntry[];
  canReadAchievements: boolean;
}) {
  const s = entry.steam!;
  const { entries } = useLibrary();
  const store = useStoreDetails(s.appId);
  const details = store?.status === 'done' ? store.result.details : null;
  const [achievements, setAchievements] = useState<SteamAchievementSet | null>(null);
  const [achievementNote, setAchievementNote] = useState<string | null>(null);

  useEffect(() => {
    if (!canReadAchievements) return;
    let cancelled = false;
    setAchievements(null);
    setAchievementNote(null);
    fetch(`/api/steam/achievements/${s.appId}`)
      .then(async res => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && body?.status === 'ok') setAchievements(body.data);
        else setAchievementNote(body?.error || 'Steam has no achievement data for this game.');
      })
      .catch(() => !cancelled && setAchievementNote('Could not reach Steam for achievements.'));
    return () => {
      cancelled = true;
    };
  }, [s.appId, canReadAchievements]);

  const recentUnlocks = useMemo(
    () => (achievements?.achievements || []).filter(a => a.unlocked).slice(0, 6),
    [achievements]
  );

  // Something like it that starts right here: Flashhub games sharing the store's genres
  const playHere = useMemo(() => {
    if (!details) return [];
    const wanted = new Set(meaningfulGenres(details.genres).map(g => g.toLowerCase()));
    if (!wanted.size) return [];
    return entries
      .filter(e => e.launch === 'flashhub')
      .map((e, index) => ({ e, index, shared: e.genres.filter(g => wanted.has(g.toLowerCase())).length }))
      .filter(x => x.shared > 0)
      .sort((a, b) => b.shared - a.shared || (b.e.plays?.recent ?? 0) - (a.e.plays?.recent ?? 0) || a.index - b.index)
      .slice(0, 4)
      .map(x => x.e);
  }, [details, entries]);

  const note = storeNote(store);

  return (
    <div className="mt-8 grid gap-[14px] lg:grid-cols-6">
      <section aria-labelledby="steam-stats" className="lg:col-span-6">
        <h2 id="steam-stats" className="mb-3 text-[16px] font-semibold">Your play on Steam</h2>
        <StatStrip
          stats={[
            { label: 'Time played', value: formatMinutes(s.playtimeMinutes) },
            { label: 'Last two weeks', value: formatMinutes(s.playtimeRecentMinutes) },
            { label: 'Last played', value: formatWhen(s.lastPlayedAt) || <Quiet>Never launched</Quiet> }
          ]}
        />
      </section>

      {/* About and the screenshots share the left column, so the row ends level with Details */}
      <div className="flex flex-col gap-[14px] self-start lg:col-span-4">
      <section aria-labelledby="about-heading" className="bg-paper p-5">
        <h2 id="about-heading" className="text-[16px] font-semibold">About</h2>
        {details?.description ? (
          <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink">{details.description}</p>
        ) : (
          <p className="mt-3 text-[14px] text-muted">{note || 'The Steam store has no description for this game.'}</p>
        )}
        <StoreCredit load={store} />
      </section>
        {details && <Screenshots details={details} inColumn />}
      </div>

      <section aria-labelledby="steam-details" className="self-start bg-paper p-5 lg:col-span-2">
        <h2 id="steam-details" className="text-[16px] font-semibold">Details</h2>
        <dl className="mt-2">
          <Fact label="Launches in">Steam client</Fact>
          {details?.developers.length ? <Fact label="Developer">{details.developers.join(', ')}</Fact> : null}
          {details?.publishers.length ? <Fact label="Publisher">{details.publishers.join(', ')}</Fact> : null}
          {details?.releaseDate ? <Fact label={details.comingSoon ? 'Coming' : 'Released'}>{details.releaseDate}</Fact> : null}
          {details?.genres.length ? <Fact label="Genre">{details.genres.join(', ')}</Fact> : null}
          {details ? <Fact label="Platforms">{platformList(details.platforms)}</Fact> : null}
          {details?.controllerSupport ? <Fact label="Controller">{details.controllerSupport === 'full' ? 'Full support' : 'Partial support'}</Fact> : null}
          {details?.metacritic ? (
            <Fact label="Metacritic">
              {details.metacritic.url ? (
                <a href={details.metacritic.url} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-control underline-offset-4 hover:decoration-ink">
                  {details.metacritic.score}
                </a>
              ) : (
                details.metacritic.score
              )}
            </Fact>
          ) : null}
          <Fact label="Steam app">{s.appId}</Fact>
          <Fact label="In Flashhub">
            {alsoInFlashhub.length ? (
              <a href={gameHref(alsoInFlashhub[0].key)} className="text-ink underline decoration-control underline-offset-4 hover:decoration-ink">
                {alsoInFlashhub[0].title}
              </a>
            ) : (
              'No browser version'
            )}
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="achievements-heading" className="self-start bg-paper p-5 lg:col-span-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="achievements-heading" className="text-[16px] font-semibold">Achievements</h2>
          {achievements && achievements.total > 0 && (
            <span className="text-[13px] tabular-nums text-muted">
              {achievements.unlocked.toLocaleString()} of {achievements.total.toLocaleString()}
            </span>
          )}
        </div>
        {achievements && achievements.total > 0 ? (
          <>
            {/* The one data hue goes on the main data element: progress at its true ratio */}
            <div className="mt-3 h-2 bg-shade" role="img" aria-label={`${achievements.unlocked} of ${achievements.total} achievements unlocked`}>
              <div className="h-full bg-accent" style={{ width: `${(achievements.unlocked / achievements.total) * 100}%` }} />
            </div>
            {recentUnlocks.length > 0 ? (
              <ul className="mt-4">
                {recentUnlocks.map(a => (
                  <li key={a.id} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
                    {a.icon ? <img src={a.icon} alt="" className="h-8 w-8 flex-none bg-shade" loading="lazy" /> : <span className="h-8 w-8 flex-none bg-shade" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-ink">{a.name}</p>
                      {a.description && <p className="truncate text-[13px] text-faint">{a.description}</p>}
                    </div>
                    <time className="flex-none text-[13px] text-faint">{formatWhen(a.unlockedAt)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] text-muted">None unlocked yet.</p>
            )}
          </>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            {!canReadAchievements ? 'Sign in to see your achievements.' : achievementNote || 'Loading from Steam…'}
          </p>
        )}
      </section>

      {/* The bridge between the two libraries: Steam taste, games that start right here */}
      <section aria-labelledby="play-here-heading" className="self-start bg-paper p-5 lg:col-span-2">
        <h2 id="play-here-heading" className="text-[16px] font-semibold">Play something like it here</h2>
        {playHere.length ? (
          <>
            <p className="mt-1 text-[13px] text-faint">Flashhub games that share its genres, no Steam needed.</p>
            <ul className="mt-3">
              {playHere.map(e => (
                <li key={e.key}>
                  <a href={gameHref(e.key)} className="flex items-center gap-3 border-b border-hair py-2.5 transition-colors duration-150 last:border-b-0 hover:text-ink">
                    <span className="h-9 w-12 flex-none overflow-hidden bg-shade">
                      <GameArt entry={e} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-ink">{e.title}</span>
                      <span className="block truncate text-[12px] text-faint">{[e.runtime, e.genres[0]].filter(Boolean).join(' · ')}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-[14px] text-muted">
            {store?.status === 'loading' ? 'Matching it with the catalogue…' : 'Nothing in the catalogue shares this game’s genres yet.'}
          </p>
        )}
      </section>
    </div>
  );
}
