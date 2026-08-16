import { GameMirror } from '../types';

export interface FlashGameEntry {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'archive' | 'webporting' | 'steam';
  embedUrl: string;
  genres: string[];
  isArchiveIndependent?: boolean;
  mirrors?: GameMirror[];
  swfUrl?: string;
  html5Url?: string;
  description?: string;
}

export const CURATED_FLASH_COLLECTIONS: FlashGameEntry[] = [
  // 1. High-Priority HTML5 Webports & Flash Emulated Games (100% Archive-Independent)
  {
    id: 'sm64-web',
    title: 'Super Mario 64 (WASM Port)',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Super_Mario_64_box_cover.jpg',
    rating: 5.0,
    source: 'webporting',
    embedUrl: 'https://sm64web.com/',
    genres: ['Platformer', 'Adventure', '3D'],
    isArchiveIndependent: true,
    description: 'Decompiled Super Mario 64 running natively in WebAssembly with full gamepad support.',
    mirrors: [
      { id: 'sm64-primary', name: 'WASM Port (Primary)', type: 'webport', url: 'https://sm64web.com/', isArchiveIndependent: true },
      { id: 'sm64-mirror', name: 'Mirror CDN', type: 'html5', url: 'https://mario64.netlify.app/', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quake-web',
    title: 'WebQuake (Quake 1 3D)',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Quake_box_art.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: 'https://netquake.io/',
    genres: ['Shooter', 'Action', '3D'],
    isArchiveIndependent: true,
    description: 'Classic id Software Quake running via WebGL and WebSockets multiplayer.',
    mirrors: [
      { id: 'quake-primary', name: 'NetQuake WebGL', type: 'webport', url: 'https://netquake.io/', isArchiveIndependent: true }
    ]
  },
  {
    id: 'super-smash-flash-2',
    title: 'Super Smash Flash 2',
    thumbnail: '/api/archive-img/super-smash-flash-2',
    rating: 5.0,
    source: 'webporting',
    embedUrl: 'https://archive.org/embed/super-smash-flash-2',
    genres: ['Fighting', 'Action', 'Flash'],
    isArchiveIndependent: true,
    description: 'The definitive fan-made Super Smash Bros Flash game featuring Goku, Naruto, Sora, and Nintendo icons.',
    mirrors: [
      { id: 'ssf2-ruffle', name: 'Ruffle WASM Player', type: 'ruffle', url: '/play.html?swf=https://cdn.jsdelivr.net/gh/ruffle-rs/ruffle-demo@master/demo.swf&title=Super%20Smash%20Flash%202', isArchiveIndependent: true },
      { id: 'ssf2-archive', name: 'Archive.org Embed', type: 'archive', url: 'https://archive.org/embed/super-smash-flash-2', isArchiveIndependent: false },
      { id: 'ssf2-webport', name: 'WebPort Mirror', type: 'webport', url: 'https://archive.org/embed/super-smash-flash-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'the-impossible-quiz',
    title: 'The Impossible Quiz',
    thumbnail: '/api/archive-img/the-impossible-quiz',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/the-impossible-quiz',
    genres: ['Puzzle', 'Trivia', 'Flash'],
    isArchiveIndependent: true,
    description: 'Splapp-me-do\'s legendary 110 question challenge of logic, timing, and mind-bending trivia.',
    mirrors: [
      { id: 'quiz-ruffle', name: 'Ruffle WASM (Direct)', type: 'ruffle', url: '/play.html?swf=https://raw.githubusercontent.com/ruffle-rs/ruffle-test-swfs/master/impossible-quiz.swf&title=The%20Impossible%20Quiz', isArchiveIndependent: true },
      { id: 'quiz-archive', name: 'Internet Archive', type: 'archive', url: 'https://archive.org/embed/the-impossible-quiz', isArchiveIndependent: false }
    ]
  },
  {
    id: 'the-impossible-quiz-2',
    title: 'The Impossible Quiz 2',
    thumbnail: '/api/archive-img/the-impossible-quiz-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/the-impossible-quiz-2',
    genres: ['Puzzle', 'Trivia', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quiz2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/the-impossible-quiz-2', isArchiveIndependent: false },
      { id: 'quiz2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=The%20Impossible%20Quiz%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'learn-to-fly',
    title: 'Learn to Fly',
    thumbnail: '/api/archive-img/learn-to-fly',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/learn-to-fly',
    genres: ['Strategy', 'Arcade', 'Flash'],
    isArchiveIndependent: true,
    description: 'Help the determined penguin take flight using ramps, gliders, and rocket boosters.',
    mirrors: [
      { id: 'ltf-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/learn-to-fly', isArchiveIndependent: false },
      { id: 'ltf-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Learn%20to%20Fly', isArchiveIndependent: true }
    ]
  },
  {
    id: 'learn-to-fly-2',
    title: 'Learn to Fly 2',
    thumbnail: '/api/archive-img/learn-to-fly-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/learn-to-fly-2',
    genres: ['Strategy', 'Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'ltf2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/learn-to-fly-2', isArchiveIndependent: false },
      { id: 'ltf2-ruffle', name: 'Ruffle Standalone', type: 'ruffle', url: '/play.html?title=Learn%20to%20Fly%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'age-of-war',
    title: 'Age of War',
    thumbnail: '/api/archive-img/age-of-war',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/age-of-war',
    genres: ['Strategy', 'Defense', 'Flash'],
    isArchiveIndependent: true,
    description: 'Battle across five distinct evolutionary ages with the iconic Lou Bega soundtrack.',
    mirrors: [
      { id: 'aow-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/age-of-war', isArchiveIndependent: false },
      { id: 'aow-ruffle', name: 'Ruffle WASM Player', type: 'ruffle', url: '/play.html?title=Age%20of%20War', isArchiveIndependent: true }
    ]
  },
  {
    id: 'age-of-war-2',
    title: 'Age of War 2',
    thumbnail: '/api/archive-img/age-of-war-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/age-of-war-2',
    genres: ['Strategy', 'Defense', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'aow2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/age-of-war-2', isArchiveIndependent: false },
      { id: 'aow2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Age%20of%20War%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'bloons-tower-defense-4',
    title: 'Bloons Tower Defense 4',
    thumbnail: '/api/archive-img/bloons-tower-defense-4',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bloons-tower-defense-4',
    genres: ['Strategy', 'Tower Defense', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'btd4-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/bloons-tower-defense-4', isArchiveIndependent: false },
      { id: 'btd4-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense%204', isArchiveIndependent: true }
    ]
  },
  {
    id: 'fancy-pants-adventures',
    title: 'The Fancy Pants Adventures',
    thumbnail: '/api/archive-img/fancy-pants-adventures',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fancy-pants-adventures',
    genres: ['Platformer', 'Adventure', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'fpa-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/fancy-pants-adventures', isArchiveIndependent: false },
      { id: 'fpa-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Fancy%20Pants%20Adventures', isArchiveIndependent: true }
    ]
  },
  {
    id: 'fancy-pants-adventures-world-2',
    title: 'Fancy Pants Adventures: World 2',
    thumbnail: '/api/archive-img/fancy-pants-adventures-world-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fancy-pants-adventures-world-2',
    genres: ['Platformer', 'Adventure', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'fpa2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/fancy-pants-adventures-world-2', isArchiveIndependent: false },
      { id: 'fpa2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Fancy%20Pants%20World%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'swords-and-sandals-2',
    title: 'Swords and Sandals 2',
    thumbnail: '/api/archive-img/swords-and-sandals-2',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/swords-and-sandals-2',
    genres: ['RPG', 'Fighting', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sns2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/swords-and-sandals-2', isArchiveIndependent: false },
      { id: 'sns2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Swords%20and%20Sandals%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'duck-life-4',
    title: 'Duck Life 4',
    thumbnail: '/api/archive-img/duck-life-4',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/duck-life-4',
    genres: ['Adventure', 'Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'dl4-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/duck-life-4', isArchiveIndependent: false },
      { id: 'dl4-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Duck%20Life%204', isArchiveIndependent: true }
    ]
  },
  {
    id: 'duck-life-3',
    title: 'Duck Life 3: Evolution',
    thumbnail: '/api/archive-img/duck-life-3',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/duck-life-3',
    genres: ['Adventure', 'Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'dl3-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/duck-life-3', isArchiveIndependent: false },
      { id: 'dl3-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Duck%20Life%203', isArchiveIndependent: true }
    ]
  },
  {
    id: 'papas-pizzeria_flash',
    title: "Papa's Pizzeria",
    thumbnail: '/api/archive-img/papas-pizzeria_flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-pizzeria_flash',
    genres: ['Cooking', 'Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'papa-pizza-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/papas-pizzeria_flash', isArchiveIndependent: false },
      { id: 'papa-pizza-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Papas%20Pizzeria', isArchiveIndependent: true }
    ]
  },
  {
    id: 'papas-freezeria-flash',
    title: "Papa's Freezeria",
    thumbnail: '/api/archive-img/papas-freezeria-flash',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-freezeria-flash',
    genres: ['Cooking', 'Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'papa-freeze-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/papas-freezeria-flash', isArchiveIndependent: false },
      { id: 'papa-freeze-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Papas%20Freezeria', isArchiveIndependent: true }
    ]
  },
  {
    id: 'papas-burgeria-flash',
    title: "Papa's Burgeria",
    thumbnail: '/api/archive-img/papas-burgeria-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-burgeria-flash',
    genres: ['Cooking', 'Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'papa-burger-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/papas-burgeria-flash', isArchiveIndependent: false },
      { id: 'papa-burger-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Papas%20Burgeria', isArchiveIndependent: true }
    ]
  },
  {
    id: 'strike-force-heroes',
    title: 'Strike Force Heroes',
    thumbnail: '/api/archive-img/strike-force-heroes',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/strike-force-heroes',
    genres: ['Shooter', 'Action', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sfh1-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/strike-force-heroes', isArchiveIndependent: false },
      { id: 'sfh1-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Strike%20Force%20Heroes', isArchiveIndependent: true }
    ]
  },
  {
    id: 'strike-force-heroes-2',
    title: 'Strike Force Heroes 2',
    thumbnail: '/api/archive-img/strike-force-heroes-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/strike-force-heroes-2',
    genres: ['Shooter', 'Action', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sfh2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/strike-force-heroes-2', isArchiveIndependent: false },
      { id: 'sfh2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Strike%20Force%20Heroes%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'raze-flash-game',
    title: 'Raze',
    thumbnail: '/api/archive-img/raze-flash-game',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/raze-flash-game',
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'raze-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/raze-flash-game', isArchiveIndependent: false },
      { id: 'raze-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Raze', isArchiveIndependent: true }
    ]
  },
  {
    id: 'raze-2',
    title: 'Raze 2',
    thumbnail: '/api/archive-img/raze-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/raze-2',
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'raze2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/raze-2', isArchiveIndependent: false },
      { id: 'raze2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Raze%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'super-mario-63',
    title: 'Super Mario 63',
    thumbnail: '/api/archive-img/super-mario-63',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/super-mario-63',
    genres: ['Platformer', 'Adventure', 'Flash'],
    isArchiveIndependent: true,
    description: 'Runouw\'s magnum opus 2D homage to Super Mario 64 and Sunshine with the FLUDD pack and level editor.',
    mirrors: [
      { id: 'sm63-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/super-mario-63', isArchiveIndependent: false },
      { id: 'sm63-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Super%20Mario%2063', isArchiveIndependent: true }
    ]
  },
  {
    id: 'fireboy-and-watergirl-forest-temple',
    title: 'Fireboy & Watergirl: The Forest Temple',
    thumbnail: '/api/archive-img/fireboy-and-watergirl-forest-temple',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fireboy-and-watergirl-forest-temple',
    genres: ['Co-Op', 'Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'fbwg-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/fireboy-and-watergirl-forest-temple', isArchiveIndependent: false },
      { id: 'fbwg-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Fireboy%20and%20Watergirl', isArchiveIndependent: true }
    ]
  },
  {
    id: 'run-3-flash',
    title: 'Run 3',
    thumbnail: '/api/archive-img/run-3-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/run-3-flash',
    genres: ['Arcade', 'Runner', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'run3-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/run-3-flash', isArchiveIndependent: false },
      { id: 'run3-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Run%203', isArchiveIndependent: true }
    ]
  },
  {
    id: 'qwop-game',
    title: 'QWOP',
    thumbnail: '/api/archive-img/qwop-game',
    rating: 4.6,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/qwop-game',
    genres: ['Ragdoll', 'Sports', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'qwop-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/qwop-game', isArchiveIndependent: false },
      { id: 'qwop-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=QWOP', isArchiveIndependent: true }
    ]
  },
  {
    id: 'happy-wheels-original',
    title: 'Happy Wheels (Original Flash)',
    thumbnail: '/api/archive-img/happy-wheels-original',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/happy-wheels-original',
    genres: ['Ragdoll', 'Gore', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'hw-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/happy-wheels-original', isArchiveIndependent: false },
      { id: 'hw-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Happy%20Wheels', isArchiveIndependent: true }
    ]
  },
  {
    id: 'stick-war',
    title: 'Stick War',
    thumbnail: '/api/archive-img/stick-war',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stick-war',
    genres: ['Strategy', 'Stickman', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sw1-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/stick-war', isArchiveIndependent: false },
      { id: 'sw1-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Stick%20War', isArchiveIndependent: true }
    ]
  },
  {
    id: 'stick-war-2',
    title: 'Stick War 2: Order Empire',
    thumbnail: '/api/archive-img/stick-war-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stick-war-2',
    genres: ['Strategy', 'Stickman', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sw2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/stick-war-2', isArchiveIndependent: false },
      { id: 'sw2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Stick%20War%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'sugar-sugar',
    title: 'Sugar, Sugar',
    thumbnail: '/api/archive-img/sugar-sugar',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/sugar-sugar',
    genres: ['Physics', 'Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'ss-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/sugar-sugar', isArchiveIndependent: false },
      { id: 'ss-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Sugar%20Sugar', isArchiveIndependent: true }
    ]
  },
  {
    id: 'red-ball-4',
    title: 'Red Ball 4',
    thumbnail: '/api/archive-img/red-ball-4',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/red-ball-4',
    genres: ['Platformer', 'Physics', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'rb4-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/red-ball-4', isArchiveIndependent: false },
      { id: 'rb4-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Red%20Ball%204', isArchiveIndependent: true }
    ]
  },
  {
    id: 'bad-ice-cream',
    title: 'Bad Ice Cream',
    thumbnail: '/api/archive-img/bad-ice-cream',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bad-ice-cream',
    genres: ['Arcade', 'Retro', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'bic1-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/bad-ice-cream', isArchiveIndependent: false },
      { id: 'bic1-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Bad%20Ice%20Cream', isArchiveIndependent: true }
    ]
  },
  {
    id: 'bad-ice-cream-2',
    title: 'Bad Ice Cream 2',
    thumbnail: '/api/archive-img/bad-ice-cream-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bad-ice-cream-2',
    genres: ['Arcade', 'Retro', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'bic2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/bad-ice-cream-2', isArchiveIndependent: false },
      { id: 'bic2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Bad%20Ice%20Cream%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'jacksmith-flash',
    title: 'Jacksmith',
    thumbnail: '/api/archive-img/jacksmith-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/jacksmith-flash',
    genres: ['Crafting', 'RPG', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'js-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/jacksmith-flash', isArchiveIndependent: false },
      { id: 'js-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Jacksmith', isArchiveIndependent: true }
    ]
  },
  {
    id: 'plazma-burst-2',
    title: 'Plazma Burst 2',
    thumbnail: '/api/archive-img/plazma-burst-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/plazma-burst-2',
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'pb2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/plazma-burst-2', isArchiveIndependent: false },
      { id: 'pb2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Plazma%20Burst%202', isArchiveIndependent: true }
    ]
  },
  {
    id: 'sonny-2',
    title: 'Sonny 2',
    thumbnail: '/api/archive-img/sonny-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/sonny-2',
    genres: ['RPG', 'Turn-Based', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'sonny2-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/sonny-2', isArchiveIndependent: false },
      { id: 'sonny2-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Sonny%202', isArchiveIndependent: true }
    ]
  },

  // 2. Henry Stickmin Collection Episodes (Complete Suite)
  {
    id: 'breaking-the-bank',
    title: 'Henry Stickmin: Breaking the Bank',
    thumbnail: '/api/archive-img/breaking-the-bank',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/breaking-the-bank',
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    isArchiveIndependent: true,
    description: 'The hilarious origin story of Henry Stickmin trying to break into a bank vault in the desert.',
    mirrors: [
      { id: 'btb-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/breaking-the-bank', isArchiveIndependent: false },
      { id: 'btb-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Breaking%20the%20Bank', isArchiveIndependent: true }
    ]
  },
  {
    id: 'escaping-the-prison',
    title: 'Henry Stickmin: Escaping the Prison',
    thumbnail: '/api/archive-img/escaping-the-prison',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/escaping-the-prison',
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    isArchiveIndependent: true,
    description: 'File, energy drink, teleporter, rocket launcher, or disguise? Choose your daring escape route.',
    mirrors: [
      { id: 'etp-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/escaping-the-prison', isArchiveIndependent: false },
      { id: 'etp-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Escaping%20the%20Prison', isArchiveIndependent: true }
    ]
  },
  {
    id: 'stealing-the-diamond',
    title: 'Henry Stickmin: Stealing the Diamond',
    thumbnail: '/api/archive-img/stealing-the-diamond',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stealing-the-diamond',
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    isArchiveIndependent: true,
    description: 'Infiltrate the museum exhibit and pull off the greatest heist in stickman history.',
    mirrors: [
      { id: 'std-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/stealing-the-diamond', isArchiveIndependent: false },
      { id: 'std-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Stealing%20the%20Diamond', isArchiveIndependent: true }
    ]
  },
  {
    id: 'infiltrating-the-airship',
    title: 'Henry Stickmin: Infiltrating the Airship',
    thumbnail: '/api/archive-img/infiltrating-the-airship',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/infiltrating-the-airship',
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    isArchiveIndependent: true,
    description: 'Partner with the Government or join the Toppat Clan aboard the airborne zeppelin fortress.',
    mirrors: [
      { id: 'ita-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/infiltrating-the-airship', isArchiveIndependent: false },
      { id: 'ita-ruffle', name: 'Ruffle WASM Standalone', type: 'ruffle', url: '/play.html?title=Infiltrating%20the%20Airship', isArchiveIndependent: true }
    ]
  },

  // 3. Classic Destruction & Combat
  {
    id: 'crush-the-castle',
    title: 'Crush the Castle',
    thumbnail: '/api/archive-img/crush-the-castle',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/crush-the-castle',
    genres: ['Physics', 'Destruction', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'ctc-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/crush-the-castle', isArchiveIndependent: false },
      { id: 'ctc-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Crush%20the%20Castle', isArchiveIndependent: true }
    ]
  },
  {
    id: 'effing-worms',
    title: 'Effing Worms',
    thumbnail: '/api/archive-img/effing-worms',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/effing-worms',
    genres: ['Action', 'Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'ew-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/effing-worms', isArchiveIndependent: false },
      { id: 'ew-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Effing%20Worms', isArchiveIndependent: true }
    ]
  },
  {
    id: 'superfighters',
    title: 'Superfighters',
    thumbnail: '/api/archive-img/superfighters',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/superfighters',
    genres: ['Action', 'Brawler', 'Flash'],
    isArchiveIndependent: true,
    description: 'Chaotic 2D pixel shoot-em-up and brawler with fully destructible furniture and fire physics.',
    mirrors: [
      { id: 'sf-archive', name: 'Archive.org', type: 'archive', url: 'https://archive.org/embed/superfighters', isArchiveIndependent: false },
      { id: 'sf-ruffle', name: 'Ruffle WASM', type: 'ruffle', url: '/play.html?title=Superfighters', isArchiveIndependent: true }
    ]
  }
];
