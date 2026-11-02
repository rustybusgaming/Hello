# Flash Game Hub

A modernist Flash archive: HTML5/WASM webports, Ruffle-powered Flash classics from the
Internet Archive, player accounts with cloud saves, Steam profile linking, and an admin
console for catalogue and sync operations.

Flashhub is laid out as a game launcher: one library that holds the hub's own playable games
beside a player's Steam library, where every game says where it launches. **Play** starts it in
Flashhub's player; **Open in Steam** hands it to the Steam client through a `steam://run/<appId>`
link. Flashhub cannot run Steam games itself, and the interface says so wherever it matters.

- **Home**: the last game played (or today's featured pick, using Steam's wide library art where
  a game has a Steam app id), *Jump back in* (Flashhub sessions and Steam playtime merged by real
  last-played time), favourites, a daily set of unplayed games, and browsing by runtime and genre.
- **Library**: tabs by launch target (All, Plays in Flashhub, Steam, Favourites, Recently played),
  runtime / genre / sort filters, a cover grid or a list view, and a plain explanation for every
  Steam state (signed out, not linked, no API key, private game details, Steam down).
- **Game pages** for both kinds of game: art, the launch action, your play history (which you
  can take a game out of), runtime and source details, save-slot count, Steam playtime and
  achievements, and *More like this*. Steam games add the store's description, developer,
  release date, platforms, controller support, Metacritic score and screenshots, plus
  *Play something like it here*: Flashhub games that share its genres. A browser port of a
  Steam game shows *The original on Steam* when the store page really is that game.
- **Recommendations** on Home say why: *Because you played …* names a game you really played
  (in Flashhub, or on Steam by its store genres) and the genres the suggestions share with it.
  *Recently played* in the library is grouped by day: today, yesterday, this week, and so on.
- **Player**: the game fills the window; restart, fullscreen, CRT, diagnostics and new-tab are
  compact icon controls, and runtimes and save slots live in a side panel that folds away.
- Arrow keys move through card grids by row and column, and a connected gamepad drives the same
  paths (d-pad or stick to move, A to open, B to go back).

The visual system is tasteskill's "True-black flat" app style with the brand kept: a warm
near-black ground taken from the brand's own ink, surfaces lifted by tone rather than borders,
off-white text, Archivo throughout, square edges, and the red `#ec3013` reserved for the primary
action, the selected tab and focus. Cover art stays in full colour. Tokens live in
`src/index.css`; the library model (`src/lib/library.ts`), local play history
(`src/lib/playHistory.ts`) and the Steam library state (`src/lib/useSteamLibrary.ts`) are shared
through `src/lib/libraryContext.ts`. Working notes from the design run are in
`.taste-skill/notes.md`.

Signed out, favourites and play history live in the browser. Signed in, they live on the
account, together with collections: signing in folds the browser's history into the account
(the larger of each figure wins, so it never double-counts) and adds its favourites once.

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
| `slqntdevss/quasar` Flash | 65 titles | The real `game.swf` is streamed via `/api/quasar/*` (jsDelivr, falling back to raw.githubusercontent) into Ruffle |
| `slqntdevss/quasar` HTML5 | 122 titles | Proxied through `/api/quasar/*`, which rewrites a relative `<base href>` so assets resolve |
| `slqntdevss/quasar` WebGL | 98 Unity builds | Proxied through `/api/quasar/*`; launcher builds keep their external `<base href>` |
| `slqntdevss/quasar` emulator shells | 7 | EmulatorJS consoles you load your own ROM into |
| `genizy/web-port` | 37 Unity/Godot ports | Proxied through `/api/webport-proxy/*` |
| Internet Archive | 11 verified items + live search | The item's actual `.swf` is streamed via `/api/archive-swf/*` |

The quasar catalogue is generated from that repo's own `storage.json`, cross-checked against
the repository tree. Each entry is located by its catalogue **path** (which is not always the
game id — e.g. `au` lives at `/flash/au1/`), and only entries with a real launch file are
included. Split-archive downloads and bundled first-party console ROMs are left out.

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
isolation is lost, so **in production the server refuses to start unless `GAME_ORIGIN` is
set**. Set `ALLOW_SAME_ORIGIN_GAMES=1` to override that and accept the risk. In
development the localhost/127.0.0.1 pair supplies the second origin for free.

Uploaded HTML games are served with `Content-Security-Policy: sandbox`, which puts them in
an opaque origin even when opened directly rather than embedded, and the frame storage
bridge is injected so their progress still works without real `localStorage`.

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

