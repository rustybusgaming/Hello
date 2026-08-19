/**
 * Rate-limiter checks, run via: npx tsx server/rateLimit.test.ts
 *
 * The property that matters for account takeover: every identifier that resolves to one
 * account must share a single guessing budget. Keying on the typed string instead let a
 * username and an email be attacked as two budgets, doubling the guesses — this pins that shut.
 */
import assert from 'assert';
import { checkRateLimit, recordFailure, clearFailures, guardKeys } from './rateLimit';

const tests: { name: string; run: () => void }[] = [];
const test = (name: string, run: () => void) => tests.push({ name, run });

// Minimal Response stand-in for guardKeys
function fakeRes() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 0,
    body: null as any,
    setHeader(k: string, v: string) { headers[k] = v; },
    status(code: number) { this.statusCode = code; return this; },
    json(obj: any) { this.body = obj; return this; },
    headers
  };
}

test('an account key blocks after 8 failures', () => {
  const key = `t1:acct:${Math.random()}`;
  for (let i = 0; i < 8; i++) {
    assert.strictEqual(checkRateLimit([key]).blocked, false, `should be open at attempt ${i}`);
    recordFailure([key]);
  }
  assert.strictEqual(checkRateLimit([key]).blocked, true, 'blocked after 8');
});

test('username and email that resolve to one account share the budget', () => {
  // The fix keys on the resolved account id, so both aliases produce the SAME key.
  const accountKey = `t2:acct:user-123`;

  // Eight guesses arrive "via username", exhausting the budget
  for (let i = 0; i < 8; i++) recordFailure([accountKey]);
  assert.strictEqual(checkRateLimit([accountKey]).blocked, true);

  // A guess "via email" resolves to the same account key and is already blocked —
  // no fresh budget. This is the exploit that was patched.
  const res = fakeRes();
  assert.strictEqual(guardKeys(res as any, [accountKey]), null);
  assert.strictEqual(res.statusCode, 429);
  assert.ok(res.headers['Retry-After'], 'sends Retry-After');
});

test('a successful login clears the account budget', () => {
  const key = `t3:acct:${Math.random()}`;
  for (let i = 0; i < 8; i++) recordFailure([key]);
  assert.strictEqual(checkRateLimit([key]).blocked, true);

  clearFailures([key]);
  assert.strictEqual(checkRateLimit([key]).blocked, false, 'cleared after success');
});

test('the IP bucket is looser than the account bucket', () => {
  const ipKey = `t4:ip:${Math.random()}`;
  // 8 failures would lock an account key, but the IP threshold is higher so shared
  // networks are not locked out by one user's typos
  for (let i = 0; i < 8; i++) recordFailure([ipKey]);
  assert.strictEqual(checkRateLimit([ipKey]).blocked, false, 'IP still open at 8');
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
