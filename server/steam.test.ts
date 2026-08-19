/**
 * Steam client checks, run with: npx tsx server/steam.test.ts
 *
 * Steam's endpoints need a Web API key and a real account, so these drive the client against
 * recorded response shapes instead. What they cover is the part that actually breaks: id
 * resolution, merging player progress with the game schema and global rarity, sort order, and
 * the failure paths for private profiles and a missing key.
 */
import assert from 'assert';

const realFetch = globalThis.fetch;
let routes: Record<string, unknown> = {};
let requested: string[] = [];

function mockFetch(matchers: Record<string, unknown>) {
  routes = matchers;
  requested = [];
  globalThis.fetch = (async (input: any) => {
    const url = String(input);
    requested.push(url);
    const key = Object.keys(routes).find(k => url.includes(k));
    if (!key) {
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' } as any;
    }
    const body = routes[key];
    if (typeof body === 'number') {
      return { ok: false, status: body, json: async () => ({}), text: async () => '' } as any;
    }
    if (typeof body === 'string') {
      return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body } as any;
    }
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) } as any;
  }) as any;
}

const tests: { name: string; run: () => Promise<void> }[] = [];
const test = (name: string, run: () => Promise<void>) => tests.push({ name, run });

test('resolves a profile URL without calling Steam', async () => {
  const steam = await import('./steam');
  mockFetch({});
  const id = await steam.resolveSteamId('https://steamcommunity.com/profiles/76561198000000001');
  assert.strictEqual(id, '76561198000000001');
  assert.strictEqual(requested.length, 0, 'a plain id should not need a request');
});

test('resolves a vanity name through the public XML when no key is set', async () => {
  delete process.env.STEAM_API_KEY;
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({ 'steamcommunity.com/id/': '<profile><steamID64>76561198000000002</steamID64></profile>' });
  assert.strictEqual(await steam.resolveSteamId('someone'), '76561198000000002');
});

test('reports that a key is needed rather than guessing', async () => {
  delete process.env.STEAM_API_KEY;
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({});
  await assert.rejects(() => steam.getOwnedGames('76561198000000003'), (err: any) => {
    assert.strictEqual(err.name, 'SteamUnavailable');
    assert.strictEqual(err.needsKey, true);
    return true;
  });
});

test('an empty library is never mistaken for a missing key', async () => {
  delete process.env.STEAM_API_KEY;
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({});

  // Both rollups fail loudly rather than reporting zero games and zero achievements
  await assert.rejects(() => steam.getLibrarySummary('76561198000000009'), (err: any) => {
    assert.strictEqual(err.needsKey, true);
    return true;
  });
  await assert.rejects(() => steam.getAchievementOverview('76561198000000009'), (err: any) => {
    assert.strictEqual(err.needsKey, true);
    return true;
  });
});

test('never leaks the API key into errors or logs', async () => {
  process.env.STEAM_API_KEY = 'SUPERSECRETKEY123';
  const steam = await import('./steam');
  steam.clearSteamCache();

  // A transport failure in Node carries the requested URL, key and all
  globalThis.fetch = (async () => { throw new Error('fetch failed to https://api.steampowered.com/x?key=SUPERSECRETKEY123&steamid=7'); }) as any;

  await assert.rejects(() => steam.getOwnedGames('76561198000000010'), (err: any) => {
    assert.ok(!err.message.includes('SUPERSECRETKEY123'), `key leaked: ${err.message}`);
    assert.match(err.message, /redacted/);
    return true;
  });

  assert.strictEqual(steam.redactSteamKey('...key=SUPERSECRETKEY123&x=1'), '...key=[redacted]&x=1');
  assert.ok(!steam.redactSteamKey('bare SUPERSECRETKEY123 in text').includes('SUPERSECRETKEY123'));
});

test('merges player progress with schema art and global rarity', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();

  mockFetch({
    'GetPlayerAchievements': {
      playerstats: {
        gameName: 'Test Game',
        success: true,
        achievements: [
          { apiname: 'FIRST_BLOOD', achieved: 1, unlocktime: 1600000000 },
          { apiname: 'MARATHON', achieved: 0, unlocktime: 0 },
          { apiname: 'SECRET', achieved: 1, unlocktime: 1700000000 }
        ]
      }
    },
    'GetSchemaForGame': {
      game: {
        gameName: 'Test Game',
        availableGameStats: {
          achievements: [
            { name: 'FIRST_BLOOD', displayName: 'First Blood', description: 'Win once', icon: 'a.jpg', icongray: 'a_gray.jpg' },
            { name: 'MARATHON', displayName: 'Marathon', description: 'Play for hours', icon: 'b.jpg', icongray: 'b_gray.jpg' },
            { name: 'SECRET', displayName: 'Secret', description: '', icon: 'c.jpg', icongray: 'c_gray.jpg' }
          ]
        }
      }
    },
    'GetGlobalAchievementPercentages': {
      achievementpercentages: {
        achievements: [
          { name: 'FIRST_BLOOD', percent: '75.5' },
          { name: 'MARATHON', percent: '2.1' }
        ]
      }
    }
  });

  const set = await steam.getAchievements('76561198000000004', 440);
  assert.strictEqual(set.total, 3);
  assert.strictEqual(set.unlocked, 2);
  assert.strictEqual(set.gameName, 'Test Game');

  // unlocked first, newest unlock at the top
  assert.deepStrictEqual(set.achievements.map(a => a.id), ['SECRET', 'FIRST_BLOOD', 'MARATHON']);

  const first = set.achievements.find(a => a.id === 'FIRST_BLOOD')!;
  assert.strictEqual(first.name, 'First Blood', 'schema supplies the display name');
  assert.strictEqual(first.icon, 'a.jpg', 'unlocked achievements use the colour icon');
  assert.strictEqual(first.globalPercent, 75.5);
  assert.strictEqual(first.unlockedAt, new Date(1600000000 * 1000).toISOString());

  const locked = set.achievements.find(a => a.id === 'MARATHON')!;
  assert.strictEqual(locked.icon, 'b_gray.jpg', 'locked achievements use the grey icon');
  assert.strictEqual(locked.unlockedAt, null);

  const noRarity = set.achievements.find(a => a.id === 'SECRET')!;
  assert.strictEqual(noRarity.globalPercent, null, 'missing rarity stays null rather than 0');
});