Steam accounts are linked with **Sign in through Steam** (OpenID 2.0). The player signs in on
Steam's own page, Steam sends back a signed assertion, and the server asks Steam to confirm the
signature before it stores the SteamID64. A one-time state token bound to the Flashhub account,
plus a short-lived `SameSite=Lax` cookie, make sure the browser coming back is the one that
left. A Steam account confirmed on one Flashhub account cannot be confirmed on another. Links
made with the old SteamID form (before this check existed) keep working, marked unconfirmed,
and the library asks their owners to confirm them with Steam. Behind a proxy, set `APP_URL` so
the return address Steam is given matches the public site.

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

With a key, the player's whole owned-games list (`GET /api/steam/owned`, the official
`GetOwnedGames` call) joins the unified library as entries that open in Steam, with Steam's own
playtime and last-played time. A profile whose game details are private comes back empty from
Steam; the library says so and links to Steam's privacy settings instead of showing nothing.

Steam responses are cached in memory (5 minutes for player data, 24 hours for game schemas
and rarity) to stay inside Steam's rate limits.

Store details (descriptions, genres, screenshots) come from the store's public but
undocumented `appdetails` endpoint, so they are handled as an extra that can fail
(`server/steamStore.ts`): fetched only when a game's page opens, cached on disk in
`data/steam-store.json` (a week for found apps, a day for missing ones), one shared request
per game, a budget of 100 requests per five minutes and five minutes' silence after a 429.
When the store is quiet the page shows the last copy, dated, or says there is nothing. The
library, ownership and playtime never depend on it. Set `STEAM_STORE_BASE` to point it at a
stand-in for testing.

For local testing without a real key, `STEAM_API_BASE` points the client at a stand-in server
that answers the same endpoints, and `STEAM_OPENID_URL` does the same for Steam sign-in.

Run `npm test` to exercise the Steam client against recorded response shapes — id resolution,
schema/rarity merging, sort order, private profiles and the missing-key path — none of which
needs a real key.

## What the hub counts

Everything in `data/` is runtime state and stays out of git:

| File | Holds |
| --- | --- |
| `user-library.json` | Each account's favourites and collections |
| `play-history.json` | Each account's sessions, time played and last-played time per game |
| `play-stats.json` | Plays per game: a sitting of 30 s or more, once per player per game per half hour, by day for 90 days plus an all-time total |
| `catalogue-dates.json` | When each game first appeared. The catalogue the hub started with is an undated baseline; later games are dated when first seen, uploads by their own date |
| `steam-libraries.json` | The last owned-games list Steam returned per linked account, shown (marked as such) when Steam is down |
| `steam-store.json` | Store details per Steam app, as the store last gave them |

None of these figures is estimated: a game nobody has played has 0 plays, and a game from the
starting catalogue has no date added rather than an invented one.

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
| `GAME_ORIGIN` | **In production** | Second origin that game frames load from; falls back to `127.0.0.1` on localhost. The server refuses to start in production without it |
| `ALLOW_SAME_ORIGIN_GAMES` | No | Set to `1` to start in production without `GAME_ORIGIN`, accepting that games run unisolated |
| `TRUSTED_PROXY_HOPS` | No | Number of reverse proxies in front of the server; unset means `X-Forwarded-For` is ignored |
| `NODE_ENV` | No | Set to `production` to serve `dist/` instead of the Vite middleware |
| `STEAM_API_KEY` | No | Steam Web API key; required for library, playtime and achievements |
| `STEAM_API_BASE` | No | Overrides the Steam API host; used for testing against a stand-in |
| `STEAM_OPENID_URL` | No | Overrides Steam's OpenID sign-in endpoint; used for testing against a stand-in |
| `STEAM_STORE_BASE` | No | Overrides the Steam store host for store details; used for testing against a stand-in |
| `GEMINI_API_KEY` | No | Injected by AI Studio; not used by the current code |
| `APP_URL` | Behind a proxy | Public URL of the deployment (injected by AI Studio); also the return address and realm for Sign in through Steam |

## Deploying

The full hub runs as one Node process (`npm run build`, then `npm start`) and needs a host that
runs a server; see *Run locally* and the environment variables below.

**An interface preview** publishes to GitHub Pages through `.github/workflows/pages.yml` on
every push to `main` (enable it once: Settings, Pages, Source: GitHub Actions). Pages serves
static files only, so the preview shows the real interface and catalogue, a snapshot taken
during the workflow, while Play, sign-in, uploads and Steam say they need the full server.

## Data storage

State lives in flat JSON files under `data/` (`accounts.json`, `sessions.json`,
`saves.json`, `game_settings.json`, and the library files listed under *What the hub counts*). They are created on first run and are gitignored,
because they hold password hashes and live session tokens. Delete a file to reset that
part of the hub.
