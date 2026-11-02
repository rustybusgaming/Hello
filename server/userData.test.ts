/**
 * The per-player and per-game stores: validation, counting rules and the guarantees the
 * screens depend on (no inflated counts, no invented dates).
 */
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createUserDataStore, isLibraryKey, LIMITS } from './userData';

const tests: { name: string; run: () => void }[] = [];
const test = (name: string, run: () => void) => tests.push({ name, run });
const fresh = () => createUserDataStore(fs.mkdtempSync(path.join(os.tmpdir(), 'flashhub-userdata-')));

test('library keys: catalogue ids and steam:<appId> only', () => {
  for (const ok of ['quasar-dl1', 'custom-fbwg-forest-temple', 'the-binding-of-isaac_202111', 'steam:1145360']) assert.ok(isLibraryKey(ok), ok);
  for (const bad of ['', '../etc', 'steam:abc', 'a b', '<script>', 5, null]) assert.ok(!isLibraryKey(bad), String(bad));
});

test('favourites replace and merge without duplicates, and refuse bad keys', () => {
  const store = fresh();
  assert.deepStrictEqual(store.setFavourites('u1', ['a', 'b', 'a'])!.favourites, ['a', 'b']);
  assert.deepStrictEqual(store.mergeFavourites('u1', ['b', 'steam:620'])!.favourites, ['a', 'b', 'steam:620']);
  assert.strictEqual(store.setFavourites('u1', ['ok', '../bad']), null);
  assert.deepStrictEqual(store.getLibrary('u1').favourites, ['a', 'b', 'steam:620'], 'a refused write changes nothing');
  assert.deepStrictEqual(store.getLibrary('u2').favourites, [], 'players do not see each other');
});

test('collections: create, rename, set games, delete; names are checked', () => {
  const store = fresh();
  const created = store.createCollection('u1', '  Couch   co-op ', ['quasar-dl1']);
  assert.ok(typeof created === 'object');
  const c = created as any;
  assert.strictEqual(c.name, 'Couch co-op');
  assert.strictEqual(store.createCollection('u1', ''), 'invalid');
  assert.strictEqual(store.createCollection('u1', 'x'.repeat(LIMITS.collectionName + 1)), 'invalid');
  const renamed = store.updateCollection('u1', c.id, { name: 'Two players', keys: ['quasar-dl1', 'steam:620'] }) as any;
  assert.strictEqual(renamed.name, 'Two players');
  assert.deepStrictEqual(renamed.keys, ['quasar-dl1', 'steam:620']);
  assert.strictEqual(store.updateCollection('u2', c.id, { name: 'Mine now' }), 'missing', 'another player cannot edit it');
  assert.ok(store.deleteCollection('u1', c.id));
  assert.strictEqual(store.getLibrary('u1').collections.length, 0);
});

test('sessions add up, and a session cannot exceed a day', () => {
  const store = fresh();
  store.recordSession('u1', 'quasar-dl1', 600);
  const r = store.recordSession('u1', 'quasar-dl1', 10 * 24 * 3600)!;
  assert.strictEqual(r.sessions, 2);
  assert.strictEqual(r.totalSeconds, 600 + LIMITS.sessionSeconds);
  assert.strictEqual(store.recordSession('u1', 'steam:620', 60), null, 'Steam playtime belongs to Steam');
  assert.strictEqual(store.recordSession('u1', 'quasar-dl1', -5), null);
});

test('importing local history never inflates: the larger value wins, twice is the same as once', () => {
  const store = fresh();
  store.recordSession('u1', 'quasar-dl1', 300, new Date('2026-10-01T10:00:00Z'));
  const local = { 'quasar-dl1': { lastPlayedAt: '2026-10-05T10:00:00Z', totalSeconds: 200, sessions: 4 }, 'quasar-dl2': { lastPlayedAt: null, totalSeconds: 0, sessions: 0 } };
  store.importHistory('u1', local);
  const after = store.importHistory('u1', local)!;
  assert.deepStrictEqual(after['quasar-dl1'], { lastPlayedAt: '2026-10-05T10:00:00.000Z', totalSeconds: 300, sessions: 4 });
  assert.deepStrictEqual(after['quasar-dl2'], { lastPlayedAt: null, totalSeconds: 0, sessions: 0 });
});

