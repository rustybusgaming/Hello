import { GameMirror } from '../types';

/**
 * Hand-checked Flash titles hosted on the Internet Archive.
 *
 * Every id below was verified against https://archive.org/metadata/<id>: the item exists and
 * ships a real `.swf`, and the exact filename is used here. Games are played by streaming that
 * file into Ruffle through `/api/archive-swf`, not by embedding the Archive.org player, because
 * several Archive items are video captures rather than the game itself.
 */
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
  {
    id: 'sm64-web',
    title: 'Super Mario 64 (WASM Port)',
    thumbnail: '/api/cover/sm64-web?title=Super%20Mario%2064',
    rating: 5.0,
    source: 'webporting',
    embedUrl: 'https://mario64.netlify.app/',
    genres: ['Platformer', 'Adventure', '3D'],
    isArchiveIndependent: true,
    description: 'Decompiled Super Mario 64 running natively in WebAssembly with full gamepad support.',
    mirrors: [
      { id: 'sm64-primary', name: 'Web port', type: 'webport', url: 'https://mario64.netlify.app/', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quake-web',
    title: 'WebQuake (Quake 1 3D)',
    thumbnail: '/api/cover/quake-web?title=WebQuake',
    rating: 4.9,
    source: 'webporting',
    embedUrl: 'https://netquake.io/',
    genres: ['Shooter', 'Action', '3D'],
    isArchiveIndependent: true,
    description: 'Classic id Software Quake running via WebGL with WebSocket multiplayer.',
    mirrors: [
      { id: 'quake-primary', name: 'NetQuake WebGL', type: 'webport', url: 'https://netquake.io/', isArchiveIndependent: true }
    ]
  },
  {
    id: 'super-smash-flash-2',
    title: 'Super Smash Flash 2',
    thumbnail: '/api/archive-img/super-smash-flash-2',
    rating: 5.0,
    source: 'archive',
    embedUrl: '/play.html?title=Super%20Smash%20Flash%202&swf=/api/archive-swf/super-smash-flash-2/super-smash-flash-2.swf&autoplay=1',
    genres: ['Fighting', 'Action', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/super-smash-flash-2/super-smash-flash-2.swf',
    description: 'The definitive fan-made Super Smash Bros Flash game featuring Goku, Naruto, Sora, and Nintendo icons.',
    mirrors: [
      { id: 'super-smash-flash-2-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Super%20Smash%20Flash%202&swf=/api/archive-swf/super-smash-flash-2/super-smash-flash-2.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'super-smash-flash-2-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/super-smash-flash-2/super-smash-flash-2.swf', isArchiveIndependent: true },
      { id: 'super-smash-flash-2-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/super-smash-flash-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'swords-and-sandals-2',
    title: 'Swords and Sandals 2',
    thumbnail: '/api/archive-img/swords-and-sandals-2',
    rating: 4.7,
    source: 'archive',
    embedUrl: '/play.html?title=Swords%20and%20Sandals%202&swf=/api/archive-swf/swords-and-sandals-2/Swords%20and%20Sandals%202%20%28v%202.1.0%29.swf&autoplay=1',
    genres: ['RPG', 'Fighting', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/swords-and-sandals-2/Swords%20and%20Sandals%202%20%28v%202.1.0%29.swf',
    mirrors: [
      { id: 'swords-and-sandals-2-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Swords%20and%20Sandals%202&swf=/api/archive-swf/swords-and-sandals-2/Swords%20and%20Sandals%202%20%28v%202.1.0%29.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'swords-and-sandals-2-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/swords-and-sandals-2/Swords%20and%20Sandals%202%20%28v%202.1.0%29.swf', isArchiveIndependent: true },
      { id: 'swords-and-sandals-2-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/swords-and-sandals-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'strike-force-heroes-2',
    title: 'Strike Force Heroes 2',
    thumbnail: '/api/archive-img/strike-force-heroes-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: '/play.html?title=Strike%20Force%20Heroes%202&swf=/api/archive-swf/strike-force-heroes-2/strike-force-heroes-2.swf&autoplay=1',
    genres: ['Shooter', 'Action', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/strike-force-heroes-2/strike-force-heroes-2.swf',
    mirrors: [
      { id: 'strike-force-heroes-2-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Strike%20Force%20Heroes%202&swf=/api/archive-swf/strike-force-heroes-2/strike-force-heroes-2.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'strike-force-heroes-2-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/strike-force-heroes-2/strike-force-heroes-2.swf', isArchiveIndependent: true },
      { id: 'strike-force-heroes-2-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/strike-force-heroes-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'raze-2',
    title: 'Raze 2',
    thumbnail: '/api/archive-img/raze-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: '/play.html?title=Raze%202&swf=/api/archive-swf/raze-2/Raze%202.swf&autoplay=1',
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/raze-2/Raze%202.swf',
    mirrors: [
      { id: 'raze-2-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Raze%202&swf=/api/archive-swf/raze-2/Raze%202.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'raze-2-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/raze-2/Raze%202.swf', isArchiveIndependent: true },
      { id: 'raze-2-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/raze-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'super-mario-63',
    title: 'Super Mario 63',
    thumbnail: '/api/archive-img/super-mario-63',
    rating: 5.0,
    source: 'archive',
    embedUrl: '/play.html?title=Super%20Mario%2063&swf=/api/archive-swf/super-mario-63/Super_Mario_63.swf&autoplay=1',
    genres: ['Platformer', 'Adventure', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/super-mario-63/Super_Mario_63.swf',
    description: 'Runouw\'s magnum opus 2D homage to Super Mario 64 and Sunshine with the FLUDD pack and level editor.',
    mirrors: [
      { id: 'super-mario-63-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Super%20Mario%2063&swf=/api/archive-swf/super-mario-63/Super_Mario_63.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'super-mario-63-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/super-mario-63/Super_Mario_63.swf', isArchiveIndependent: true },
      { id: 'super-mario-63-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/super-mario-63', isArchiveIndependent: false }
    ]
  },
  {
    id: 'stick-war',
    title: 'Stick War',
    thumbnail: '/api/archive-img/stick-war',
    rating: 4.9,
    source: 'archive',
    embedUrl: '/play.html?title=Stick%20War&swf=/api/archive-swf/stick-war/Stick%20War.swf&autoplay=1',
    genres: ['Strategy', 'Stickman', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/stick-war/Stick%20War.swf',
    mirrors: [
      { id: 'stick-war-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Stick%20War&swf=/api/archive-swf/stick-war/Stick%20War.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'stick-war-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/stick-war/Stick%20War.swf', isArchiveIndependent: true },
      { id: 'stick-war-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/stick-war', isArchiveIndependent: false }
    ]
  },
  {
    id: 'sugar-sugar',
    title: 'Sugar, Sugar',
    thumbnail: '/api/archive-img/sugar-sugar',
    rating: 4.8,
    source: 'archive',
    embedUrl: '/play.html?title=Sugar%2C%20Sugar&swf=/api/archive-swf/sugar-sugar/SugarSugar.swf&autoplay=1',
    genres: ['Physics', 'Puzzle', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/sugar-sugar/SugarSugar.swf',
    mirrors: [
      { id: 'sugar-sugar-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Sugar%2C%20Sugar&swf=/api/archive-swf/sugar-sugar/SugarSugar.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'sugar-sugar-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/sugar-sugar/SugarSugar.swf', isArchiveIndependent: true },
      { id: 'sugar-sugar-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/sugar-sugar', isArchiveIndependent: false }
    ]
  },
  {
    id: 'bad-ice-cream',
    title: 'Bad Ice Cream',
    thumbnail: '/api/archive-img/bad-ice-cream',
    rating: 4.9,
    source: 'archive',
    embedUrl: '/play.html?title=Bad%20Ice%20Cream&swf=/api/archive-swf/bad-ice-cream/Bad-Ice-Cream.swf&autoplay=1',
    genres: ['Arcade', 'Retro', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/bad-ice-cream/Bad-Ice-Cream.swf',
    mirrors: [
      { id: 'bad-ice-cream-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Bad%20Ice%20Cream&swf=/api/archive-swf/bad-ice-cream/Bad-Ice-Cream.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'bad-ice-cream-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/bad-ice-cream/Bad-Ice-Cream.swf', isArchiveIndependent: true },
      { id: 'bad-ice-cream-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/bad-ice-cream', isArchiveIndependent: false }
    ]
  },
  {
    id: 'plazma-burst-2',
    title: 'Plazma Burst 2',
    thumbnail: '/api/archive-img/plazma-burst-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: '/play.html?title=Plazma%20Burst%202&swf=/api/archive-swf/plazma-burst-2/PlazmaBurst%202%20%281%29.swf&autoplay=1',
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/plazma-burst-2/PlazmaBurst%202%20%281%29.swf',
    mirrors: [
      { id: 'plazma-burst-2-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Plazma%20Burst%202&swf=/api/archive-swf/plazma-burst-2/PlazmaBurst%202%20%281%29.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'plazma-burst-2-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/plazma-burst-2/PlazmaBurst%202%20%281%29.swf', isArchiveIndependent: true },
      { id: 'plazma-burst-2-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/plazma-burst-2', isArchiveIndependent: false }
    ]
  },
  {
    id: 'breaking-the-bank',
    title: 'Henry Stickmin: Breaking the Bank',
    thumbnail: '/api/archive-img/breaking-the-bank',
    rating: 4.8,
    source: 'archive',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Breaking%20the%20Bank&swf=/api/archive-swf/breaking-the-bank/BreakingTheBank.swf&autoplay=1',
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/breaking-the-bank/BreakingTheBank.swf',
    description: 'The hilarious origin story of Henry Stickmin trying to break into a bank vault in the desert.',
    mirrors: [
      { id: 'breaking-the-bank-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Breaking%20the%20Bank&swf=/api/archive-swf/breaking-the-bank/BreakingTheBank.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'breaking-the-bank-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/breaking-the-bank/BreakingTheBank.swf', isArchiveIndependent: true },
      { id: 'breaking-the-bank-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/breaking-the-bank', isArchiveIndependent: false }
    ]
  },
  {
    id: 'effing-worms',
    title: 'Effing Worms',
    thumbnail: '/api/archive-img/effing-worms',
    rating: 4.7,
    source: 'archive',
    embedUrl: '/play.html?title=Effing%20Worms&swf=/api/archive-swf/effing-worms/EffingWorms.swf&autoplay=1',
    genres: ['Action', 'Arcade', 'Flash'],
    isArchiveIndependent: true,
    swfUrl: '/api/archive-swf/effing-worms/EffingWorms.swf',
    mirrors: [
      { id: 'effing-worms-ruffle', name: 'Ruffle', type: 'ruffle', url: '/play.html?title=Effing%20Worms&swf=/api/archive-swf/effing-worms/EffingWorms.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'effing-worms-file', name: 'Direct file', type: 'mirror', url: '/api/archive-swf/effing-worms/EffingWorms.swf', isArchiveIndependent: true },
      { id: 'effing-worms-details', name: 'Archive.org', type: 'archive', url: 'https://archive.org/details/effing-worms', isArchiveIndependent: false }
    ]
  },
];
