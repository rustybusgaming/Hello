# Flash Game Hub

A dark-themed retro game hub: HTML5/WASM webports, Ruffle-powered Flash classics from the
Internet Archive, player accounts with cloud saves, Steam profile linking, and an admin
console for catalogue and sync operations.

The Express server in `server.ts` serves the API and mounts Vite in middleware mode, so a
single process runs both the front end and the back end.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in anything you need (all values are optional for
   local play — see below).
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The hub is served at http://localhost:3000 (set `PORT` to change it).

## Where the games come from

Nothing has to be downloaded for the catalogue to work — every source streams on demand
through the Express server:

| Source | Count | How it plays |
| --- | --- | --- |
| `slqntdevss/quasar` Flash mirror | 56 titles | The item's real `game.swf` is streamed via `/api/quasar/*` (jsDelivr, falling back to raw.githubusercontent) into Ruffle |
| `slqntdevss/quasar` HTML5 mirror | 80 titles | Proxied through `/api/quasar/*`, which rewrites `<base href>` so relative assets resolve |
| `genizy/web-port` | 37 Unity/Godot ports | Proxied through `/api/webport-proxy/*` |
| Internet Archive | 11 verified items + live search | The item's actual `.swf` is streamed via `/api/archive-swf/*` |

Archive.org items are never embedded with `archive.org/embed/<id>`: a number of those items
are video captures, so embedding them plays a video instead of the game. Every entry in
`src/data/flashArchives.ts` was checked against `https://archive.org/metadata/<id>` and
records the exact `.swf` filename; live search results resolve their filename at play time.

Games whose upstream cover image has disappeared fall back to `/api/cover/<seed>`, which
draws deterministic poster art from the game id.

Optionally, download the bundled game libraries into `public/` first:

```bash
npm run sync
```

This clones `aukak/gameports` and `slqntdevss/quasar` into `public/gameports` and
`public/quasar`. Both folders are gitignored and can be several GB. Without them the hub
still works: webports stream on demand through `/api/webport-proxy`, and Flash titles come
from the curated Archive.org catalogue.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Express + Vite dev server on port 3000 |
| `npm run build` | Builds the client into `dist/` and bundles the server to `dist/server.cjs` |
| `npm start` | Runs the production bundle (`NODE_ENV=production node dist/server.cjs`) |
| `npm run lint` | Type-checks the project with `tsc --noEmit` |
| `npm run sync` | Downloads the gameports/quasar libraries into `public/` |

## Security model

Games are third-party code, so they run walled off from the hub:

- Game frames load from a **separate origin**, not the hub's. On localhost the server frames
  them from `127.0.0.1` (same server, different origin); set `GAME_ORIGIN` to a second
  hostname for a public deployment. Because the origin differs, game code cannot read the
  hub's DOM or storage, and the session cookie is never sent with its requests.
- The frames are also sandboxed (no top-level navigation, and so on). Note that
  `allow-same-origin` is deliberately *kept*: it grants the game only its own origin, and
  removing it produces an opaque origin where the game's own scripts do not run at all.
- The session lives in an **httpOnly, SameSite=Strict cookie**. No page or frame script can
  read the token, and nothing is kept in `localStorage`.
- Password checks on sign-in, password change and account deletion are rate limited per
  account and (more loosely) per IP, so shared school or office networks are not locked out
  by one attacker.

If no second origin is available, frames fall back to the hub's own origin and this
isolation is lost; the server logs a warning at startup when `GAME_ORIGIN` is unset.

The server also inlines a small storage bridge (`server/frameStorage.ts`) into every game
document. Games on the isolated origin would otherwise save into that origin's own storage,
which is device-local and invisible to the hub. The frame gets a synchronous
in-memory `Storage` that is seeded from, and written back to, the hub over `postMessage` —
which is what makes cloud saves hold real game state (Ruffle keeps Flash SharedObjects in
`localStorage`) rather than just a playtime note. Signed-in players get their progress on
their account; guests keep theirs in the hub's own browser storage.

Unity's `PlayerPrefs` uses IndexedDB rather than `localStorage`, so WebGL saves are not
carried across devices yet.

## Performance

