/**
 * "Sign in through Steam": OpenID 2.0 against Steam's provider.
 *
 * Steam is the only party that can say a player owns a Steam account, so linking goes through
 * it rather than trusting an id typed into a form. The flow:
 *
 *   1. The hub sends the player to Steam with a return URL that carries a one-time state token
 *      bound to the signed-in Flashhub account.
 *   2. Steam sends the player back with a signed assertion naming their SteamID64.
 *   3. The hub checks the assertion's fields, then asks Steam directly whether the signature is
 *      valid (check_authentication). Only then is the id trusted.
 *
 * Nothing here needs the Web API key.
 */

export const STEAM_OPENID_ENDPOINT = (process.env.STEAM_OPENID_URL || 'https://steamcommunity.com/openid/login').replace(/\/$/, '');
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';
const CLAIMED_ID = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

/** Where to send the player to sign in. `realm` is the site's origin; `returnTo` sits under it. */
export function buildSteamLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export type OpenIdFailure =
  | 'cancelled'
  | 'malformed'
  | 'wrong-return'
  | 'wrong-provider'
  | 'unsigned-fields'
  | 'rejected'
  | 'unreachable';

export type OpenIdResult = { ok: true; steamId: string } | { ok: false; reason: OpenIdFailure };

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; text(): Promise<string> }>;

/**
 * Check what Steam sent back. `params` are the query parameters of the return request;
 * `expectedReturnTo` is the exact return URL this hub sent (state token included).
 */
export async function verifySteamAssertion(
  params: Record<string, string | undefined>,
  expectedReturnTo: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): Promise<OpenIdResult> {
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : '');

  if (get('openid.mode') === 'cancel') return { ok: false, reason: 'cancelled' };
  if (get('openid.ns') !== OPENID_NS || get('openid.mode') !== 'id_res') return { ok: false, reason: 'malformed' };

  // The assertion must be for this exact request, from Steam, about a Steam identity
  if (get('openid.return_to') !== expectedReturnTo) return { ok: false, reason: 'wrong-return' };
  if (get('openid.op_endpoint').replace(/\/$/, '') !== STEAM_OPENID_ENDPOINT) return { ok: false, reason: 'wrong-provider' };

  const claimed = get('openid.claimed_id');
  const match = claimed.match(CLAIMED_ID);
  if (!match || get('openid.identity') !== claimed) return { ok: false, reason: 'malformed' };

  // Every field this hub relies on has to be covered by Steam's signature
  const signed = new Set(get('openid.signed').split(','));
  for (const field of ['op_endpoint', 'claimed_id', 'identity', 'return_to', 'response_nonce', 'assoc_handle']) {
    if (!signed.has(field)) return { ok: false, reason: 'unsigned-fields' };
  }

  // Ask Steam whether it really issued this signature
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('openid.') && typeof value === 'string') body.set(key, value);
  }
  body.set('openid.mode', 'check_authentication');

  let text: string;
  try {
    const res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'FlashHub/2.0' },
      body: body.toString(),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return { ok: false, reason: 'unreachable' };
    text = await res.text();
  } catch {
    return { ok: false, reason: 'unreachable' };
  }

  // Key-value form: one "key:value" per line
  const valid = text.split('\n').some(line => line.trim() === 'is_valid:true');
  return valid ? { ok: true, steamId: match[1] } : { ok: false, reason: 'rejected' };
}

/** Plain words for each failure, for the message the player sees after coming back. */
export const OPENID_FAILURE_MESSAGE: Record<OpenIdFailure | 'expired' | 'signed-out' | 'taken', string> = {
  cancelled: 'Steam sign-in was cancelled. Nothing changed.',
  malformed: 'Steam’s answer was incomplete, so the account was not linked.',
  'wrong-return': 'That Steam sign-in was meant for a different request. Start again from Flashhub.',
  'wrong-provider': 'That sign-in did not come from Steam, so it was ignored.',
  'unsigned-fields': 'Steam’s answer was not fully signed, so it was not trusted.',
  rejected: 'Steam did not confirm that sign-in. Try again.',
  unreachable: 'Steam could not be reached to confirm the sign-in. Try again shortly.',
  expired: 'That sign-in link expired. Start again from your account.',
  'signed-out': 'Sign in to Flashhub first, then link Steam.',
  taken: 'That Steam account is already confirmed on another Flashhub account.'
};
