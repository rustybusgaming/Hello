/**
 * Steam OpenID verification. Every path that must refuse is checked against a fake Steam, so
 * none of this needs the network.
 */
import assert from 'assert';
import { buildSteamLoginUrl, verifySteamAssertion, STEAM_OPENID_ENDPOINT } from './steamOpenId';

const tests: { name: string; run: () => Promise<void> }[] = [];
const test = (name: string, run: () => Promise<void>) => tests.push({ name, run });

const RETURN = 'https://hub.example/api/auth/steam/return?state=abc123';
const ID = 'https://steamcommunity.com/openid/id/76561198000000042';

function assertion(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': STEAM_OPENID_ENDPOINT,
    'openid.claimed_id': ID,
    'openid.identity': ID,
    'openid.return_to': RETURN,
    'openid.response_nonce': '2026-11-02T10:00:00ZnOnCe',
    'openid.assoc_handle': '1234567890',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'c2lnbmF0dXJl',
    ...overrides
  };
}

/** A fake Steam that answers check_authentication, recording what it was sent. */
function steam(answer: string, ok = true) {
  const calls: { url: string; body: string }[] = [];
  const impl = async (url: string, init: { body: string }) => {
    calls.push({ url, body: init.body });
    return { ok, text: async () => answer };
  };
  return { impl: impl as any, calls };
}

test('builds a login URL that asks Steam to pick the identity', async () => {
  const url = new URL(buildSteamLoginUrl(RETURN, 'https://hub.example'));
  assert.strictEqual(url.origin + url.pathname, STEAM_OPENID_ENDPOINT);
  assert.strictEqual(url.searchParams.get('openid.mode'), 'checkid_setup');
  assert.strictEqual(url.searchParams.get('openid.return_to'), RETURN);
  assert.strictEqual(url.searchParams.get('openid.realm'), 'https://hub.example');
  assert.match(url.searchParams.get('openid.claimed_id')!, /identifier_select$/);
});

test('accepts a well-formed assertion that Steam confirms', async () => {
  const fake = steam('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n');
  const result = await verifySteamAssertion(assertion(), RETURN, fake.impl);
  assert.deepStrictEqual(result, { ok: true, steamId: '76561198000000042' });
  // It asked Steam with mode switched to check_authentication and the signature intact
  const sent = new URLSearchParams(fake.calls[0].body);
  assert.strictEqual(sent.get('openid.mode'), 'check_authentication');
  assert.strictEqual(sent.get('openid.sig'), 'c2lnbmF0dXJl');
});

test('refuses when Steam says the signature is not valid', async () => {
  const result = await verifySteamAssertion(assertion(), RETURN, steam('is_valid:false\n').impl);
  assert.deepStrictEqual(result, { ok: false, reason: 'rejected' });
});

test('refuses an assertion meant for another return URL without asking Steam', async () => {
  const fake = steam('is_valid:true');
  const result = await verifySteamAssertion(assertion({ 'openid.return_to': RETURN.replace('abc123', 'other') }), RETURN, fake.impl);
  assert.deepStrictEqual(result, { ok: false, reason: 'wrong-return' });
  assert.strictEqual(fake.calls.length, 0);
});

test('refuses an assertion from another provider', async () => {
  const result = await verifySteamAssertion(assertion({ 'openid.op_endpoint': 'https://evil.example/openid/login' }), RETURN, steam('is_valid:true').impl);
  assert.deepStrictEqual(result, { ok: false, reason: 'wrong-provider' });
});

test('refuses a claimed id that is not a Steam id, or that differs from the identity', async () => {
  const notSteam = await verifySteamAssertion(assertion({ 'openid.claimed_id': 'https://evil.example/id/1', 'openid.identity': 'https://evil.example/id/1' }), RETURN, steam('is_valid:true').impl);
  assert.deepStrictEqual(notSteam, { ok: false, reason: 'malformed' });
  const mismatch = await verifySteamAssertion(assertion({ 'openid.identity': 'https://steamcommunity.com/openid/id/76561198000000099' }), RETURN, steam('is_valid:true').impl);
  assert.deepStrictEqual(mismatch, { ok: false, reason: 'malformed' });
});

test('refuses when the claimed id is not covered by the signature', async () => {
  const result = await verifySteamAssertion(assertion({ 'openid.signed': 'signed,op_endpoint,identity,return_to,response_nonce,assoc_handle' }), RETURN, steam('is_valid:true').impl);
  assert.deepStrictEqual(result, { ok: false, reason: 'unsigned-fields' });
});

test('reports a cancelled sign-in as cancelled', async () => {
  const result = await verifySteamAssertion({ 'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'cancel' }, RETURN);
  assert.deepStrictEqual(result, { ok: false, reason: 'cancelled' });
});

test('reports Steam being unreachable rather than trusting the assertion', async () => {
  const failing = (async () => { throw new Error('network down'); }) as any;
  const result = await verifySteamAssertion(assertion(), RETURN, failing);
  assert.deepStrictEqual(result, { ok: false, reason: 'unreachable' });
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