The catalogue is a few hundred games, so the hub is careful about what it keeps on screen
and what it re-downloads:

- The grid renders in pages of 60 and reveals more on scroll, instead of mounting every card.
- While a game is open the catalogue is unmounted entirely — it is fully covered by the
  player, and cards left mounted keep competing for the main thread and for the bandwidth the
  game is using.
- Proxied game assets are cached on disk under `data/asset-cache/` (2 GB budget, least
  recently used evicted first). A replay is served locally instead of being pulled through the
  CDN again: an 8 MB Flash game drops from ~19s to ~0.06s.

## Security

- Sessions are httpOnly, SameSite=Strict cookies; the token is never exposed to page scripts.
- Games run on a separate origin (see above) so their code cannot reach the hub's session.
- Password checks are rate limited per account, and more loosely per IP so shared networks are
  not locked out. Set `TRUSTED_PROXY_HOPS` to the number of proxies in front of the server;
  leaving it unset means `X-Forwarded-For` is ignored, which is what stops a caller from
  inventing a new IP per request to walk past the limiter.
- Baseline headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`) are applied to the hub. Game routes are exempt on purpose: they must
  stay embeddable and run third-party engine code.
- Uploads are checked by content, not just by extension — a file claiming to be `.swf` has to
  actually start with `FWS`/`CWS`/`ZWS`.
- Passwords must be at least 8 characters and are refused if they appear in a small list of
  the most commonly stuffed ones.

## Steam integration

Linking a Steam account pulls in the persona, avatar and profile details. With a Web API key
the Steam tab also shows the player's library, playtime, and achievements:

- library size, total playtime and most-played games with playtime bars
- achievement completion across the games actually played, plus perfect-game count
- the latest unlocks, and a per-game achievement browser with unlock dates, locked/unlocked
  filtering, and **global rarity** (Steam publishes how many players hold each achievement)

Steam retired the old keyless `?xml=1` endpoints for libraries and achievements — they now
redirect to the HTML profile page — so that section needs `STEAM_API_KEY` from
[steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey), and the Steam profile
has to be public. Without a key, linking still works and the UI explains what is missing
rather than showing an empty library. Global achievement rarity is still public and is fetched
without a key.

Steam responses are cached in memory (5 minutes for player data, 24 hours for game schemas
and rarity) to stay inside Steam's rate limits.

Run `npm test` to exercise the Steam client against recorded response shapes — id resolution,
schema/rarity merging, sort order, private profiles and the missing-key path — none of which
needs a real key.

## Keeping the catalogue honest

The admin console has a **catalogue health check** (Game Catalog tab) that walks every entry,
probes the game and its thumbnail the way a player would reach them, and — for HTML games —
also probes the first game script, since several mirrors ship an `index.html` whose code was
never copied. Failures are listed with a one-click Hide. Run it occasionally: mirrors rot.

## Accounts and roles

- Accounts are created through the account modal; **the first account to register becomes
  the admin**.
- Sessions are bearer tokens stored in `data/sessions.json` and kept in the browser's
  local storage; they last 30 days.
- Every `/api/admin/*` route, save export/import, uploads and manual syncs require a
  signed-in session (admin role for the admin routes). Signing in as an admin is required
  before the admin console will load data.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Server port (default `3000`) |
| `GAME_ORIGIN` | No | Second origin that game frames load from; falls back to `127.0.0.1` on localhost |
| `TRUSTED_PROXY_HOPS` | No | Number of reverse proxies in front of the server; unset means `X-Forwarded-For` is ignored |
| `NODE_ENV` | No | Set to `production` to serve `dist/` instead of the Vite middleware |
| `STEAM_API_KEY` | No | Steam Web API key; required for library, playtime and achievements |
| `STEAM_API_BASE` | No | Overrides the Steam API host; used for testing against a stand-in |
| `GEMINI_API_KEY` | No | Injected by AI Studio; not used by the current code |
| `APP_URL` | No | Public URL of the deployment, injected by AI Studio |

## Data storage

State lives in flat JSON files under `data/` (`accounts.json`, `sessions.json`,
`saves.json`, `game_settings.json`). They are created on first run and are gitignored,
because they hold password hashes and live session tokens. Delete a file to reset that
part of the hub.