test('a play counts once per player per game per half hour, and only past 30 seconds', () => {
  const store = fresh();
  const t0 = new Date('2026-11-01T12:00:00Z');
  assert.ok(!store.recordPlay('quasar-dl1', 'u1', 12, t0), 'too short');
  assert.ok(store.recordPlay('quasar-dl1', 'u1', 45, t0));
  assert.ok(!store.recordPlay('quasar-dl1', 'u1', 45, new Date(t0.getTime() + 10 * 60000)), 'same sitting');
  assert.ok(store.recordPlay('quasar-dl1', 'u2', 45, t0), 'another player');
  assert.ok(store.recordPlay('quasar-dl1', 'u1', 45, new Date(t0.getTime() + 40 * 60000)), 'a later sitting');
  const counts = store.getPlayCounts(30, new Date('2026-11-02T00:00:00Z')).get('quasar-dl1')!;
  assert.deepStrictEqual(counts, { total: 3, recent: 3 });
  const later = store.getPlayCounts(30, new Date('2026-12-15T00:00:00Z')).get('quasar-dl1')!;
  assert.deepStrictEqual(later, { total: 3, recent: 0 }, 'old plays leave the window but stay in the total');
});

test('the first catalogue is a baseline with no dates; later games are dated', () => {
  const store = fresh();
  const first = store.noteCatalogue(['a', 'b'], {}, new Date('2026-11-01T00:00:00Z'));
  assert.strictEqual(first.addedAt.get('a'), null);
  const second = store.noteCatalogue(['a', 'b', 'c'], {}, new Date('2026-11-03T00:00:00Z'));
  assert.strictEqual(second.addedAt.get('a'), null, 'still undated');
  assert.strictEqual(second.addedAt.get('c'), '2026-11-03T00:00:00.000Z');
  assert.strictEqual(second.baselineAt, '2026-11-01T00:00:00.000Z');
  const third = store.noteCatalogue(['a', 'b', 'c'], { b: '2026-10-20T08:00:00Z' }, new Date('2026-11-05T00:00:00Z'));
  assert.strictEqual(third.addedAt.get('b'), '2026-10-20T08:00:00.000Z', 'an upload date beats the baseline');
  assert.strictEqual(third.addedAt.get('c'), '2026-11-03T00:00:00.000Z', 'first seen stays first seen');
});

test('Steam snapshots are kept per account and dropped on unlink', () => {
  const store = fresh();
  store.saveSteamSnapshot('765', { games: [1, 2] }, new Date('2026-11-01T00:00:00Z'));
  assert.deepStrictEqual(store.getSteamSnapshot('765'), { fetchedAt: '2026-11-01T00:00:00.000Z', data: { games: [1, 2] } });
  store.dropSteamSnapshot('765');
  assert.strictEqual(store.getSteamSnapshot('765'), null);
});

test('a player can take one game out of their history', () => {
  const store = fresh();
  store.recordSession('u1', 'a', 60);
  store.recordSession('u1', 'b', 60);
  assert.ok(store.removeHistoryEntry('u1', 'a'));
  assert.deepStrictEqual(Object.keys(store.getHistory('u1')), ['b']);
  assert.ok(!store.removeHistoryEntry('u1', 'a'), 'already gone');
  assert.ok(!store.removeHistoryEntry('u1', '../x'), 'not a key');
});

test('forgetting a player removes their library and history only', () => {
  const store = fresh();
  store.setFavourites('u1', ['a']);
  store.setFavourites('u2', ['b']);
  store.recordSession('u1', 'a', 60);
  store.forgetUser('u1');
  assert.deepStrictEqual(store.getLibrary('u1').favourites, []);
  assert.deepStrictEqual(store.getHistory('u1'), {});
  assert.deepStrictEqual(store.getLibrary('u2').favourites, ['b']);
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    run();
    console.log(`  ok  ${name}`);
  } catch (err: any) {
    failures++;
    console.error(`FAIL  ${name}\n      ${err?.message}`);
  }
}
console.log(failures === 0 ? `\n${tests.length} passed` : `\n${failures} of ${tests.length} failed`);
process.exit(failures === 0 ? 0 : 1);