test('surfaces the reason when a game exposes no achievements', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({
    'GetPlayerAchievements': { playerstats: { success: false, error: 'Requested app has no stats' } },
    'GetSchemaForGame': { game: {} },
    'GetGlobalAchievementPercentages': { achievementpercentages: { achievements: [] } }
  });

  await assert.rejects(() => steam.getAchievements('76561198000000005', 1), (err: any) => {
    assert.strictEqual(err.name, 'SteamUnavailable');
    assert.match(err.message, /no stats/i);
    return true;
  });
});

test('a 403 is not reported as a bad API key', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();
  // Steam answers 403 for apps without stats as well as for a rejected key
  mockFetch({ 'GetOwnedGames': 403 });

  await assert.rejects(() => steam.getOwnedGames('76561198000000011'), (err: any) => {
    assert.strictEqual(err.needsKey, false, 'a working key must not be blamed');
    assert.match(err.message, /would not share/i);
    return true;
  });

  steam.clearSteamCache();
  mockFetch({ 'GetOwnedGames': 401 });
  await assert.rejects(() => steam.getOwnedGames('76561198000000012'), (err: any) => {
    assert.strictEqual(err.needsKey, true, '401 really is a key problem');
    return true;
  });
});

test('marks a private profile so the UI can explain the empty library', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({
    'GetPlayerSummaries': {
      response: { players: [{ steamid: '7', personaname: 'Hidden', communityvisibilitystate: 1, personastate: 0 }] }
    },
    'GetSteamLevel': { response: { player_level: 12 } },
    'GetOwnedGames': { response: { games: [] } },
    'GetRecentlyPlayedGames': { response: { games: [] } }
  });

  const summary = await steam.getLibrarySummary('76561198000000006');
  assert.strictEqual(summary.profile?.visibility, 'private');
  assert.strictEqual(summary.gameCount, 0);
});

test('sorts the library by playtime and totals it', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({
    'GetPlayerSummaries': {
      response: { players: [{ steamid: '7', personaname: 'Player', communityvisibilitystate: 3, personastate: 1, avatarfull: 'x.jpg' }] }
    },
    'GetSteamLevel': { response: { player_level: 42 } },
    'GetOwnedGames': {
      response: {
        games: [
          { appid: 1, name: 'Short', playtime_forever: 30 },
          { appid: 2, name: 'Long', playtime_forever: 6000, playtime_2weeks: 120, img_icon_url: 'hash' }
        ]
      }
    },
    'GetRecentlyPlayedGames': { response: { games: [{ appid: 2, name: 'Long', playtime_forever: 6000, playtime_2weeks: 120 }] } }
  });

  const summary = await steam.getLibrarySummary('76561198000000007');
  assert.strictEqual(summary.level, 42);
  assert.strictEqual(summary.gameCount, 2);
  assert.strictEqual(summary.totalPlaytimeMinutes, 6030);
  assert.strictEqual(summary.topGames[0].name, 'Long', 'most played first');
  assert.match(summary.topGames[0].iconUrl!, /apps\/2\/hash\.jpg$/);
  assert.match(summary.topGames[0].headerUrl, /apps\/2\/header\.jpg$/);
  assert.strictEqual(summary.profile?.state, 'online');
});

test('caches repeat lookups instead of hammering Steam', async () => {
  process.env.STEAM_API_KEY = 'test-key';
  const steam = await import('./steam');
  steam.clearSteamCache();
  mockFetch({ 'GetOwnedGames': { response: { games: [{ appid: 1, name: 'A', playtime_forever: 10 }] } } });

  await steam.getOwnedGames('76561198000000008');
  const afterFirst = requested.length;
  await steam.getOwnedGames('76561198000000008');
  assert.strictEqual(requested.length, afterFirst, 'second call should be served from cache');
});

(async () => {
  let failures = 0;
  for (const { name, run } of tests) {
    try {
      await run();
      console.log(`  ok  ${name}`);
    } catch (err: any) {
      failures++;
      console.error(`FAIL  ${name}\n      ${err?.message}`);
    }
  }
  globalThis.fetch = realFetch;
  console.log(failures === 0 ? `\n${tests.length} passed` : `\n${failures} of ${tests.length} failed`);
  process.exit(failures === 0 ? 0 : 1);
})();
