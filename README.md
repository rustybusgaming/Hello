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

- Every game frame is sandboxed **without `allow-same-origin`**, which puts it in an opaque
  origin. It cannot read the hub's DOM, storage or cookies, and its own requests are not
  sent with the session.
- The session lives in an **httpOnly, SameSite=Strict cookie**. No page or frame script can
  read the token, and nothing is kept in `localStorage`.
- Password checks on sign-in, password change and account deletion are rate limited per
  account and (more loosely) per IP, so shared school or office networks are not locked out
  by one attacker.

Because a sandboxed frame has no usable `localStorage`, the server inlines a small storage
bridge (`server/frameStorage.ts`) into every game document. The frame gets a synchronous
in-memory `Storage` that is seeded from, and written back to, the hub over `postMessage` —
which is what makes cloud saves hold real game state (Ruffle keeps Flash SharedObjects in
`localStorage`) rather than just a playtime note. Signed-in players get their progress on
their account; guests keep theirs in the hub's own browser storage.

Unity's `PlayerPrefs` uses IndexedDB rather than `localStorage`, so WebGL saves are not
carried across devices yet.

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
| `NODE_ENV` | No | Set to `production` to serve `dist/` instead of the Vite middleware |
| `STEAM_API_KEY` | No | Reserved for the Steam Web API; profile lookup currently scrapes the public XML/HTML endpoints |
| `GEMINI_API_KEY` | No | Injected by AI Studio; not used by the current code |
| `APP_URL` | No | Public URL of the deployment, injected by AI Studio |

## Data storage

State lives in flat JSON files under `data/` (`accounts.json`, `sessions.json`,
`saves.json`, `game_settings.json`). They are created on first run and are gitignored,
because they hold password hashes and live session tokens. Delete a file to reset that
part of the hub.
