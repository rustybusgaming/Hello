import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Clock, Gamepad2, Star, ExternalLink, Loader2, KeyRound, Lock, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import {
  SteamLibrary,
  SteamAchievementOverview,
  SteamAchievementSet,
  SteamGameSummary
} from '../types';

interface SteamPanelProps {
  /** SteamID64 of the linked account; the panel stays hidden without one. */
  steamId?: string;
}

const STEAM_BLUE = '#66c0f4';

function formatHours(minutes: number): string {
  if (!minutes) return '0h';
  const hours = minutes / 60;
  if (hours < 1) return `${minutes}m`;
  if (hours < 100) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours).toLocaleString()}h`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Steam publishes global unlock rates, which is what makes an achievement feel rare. */
function rarityLabel(percent: number | null): { text: string; className: string } | null {
  if (percent === null) return null;
  if (percent < 5) return { text: `${percent.toFixed(1)}% ultra rare`, className: 'text-accent border-accent/40 bg-accent/10' };
  if (percent < 20) return { text: `${percent.toFixed(1)}% rare`, className: 'text-accent border-accent/40 bg-accent/10' };
  return { text: `${percent.toFixed(0)}% of players`, className: 'text-ink/60 border-rule bg-ink/5' };
}

export function SteamPanel({ steamId }: SteamPanelProps) {
  const [library, setLibrary] = useState<SteamLibrary | null>(null);
  const [overview, setOverview] = useState<SteamAchievementOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; needsKey: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [achievementSet, setAchievementSet] = useState<SteamAchievementSet | null>(null);
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const load = async () => {
    if (!steamId) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const [libRes, achRes] = await Promise.all([
        fetch('/api/steam/library'),
        fetch('/api/steam/achievements')
      ]);

      const libData = await libRes.json().catch(() => ({}));
      if (!libRes.ok) {
        setError({ message: libData.error || 'Steam is unavailable', needsKey: !!libData.needsKey });
        return;
      }

      setLibrary(libData.data);
      if (libData.notice) setNotice(libData.notice);

      const achData = await achRes.json().catch(() => ({}));
      if (achRes.ok) setOverview(achData.data);
    } catch (err: any) {
      setError({ message: err.message || 'Could not reach the server', needsKey: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [steamId]);

  // Pull the full achievement list for whichever game is open
  useEffect(() => {
    if (!selectedApp) return;
    let cancelled = false;

    setAchievementsLoading(true);
    setAchievementError(null);
    setAchievementSet(null);

    fetch(`/api/steam/achievements/${selectedApp}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setAchievementError(data.error || 'Steam has no achievements for this game');
          return;
        }
        setAchievementSet(data.data);
      })
      .catch(err => {
        if (!cancelled) setAchievementError(err.message);
      })
      .finally(() => {
        if (!cancelled) setAchievementsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedApp]);

  const visibleAchievements = useMemo(() => {
    if (!achievementSet) return [];
    if (filter === 'unlocked') return achievementSet.achievements.filter(a => a.unlocked);
    if (filter === 'locked') return achievementSet.achievements.filter(a => !a.unlocked);
    return achievementSet.achievements;
  }, [achievementSet, filter]);

  if (!steamId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-ink/55 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: STEAM_BLUE }} />
        <span className="text-xs">Reading your Steam library…</span>
      </div>
    );
  }

  // Everything past the basic profile needs a Web API key, so say so plainly
  if (error?.needsKey) {
    return (
      <div className="panel p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <KeyRound className="w-4 h-4" style={{ color: STEAM_BLUE }} />
          Steam Web API key required
        </div>
        <p className="text-xs text-ink/60 leading-relaxed">
          Steam retired the public endpoints for libraries and achievements, so this section needs
          a Web API key. Your profile link above keeps working without one.
        </p>
        <ol className="text-xs text-ink/60 space-y-1.5 list-decimal list-inside">
          <li>
            Get a key at{' '}
            <a
              href="https://steamcommunity.com/dev/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: STEAM_BLUE }}
            >
              steamcommunity.com/dev/apikey
            </a>
          </li>
          <li>Add <code className="text-ink/80">STEAM_API_KEY="your-key"</code> to your <code className="text-ink/80">.env</code></li>
          <li>Restart the server and reopen this tab</li>
        </ol>
        <p className="text-[11px] text-ink/45">
          Your Steam profile also has to be public for Steam to share the library.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel p-5 space-y-3">
        <p className="text-xs text-accent">{error.message}</p>
        <button onClick={load} className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  const profile = library?.profile;
  const completion = overview && overview.total > 0 ? Math.round((overview.unlocked / overview.total) * 100) : 0;
  const mostPlayed = library?.topGames?.[0]?.playtimeMinutes || 1;

  return (
    <div className="space-y-5">
      {notice && (
        <div className="p-3 border text-xs" style={{ borderColor: `${STEAM_BLUE}40`, background: `${STEAM_BLUE}14`, color: STEAM_BLUE }}>
          {notice}
        </div>
      )}

      {/* Profile header */}
      {profile && (
        <div className="panel p-4 flex flex-wrap items-center gap-4">
          <img
            src={profile.avatar}
            alt=""
            className="w-16 h-16 object-cover bg-shade"
            style={{ boxShadow: `0 0 0 2px ${STEAM_BLUE}55` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-ink truncate">{profile.personaName}</h4>
              {library?.level !== null && library?.level !== undefined && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold border"
                  style={{ color: STEAM_BLUE, borderColor: `${STEAM_BLUE}55`, background: `${STEAM_BLUE}14` }}
                >
                  LEVEL {library.level}
                </span>
              )}
              <span className={`chip ${profile.state === 'offline' ? 'chip-archive' : 'chip-web'}`}>
                {profile.playingNow ? `In ${profile.playingNow}` : profile.state}
              </span>
            </div>
            <p className="text-[11px] text-ink/55 mt-1 font-mono">
              {profile.steamId}
              {profile.createdAt && ` · joined ${formatDate(profile.createdAt)}`}
              {profile.countryCode && ` · ${profile.countryCode}`}
            </p>
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Steam profile
          </a>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Games', value: library?.gameCount ?? 0, icon: Gamepad2 },
          { label: 'Playtime', value: formatHours(library?.totalPlaytimeMinutes || 0), icon: Clock },
          { label: 'Achievements', value: overview ? `${overview.unlocked}/${overview.total}` : '—', icon: Trophy },
          { label: 'Perfect games', value: overview?.perfectGames ?? 0, icon: Star }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel p-3">
            <span className="eyebrow flex items-center gap-1">
              <Icon className="w-2.5 h-2.5" />
              {label}
            </span>
            <div className="font-display text-lg font-bold text-ink mt-1 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Achievement completion across the games actually played */}
      {overview && overview.total > 0 && (
        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Completion across tracked games</span>
            <span className="font-mono text-xs" style={{ color: STEAM_BLUE }}>{completion}%</span>
          </div>
          <div className="h-1.5 bg-ink/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.6 }}
              className="h-full"
              style={{ background: `linear-gradient(90deg, ${STEAM_BLUE}, #ff8a00)` }}
            />
          </div>
        </div>
      )}

      {/* Recent unlocks */}
      {overview && overview.recent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="hr-accent" />
            <span className="eyebrow">Latest unlocks</span>
          </div>
          <div className="space-y-1.5">
            {overview.recent.slice(0, 5).map(a => {
              const rarity = rarityLabel(a.globalPercent);
              return (
                <div key={`${a.appId}-${a.id}`} className="panel p-2.5 flex items-center gap-3">
                  {a.icon && <img src={a.icon} alt="" className="w-8 h-8 bg-shade flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-ink truncate">{a.name}</div>
                    <div className="text-[10px] text-ink/55 truncate">
                      {a.gameName} · {formatDate(a.unlockedAt)}
                    </div>
                  </div>
                  {rarity && (
                    <span className={`hidden sm:inline text-[9px] px-1.5 py-0.5  border font-mono ${rarity.className}`}>
                      {rarity.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Library, doubling as the achievement browser */}
      {library && library.topGames.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="hr-accent" />
            <span className="eyebrow">Most played · pick a game for its achievements</span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {library.topGames.map((game: SteamGameSummary) => {
              const perGame = overview?.perGame.find(g => g.appId === game.appId);
              const isOpen = selectedApp === game.appId;
              return (
                <button
                  key={game.appId}
                  onClick={() => setSelectedApp(isOpen ? null : game.appId)}
                  className={`panel panel-hover w-full p-2.5 flex items-center gap-3 text-left ${isOpen ? 'border-accent/50' : ''}`}
                >
                  <img
                    src={game.headerUrl}
                    alt=""
                    className="w-16 h-8 object-cover bg-shade flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-ink truncate">{game.name}</div>
                    <div className="h-1 bg-ink/5 mt-1.5 overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${Math.max(3, (game.playtimeMinutes / mostPlayed) * 100)}%`, background: STEAM_BLUE }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-[11px] text-ink/80">{formatHours(game.playtimeMinutes)}</div>
                    {perGame && (
                      <div className="font-mono text-[10px] text-ink/45">{perGame.unlocked}/{perGame.total} 🏆</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements for the selected game */}
      {selectedApp && (
        <div className="panel p-4 space-y-3">
          {achievementsLoading && (
            <div className="flex items-center gap-2 text-xs text-ink/55">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading achievements…
            </div>
          )}

          {achievementError && <p className="text-xs text-ink/60">{achievementError}</p>}

          {achievementSet && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-ink">{achievementSet.gameName}</h4>
                  <p className="text-[11px] text-ink/55">
                    {achievementSet.unlocked} of {achievementSet.total} unlocked
                    {achievementSet.total > 0 && ` · ${Math.round((achievementSet.unlocked / achievementSet.total) * 100)}%`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(['all', 'unlocked', 'locked'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1  text-[11px] font-semibold capitalize transition-all ${
                        filter === f ? 'bg-accent text-ink' : 'btn-ghost'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {visibleAchievements.map(a => {
                  const rarity = rarityLabel(a.globalPercent);
                  return (
                    <div
                      key={a.id}
                      className={`p-2.5  border flex items-start gap-2.5 ${
                        a.unlocked ? 'bg-paper/[0.04] border-rule' : 'bg-shade border-rule/60 opacity-70'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {a.icon ? (
                          <img src={a.icon} alt="" className={`w-9 h-9  bg-shade ${a.unlocked ? '' : 'grayscale'}`} />
                        ) : (
                          <div className="w-9 h-9 bg-shade flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-ink/45" />
                          </div>
                        )}
                        {!a.unlocked && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-ground border border-rule flex items-center justify-center">
                            <Lock className="w-2 h-2 text-ink/55" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-ink truncate">{a.name}</div>
                        {a.description && <p className="text-[10px] text-ink/55 leading-snug line-clamp-2">{a.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {a.unlocked && a.unlockedAt && (
                            <span className="text-[9px] font-mono text-accent">{formatDate(a.unlockedAt)}</span>
                          )}
                          {rarity && (
                            <span className={`text-[9px] px-1.5 py-0.5  border font-mono ${rarity.className}`}>
                              {rarity.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
