/**
 * Steam store metadata: parsing, caching, request sharing and the rate budget, against a fake
 * store. Nothing here touches the network.
 */
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createSteamStore, parseAppDetails, plainText } from './steamStore';

const tests: { name: string; run: () => Promise<void> }[] = [];
const test = (name: string, run: () => Promise<void>) => tests.push({ name, run });
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'flashhub-store-'));

const HADES = {
  '1145360': {
    success: true,
    data: {
      type: 'game',
      name: 'Hades',
      short_description: 'Defy the god of the dead as you hack &amp; slash out of the Underworld.<br>From Supergiant.',
      genres: [{ id: '1', description: 'Action' }, { id: '3', description: 'RPG' }],
      categories: [{ id: 2, description: 'Single-player' }, { id: 28, description: 'Full controller support' }],
      developers: ['Supergiant Games'],
      publishers: ['Supergiant Games'],
      release_date: { coming_soon: false, date: 'Sep 17, 2020' },
      platforms: { windows: true, mac: true, linux: false },
      controller_support: 'full',
      metacritic: { score: 93, url: 'https://www.metacritic.com/game/pc/hades' },
      website: 'javascript:alert(1)',
      screenshots: [
        { id: 0, path_thumbnail: 'https://cdn.example/ss0.600x338.jpg', path_full: 'https://cdn.example/ss0.jpg' },
        { id: 1, path_thumbnail: 'http://insecure.example/ss1.jpg', path_full: 'http://insecure.example/ss1.jpg' }
      ]
    }
  }
};

function fakeStore(responses: Record<string, { status?: number; body?: any }>) {
  const calls: string[] = [];
  const impl = async (url: string) => {
    calls.push(url);
    const id = new URL(url).searchParams.get('appids')!;
    const r = responses[id] || { body: { [id]: { success: false } } };
    return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, json: async () => r.body };
  };
  return { impl: impl as any, calls };
}

test('store text becomes plain words', async () => {
  assert.strictEqual(plainText('Hack &amp; slash<br>out &quot;now&quot; &#39;ok&#39;'), 'Hack & slash out "now" \'ok\'');
});

test('keeps only checked fields: no javascript: links, no insecure images', async () => {
  const d = parseAppDetails(1145360, HADES) as any;
  assert.strictEqual(d.description, 'Defy the god of the dead as you hack & slash out of the Underworld. From Supergiant.');
  assert.deepStrictEqual(d.genres, ['Action', 'RPG']);
  assert.strictEqual(d.controllerSupport, 'full');
  assert.deepStrictEqual(d.metacritic, { score: 93, url: 'https://www.metacritic.com/game/pc/hades' });
  assert.strictEqual(d.website, null, 'a javascript: URL is dropped');
  assert.strictEqual(d.screenshots.length, 1, 'an http screenshot is dropped');
  assert.strictEqual(parseAppDetails(1, { '1': { success: false } }), 'missing');
});

test('a second request is served from the cache, also after a restart', async () => {
  const d = dir();
  const fake = fakeStore({ '1145360': { body: HADES } });
  const store = createSteamStore(d, fake.impl, 'https://store.example');
  const first = await store.getDetails(1145360);
  assert.strictEqual(first.state, 'ok');
  await store.getDetails(1145360);
  const restarted = createSteamStore(d, fake.impl, 'https://store.example');
  const again = await restarted.getDetails(1145360);
  assert.strictEqual(again.details?.name, 'Hades');
  assert.strictEqual(fake.calls.length, 1, 'Steam was asked once');
});

test('concurrent requests for one game share a single call', async () => {
  const fake = fakeStore({ '1145360': { body: HADES } });
  const store = createSteamStore(dir(), fake.impl, 'https://store.example');
  const results = await Promise.all([store.getDetails(1145360), store.getDetails(1145360), store.getDetails(1145360)]);
  assert.ok(results.every(r => r.state === 'ok'));
  assert.strictEqual(fake.calls.length, 1);
});

test('an app Steam does not know is remembered as missing', async () => {
  const fake = fakeStore({});
  const store = createSteamStore(dir(), fake.impl, 'https://store.example');
  assert.strictEqual((await store.getDetails(1)).state, 'missing');
  assert.strictEqual((await store.getDetails(1)).state, 'missing');
  assert.strictEqual(fake.calls.length, 1);
});

test('a 429 makes the store go quiet, and nothing is thrown', async () => {
  const fake = fakeStore({ '10': { status: 429 }, '20': { body: { '20': { success: false } } } });
  const store = createSteamStore(dir(), fake.impl, 'https://store.example');
  assert.deepStrictEqual(await store.getDetails(10), { state: 'unavailable', details: null, fetchedAt: null, stale: false });
  assert.strictEqual((await store.getDetails(20)).state, 'unavailable', 'quiet: not even asked');
  assert.strictEqual(fake.calls.length, 1);
});

test('the budget caps calls at 100 per five minutes', async () => {
  const fake = fakeStore({});
  const store = createSteamStore(dir(), fake.impl, 'https://store.example');
  for (let id = 1; id <= 105; id++) await store.getDetails(id);
  assert.strictEqual(fake.calls.length, 100);
});

test('a network failure returns nothing rather than throwing', async () => {
  const failing = (async () => { throw new Error('down'); }) as any;
  const store = createSteamStore(dir(), failing, 'https://store.example');
  assert.strictEqual((await store.getDetails(1145360)).state, 'unavailable');
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
  console.log(failures === 0 ? `\n${tests.length} passed` : `\n${failures} of ${tests.length} failed`);
  process.exit(failures === 0 ? 0 : 1);
})();
