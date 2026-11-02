# Flashhub redesign — working notes (tasteskill v2.1.5, app-screen run)

Kind of work: app screens (a library to work through, a detail page, a player). Redesign of an
existing React 19 + Tailwind v4 + Express app. Stage 1 of 3 (see the user's staging).

## 2.1 Inventory: objects, magnitudes, people, jobs, the product's own things

- Flashhub games (391 from /api/games): id, title, thumbnail, genres (runtime tags mixed in:
  Flash 100, HTML5 122, 3D/WebGL 99, Webport 97, Emulator 7), embedUrl, mirrors (126 with >1),
  description (46 have one), source (webporting 329, archive 60, custom 1; steam 1 = fake HL2).
- Ratings: every one is hard-coded 4.5-5.0 in src/utils/gameTitles.ts -> invented; not shown.
- Artwork: 291 quasar squares (200-225px), 20 Steam header.jpg (460x215), 60 archive images,
  19 server-drawn SVG covers (400x300). 17 of the 20 Steam-art webports also have
  library_hero.jpg (3840x1240) and library_600x900.jpg; 3 do not (Baldi Classic Remastered 1712710,
  Kindergarten 578590, Happy Sheepies 2764950).
- Steam owned games (when linked + server key): appId, name, playtime_forever, playtime_2weeks,
  rtime_last_played, icon; header/hero art by appId. Typical library: 50-500 games, many with
  0 minutes. Private "game details" -> empty list.
- Play history today: localStorage list of up to 8 ids, no times. Session length is measured
  (elapsedSeconds) and banked to the account as total minutes only.
- People: one player, evenings, a laptop or a phone; sessions of 5-60 minutes; returns to the
  same few games.
- Jobs: play a game (most frequent), continue the last game, find a game by name, browse by kind,
  keep favourites, open a Steam game in Steam, manage saves (Flash only).
- The product's own things: the FLASHHUB wordmark in Archivo 800, the red #ec3013, the runtimes
  (Ruffle for Flash, HTML5, WebGL/Unity, EmulatorJS), the preservation sources (quasar, genizy
  web-port, Internet Archive), the player's linked Steam account.

## 2.2 Questions and findings

- Home: "What do I play now?" Biggest block: the lead banner. With history it is the last game
  played (Continue); without, today's featured pick from the games that have full-size art.
  Finding under the title: the last game and when, or the size of the catalogue for a new player.
- Library: "Where is the game I want, and where will it launch?" Biggest block: the cover grid.
  Tabs carry the launch split (All / Plays in Flashhub / Steam / Favourites / Recently played).
- Game page: "Can I play this, and how?" Header = the game, with Play or Open in Steam.
- Player: the game itself; everything else folds away.
- Most frequent job one click away: Play on the banner, on every card (hover/focus), on rows.

## 2.3 Style

Dealt: true-black-flat (seed 1812660482), over data-terminal (built for long monitoring sessions).
Redraw: shell No sidebar -> Ruled T-frame. Reason: six destinations (Home, Library, Recently
played, Favourites, Steam, account/admin utilities) and the brief asks for sidebar library
navigation; "No sidebar" is for products with few destinations.

Brand kept (--keep palette,type): Archivo; accent #ec3013; square corners (the brand's zero
radius and the brief's "sharp edges" replace the style's 20px cards and pill controls).
Brand overrides the style's "accent never on buttons": the brief asks for the red on important
actions, so the red fills the one primary action per screen (Play / Open in Steam) and marks the
selected tab and focus. Budget held: under 3% of any screen.

Face: a warm near-black ground taken from the brand's own ink (#201e1d) instead of #000, with the
brand red as the one hue. Signature element: "Jump back in", one row ordered by real last-played
time across Flashhub sessions and Steam playtime, each tile saying where it launches.

## Tokens (style roles <- brand)

ground #0e0d0d · surface #171615 · raised #22201f · border #2a2827 · rule #1f1d1c ·
control #46423f · text #f3f2f2 (brand paper) · muted #b5b2b1 · faint #959291 ·
accent #ec3013 (label on it: #0e0d0d, 4.5:1; white is 4.0:1 and fails) · accent text #ff6a4d.
Sizes: title 20 · section 16 · kpi 24 · body 14 · small 12 (banner name 32, nothing >= 34).
Weights 400/600, 800 only in the wordmark. Gap 14 · pad 22 · control 36 · sidebar 220.

## Grid arithmetic (1440)

sidebar 220 + 1px rule = 221; canvas 1219; gutter 29 + 29 -> content 1161.
Cover grid: auto-fill minmax(172px, 1fr) with 14px gap -> 6 columns of 181.8px:
6 x 181.83 + 5 x 14 = 1161. Same 14px gap everywhere, so rows land on the content edges.
Rails (Jump back in, Favourites): the same 6 columns, capped at 6 items.
Art: one 4:3 frame; square art covers it, wide Steam headers sit whole on the raised tone.
