import { GameMirror } from '../types';

/**
 * The full catalogue mirrored from the `slqntdevss/quasar` repository — Flash, HTML5, Unity
 * WebGL, and console-emulator shells — served on demand through `/api/quasar/*`.
 *
 * Generated from that repo's own `public/assets/json/storage.json`, cross-checked against the
 * repository tree: every entry here resolves to a real launch file (a `.swf`, or an
 * `index.html`) at the path the catalogue actually uses, which is NOT always the game id.
 * Nothing here depends on Archive.org.
 */
export interface QuasarGameEntry {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'webporting';
  embedUrl: string;
  genres: string[];
  isArchiveIndependent: true;
  mirrors?: GameMirror[];
}

const CDN = 'https://cdn.jsdelivr.net/gh/slqntdevss/quasar@main/public/assets/img';

export const QUASAR_FLASH_GAMES: QuasarGameEntry[] = [
  {
    id: 'quasar-dl1',
    title: 'Duck Life 1',
    thumbnail: `${CDN}/dl1.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Duck%20Life%201&swf=/api/quasar/storage/flash/dl1/game.swf&autoplay=1',
    genres: ['Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-dl1-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Duck%20Life%201&swf=/api/quasar/storage/flash/dl1/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-dl1-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/dl1/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-dl2',
    title: 'Duck Life 2',
    thumbnail: `${CDN}/dl2.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Duck%20Life%202&swf=/api/quasar/storage/flash/dl2/game.swf&autoplay=1',
    genres: ['Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-dl2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Duck%20Life%202&swf=/api/quasar/storage/flash/dl2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-dl2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/dl2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-dl3',
    title: 'Duck Life 3',
    thumbnail: `${CDN}/dl3.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Duck%20Life%203&swf=/api/quasar/storage/flash/dl3/game.swf&autoplay=1',
    genres: ['Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-dl3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Duck%20Life%203&swf=/api/quasar/storage/flash/dl3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-dl3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/dl3/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-dl4',
    title: 'Duck Life 4',
    thumbnail: `${CDN}/dl4.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Duck%20Life%204&swf=/api/quasar/storage/flash/dl4/game.swf&autoplay=1',
    genres: ['Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-dl4-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Duck%20Life%204&swf=/api/quasar/storage/flash/dl4/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-dl4-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/dl4/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pbake',
    title: 'Papa\'s Bakeria',
    thumbnail: `${CDN}/pbake.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Bakeria&swf=/api/quasar/storage/flash/pbake/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pbake-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Bakeria&swf=/api/quasar/storage/flash/pbake/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pbake-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pbake/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pburg',
    title: 'Papa\'s Burgeria',
    thumbnail: `${CDN}/pburg.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Burgeria&swf=/api/quasar/storage/flash/pburg/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pburg-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Burgeria&swf=/api/quasar/storage/flash/pburg/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pburg-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pburg/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pchee',
    title: 'Papa\'s Cheeseria',
    thumbnail: `${CDN}/pchee.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Cheeseria&swf=/api/quasar/storage/flash/pchee/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pchee-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Cheeseria&swf=/api/quasar/storage/flash/pchee/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pchee-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pchee/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pcupc',
    title: 'Papa\'s Cupcakeria',
    thumbnail: `${CDN}/pcupc.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Cupcakeria&swf=/api/quasar/storage/flash/pcupc/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pcupc-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Cupcakeria&swf=/api/quasar/storage/flash/pcupc/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pcupc-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pcupc/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pdonut',
    title: 'Papa\'s Donuteria',
    thumbnail: `${CDN}/pdonut.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Donuteria&swf=/api/quasar/storage/flash/pdonut/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pdonut-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Donuteria&swf=/api/quasar/storage/flash/pdonut/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pdonut-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pdonut/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pfreeze',
    title: 'Papa\'s Freezeria',
    thumbnail: `${CDN}/pfreeze.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Freezeria&swf=/api/quasar/storage/flash/pfreeze/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pfreeze-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Freezeria&swf=/api/quasar/storage/flash/pfreeze/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pfreeze-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pfreeze/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-photdog',
    title: 'Papa\'s Hotdoggeria',
    thumbnail: `${CDN}/photdog.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Hotdoggeria&swf=/api/quasar/storage/flash/photdog/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-photdog-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Hotdoggeria&swf=/api/quasar/storage/flash/photdog/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-photdog-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/photdog/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ppan',
    title: 'Papa\'s Pancakeria',
    thumbnail: `${CDN}/ppan.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Pancakeria&swf=/api/quasar/storage/flash/ppan/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ppan-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Pancakeria&swf=/api/quasar/storage/flash/ppan/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ppan-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ppan/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ppasta',
    title: 'Papa\'s Pastaria',
    thumbnail: `${CDN}/ppasta.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Pastaria&swf=/api/quasar/storage/flash/ppasta/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ppasta-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Pastaria&swf=/api/quasar/storage/flash/ppasta/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ppasta-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ppasta/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ppizza',
    title: 'Papa\'s Pizzaria',
    thumbnail: `${CDN}/ppizza.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Pizzaria&swf=/api/quasar/storage/flash/ppizza/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ppizza-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Pizzaria&swf=/api/quasar/storage/flash/ppizza/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ppizza-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ppizza/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pscoop',
    title: 'Papa\'s Scooperia',
    thumbnail: `${CDN}/pscoop.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Scooperia&swf=/api/quasar/storage/flash/pscoop/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pscoop-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Scooperia&swf=/api/quasar/storage/flash/pscoop/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pscoop-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pscoop/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-psushi',
    title: 'Papa\'s Sushieria',
    thumbnail: `${CDN}/psushi.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Sushieria&swf=/api/quasar/storage/flash/psushi/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-psushi-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Sushieria&swf=/api/quasar/storage/flash/psushi/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-psushi-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/psushi/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-pwing',
    title: 'Papa\'s Wingeria',
    thumbnail: `${CDN}/pwing.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Papa%27s%20Wingeria&swf=/api/quasar/storage/flash/pwing/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-pwing-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Papa%27s%20Wingeria&swf=/api/quasar/storage/flash/pwing/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-pwing-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/pwing/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-whg',
    title: 'Worlds Hardest Game',
    thumbnail: `${CDN}/whg.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Worlds%20Hardest%20Game&swf=/api/quasar/storage/flash/whg/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-whg-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Worlds%20Hardest%20Game&swf=/api/quasar/storage/flash/whg/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-whg-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/whg/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-whg2',
    title: 'Worlds Hardest Game 2',
    thumbnail: `${CDN}/whg2.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Worlds%20Hardest%20Game%202&swf=/api/quasar/storage/flash/whg2/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-whg2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Worlds%20Hardest%20Game%202&swf=/api/quasar/storage/flash/whg2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-whg2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/whg2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-au',
    title: 'Achievement Unlocked',
    thumbnail: `${CDN}/au.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Achievement%20Unlocked&swf=/api/quasar/storage/flash/au1/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-au-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Achievement%20Unlocked&swf=/api/quasar/storage/flash/au1/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-au-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/au1/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-au2',
    title: 'Achievement Unlocked 2',
    thumbnail: `${CDN}/au2.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Achievement%20Unlocked%202&swf=/api/quasar/storage/flash/au2/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-au2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Achievement%20Unlocked%202&swf=/api/quasar/storage/flash/au2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-au2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/au2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-au3',
    title: 'Achievement Unlocked 3',
    thumbnail: `${CDN}/au3.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Achievement%20Unlocked%203&swf=/api/quasar/storage/flash/au3/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-au3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Achievement%20Unlocked%203&swf=/api/quasar/storage/flash/au3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-au3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/au3/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rw',
    title: 'Raft Wars',
    thumbnail: `${CDN}/rw.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Raft%20Wars&swf=/api/quasar/storage/flash/rw/game.swf&autoplay=1',
    genres: ['Action', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rw-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Raft%20Wars&swf=/api/quasar/storage/flash/rw/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rw-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rw/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rw2',
    title: 'Raft Wars 2',
    thumbnail: `${CDN}/rw2.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Raft%20Wars%202&swf=/api/quasar/storage/flash/rw2/game.swf&autoplay=1',
    genres: ['Action', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rw2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Raft%20Wars%202&swf=/api/quasar/storage/flash/rw2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rw2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rw2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-btd',
    title: 'Bloons Tower Defense',
    thumbnail: `${CDN}/btd.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloons%20Tower%20Defense&swf=/api/quasar/storage/flash/btd/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-btd-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense&swf=/api/quasar/storage/flash/btd/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-btd-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btd/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-btd2',
    title: 'Bloons Tower Defense 2',
    thumbnail: `${CDN}/btd2.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloons%20Tower%20Defense%202&swf=/api/quasar/storage/flash/btd2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-btd2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense%202&swf=/api/quasar/storage/flash/btd2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-btd2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btd2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-btdd3',
    title: 'Bloons Tower Defense 3',
    thumbnail: `${CDN}/btd3.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloons%20Tower%20Defense%203&swf=/api/quasar/storage/flash/btd3/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-btdd3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense%203&swf=/api/quasar/storage/flash/btd3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-btdd3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btd3/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-btd4',
    title: 'Bloons Tower Defense 4',
    thumbnail: `${CDN}/btd4.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloons%20Tower%20Defense%204&swf=/api/quasar/storage/flash/btd4/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-btd4-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense%204&swf=/api/quasar/storage/flash/btd4/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-btd4-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btd4/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hsbtb',
    title: 'Henry Stickmin: Breaking the Bank',
    thumbnail: `${CDN}/btb.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Breaking%20the%20Bank&swf=/api/quasar/storage/flash/btb/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hsbtb-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Breaking%20the%20Bank&swf=/api/quasar/storage/flash/btb/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hsbtb-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btb/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hsetp',
    title: 'Henry Stickmin: Escaping the Prison',
    thumbnail: `${CDN}/etp.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Escaping%20the%20Prison&swf=/api/quasar/storage/flash/etp/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hsetp-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Escaping%20the%20Prison&swf=/api/quasar/storage/flash/etp/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hsetp-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/etp/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hsstd',
    title: 'Henry Stickmin: Stealing the Diamond',
    thumbnail: `${CDN}/std.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Stealing%20the%20Diamond&swf=/api/quasar/storage/flash/std/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hsstd-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Stealing%20the%20Diamond&swf=/api/quasar/storage/flash/std/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hsstd-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/std/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hsita',
    title: 'Henry Stickmin: Infiltrating the Airship',
    thumbnail: `${CDN}/ita.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Infiltrating%20the%20Airship&swf=/api/quasar/storage/flash/ita/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hsita-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Infiltrating%20the%20Airship&swf=/api/quasar/storage/flash/ita/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hsita-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ita/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hsftc',
    title: 'Henry Stickmin: Fleeing the Complex',
    thumbnail: `${CDN}/ftc.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Henry%20Stickmin%3A%20Fleeing%20the%20Complex&swf=/api/quasar/storage/flash/ftc/game.swf&autoplay=1',
    genres: ['Puzzle', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hsftc-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Henry%20Stickmin%3A%20Fleeing%20the%20Complex&swf=/api/quasar/storage/flash/ftc/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hsftc-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ftc/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ffs',
    title: 'Flash Flight Simulator',
    thumbnail: `${CDN}/ffs.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Flash%20Flight%20Simulator&swf=/api/quasar/storage/flash/ffs/game.swf&autoplay=1',
    genres: ['Simulation', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ffs-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Flash%20Flight%20Simulator&swf=/api/quasar/storage/flash/ffs/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ffs-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ffs/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-sth2',
    title: 'Storm the House 2',
    thumbnail: `${CDN}/sth2.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Storm%20the%20House%202&swf=/api/quasar/storage/flash/sth2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-sth2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Storm%20the%20House%202&swf=/api/quasar/storage/flash/sth2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-sth2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/sth2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rs1',
    title: 'Riddle School',
    thumbnail: `${CDN}/rs1.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20School&swf=/api/quasar/storage/flash/rs1/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rs1-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20School&swf=/api/quasar/storage/flash/rs1/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rs1-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rs1/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rs2',
    title: 'Riddle School 2',
    thumbnail: `${CDN}/rs2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20School%202&swf=/api/quasar/storage/flash/rs2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rs2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20School%202&swf=/api/quasar/storage/flash/rs2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rs2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rs2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rs3',
    title: 'Riddle School 3',
    thumbnail: `${CDN}/rs3.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20School%203&swf=/api/quasar/storage/flash/rs3/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rs3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20School%203&swf=/api/quasar/storage/flash/rs3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rs3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rs3/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rs4',
    title: 'Riddle School 4',
    thumbnail: `${CDN}/rs4.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20School%204&swf=/api/quasar/storage/flash/rs4/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rs4-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20School%204&swf=/api/quasar/storage/flash/rs4/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rs4-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rs4/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rs5',
    title: 'Riddle School 5',
    thumbnail: `${CDN}/rs5.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20School%205&swf=/api/quasar/storage/flash/rs5/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rs5-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20School%205&swf=/api/quasar/storage/flash/rs5/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rs5-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rs5/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rt1',
    title: 'Riddle Transfer',
    thumbnail: `${CDN}/rt1.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20Transfer&swf=/api/quasar/storage/flash/rt1/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rt1-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20Transfer&swf=/api/quasar/storage/flash/rt1/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rt1-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rt1/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rt2',
    title: 'Riddle Transfer 2',
    thumbnail: `${CDN}/rt2.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Riddle%20Transfer%202&swf=/api/quasar/storage/flash/rt2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rt2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Riddle%20Transfer%202&swf=/api/quasar/storage/flash/rt2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rt2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rt2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-stm',
    title: 'Spank the Monkey',
    thumbnail: `${CDN}/stm.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Spank%20the%20Monkey&swf=/api/quasar/storage/flash/stm/game.swf&autoplay=1',
    genres: ['Casual', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-stm-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Spank%20the%20Monkey&swf=/api/quasar/storage/flash/stm/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-stm-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/stm/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-bp',
    title: 'Bad Piggies',
    thumbnail: `${CDN}/badpiggies.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Bad%20Piggies&swf=/api/quasar/storage/flash/bp/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-bp-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bad%20Piggies&swf=/api/quasar/storage/flash/bp/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-bp-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/bp/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-sugasuga',
    title: 'Sugar Sugar',
    thumbnail: `${CDN}/sugarsugar.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Sugar%20Sugar&swf=/api/quasar/storage/flash/ss/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-sugasuga-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Sugar%20Sugar&swf=/api/quasar/storage/flash/ss/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-sugasuga-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ss/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ltf',
    title: 'Learn to Fly',
    thumbnail: `${CDN}/ltf.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Learn%20to%20Fly&swf=/api/quasar/storage/flash/ltf/ltf.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ltf-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Learn%20to%20Fly&swf=/api/quasar/storage/flash/ltf/ltf.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ltf-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ltf/ltf.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ltf2',
    title: 'Learn to Fly 2',
    thumbnail: `${CDN}/ltf2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Learn%20to%20Fly%202&swf=/api/quasar/storage/flash/ltf2/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ltf2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Learn%20to%20Fly%202&swf=/api/quasar/storage/flash/ltf2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ltf2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ltf2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-idek',
    title: 'I Don\'t Even Know',
    thumbnail: `${CDN}/idek.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=I%20Don%27t%20Even%20Know&swf=/api/quasar/storage/flash/idek/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-idek-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=I%20Don%27t%20Even%20Know&swf=/api/quasar/storage/flash/idek/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-idek-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/idek/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ol',
    title: 'This is the only level',
    thumbnail: `${CDN}/ol.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=This%20is%20the%20only%20level&swf=/api/quasar/storage/flash/ol/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ol-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=This%20is%20the%20only%20level&swf=/api/quasar/storage/flash/ol/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ol-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ol/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ib2',
    title: 'Interactive Buddy 2',
    thumbnail: `${CDN}/ib2.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Interactive%20Buddy%202&swf=/api/quasar/storage/flash/ib2/game.swf&autoplay=1',
    genres: ['Arcade', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ib2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Interactive%20Buddy%202&swf=/api/quasar/storage/flash/ib2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ib2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ib2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fpa',
    title: 'Fancy Pants Adventure',
    thumbnail: `${CDN}/fpa.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/play.html?title=Fancy%20Pants%20Adventure&swf=/api/quasar/storage/flash/fpa/game.swf&autoplay=1',
    genres: ['Platformer', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fpa-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Fancy%20Pants%20Adventure&swf=/api/quasar/storage/flash/fpa/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fpa-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fpa/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fpw2',
    title: 'Fancy Pants Adventure 2',
    thumbnail: `${CDN}/fpw2.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Fancy%20Pants%20Adventure%202&swf=/api/quasar/storage/flash/fpw2/game.swf&autoplay=1',
    genres: ['Platformer', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fpw2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Fancy%20Pants%20Adventure%202&swf=/api/quasar/storage/flash/fpw2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fpw2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fpw2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-portalflash',
    title: 'Portal (flash)',
    thumbnail: `${CDN}/portalflash.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Portal%20%28flash%29&swf=/api/quasar/storage/flash/portal/game.swf&autoplay=1',
    genres: ['Platformer', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-portalflash-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Portal%20%28flash%29&swf=/api/quasar/storage/flash/portal/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-portalflash-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/portal/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-tiq',
    title: 'The Impossible Quiz',
    thumbnail: `${CDN}/tiq.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=The%20Impossible%20Quiz&swf=/api/quasar/storage/flash/tiq/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-tiq-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=The%20Impossible%20Quiz&swf=/api/quasar/storage/flash/tiq/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-tiq-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/tiq/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-tiq2',
    title: 'The Impossible Quiz 2',
    thumbnail: `${CDN}/tiq2.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/play.html?title=The%20Impossible%20Quiz%202&swf=/api/quasar/storage/flash/tiq2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-tiq2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=The%20Impossible%20Quiz%202&swf=/api/quasar/storage/flash/tiq2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-tiq2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/tiq2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-hw',
    title: 'Happy Wheels',
    thumbnail: `${CDN}/hw.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Happy%20Wheels&swf=/api/quasar/storage/flash/hw/game.swf&autoplay=1',
    genres: ['Action', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-hw-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Happy%20Wheels&swf=/api/quasar/storage/flash/hw/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-hw-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/hw/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-rb4',
    title: 'Red Ball 4',
    thumbnail: `${CDN}/rb4.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Red%20Ball%204&swf=/api/quasar/storage/flash/rb4/game.swf&autoplay=1',
    genres: ['Platformer', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-rb4-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Red%20Ball%204&swf=/api/quasar/storage/flash/rb4/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-rb4-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/rb4/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fb',
    title: 'Factory Balls',
    thumbnail: `${CDN}/fb.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Factory%20Balls&swf=/api/quasar/storage/flash/fb/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fb-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Factory%20Balls&swf=/api/quasar/storage/flash/fb/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fb-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fb/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fb2',
    title: 'Factory Balls 2',
    thumbnail: `${CDN}/fb2.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Factory%20Balls%202&swf=/api/quasar/storage/flash/fb2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fb2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Factory%20Balls%202&swf=/api/quasar/storage/flash/fb2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fb2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fb2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fb3',
    title: 'Factory Balls 3',
    thumbnail: `${CDN}/fb3.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Factory%20Balls%203&swf=/api/quasar/storage/flash/fb3/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fb3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Factory%20Balls%203&swf=/api/quasar/storage/flash/fb3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fb3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fb3/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-fb4',
    title: 'Factory Balls 4',
    thumbnail: `${CDN}/fb4.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Factory%20Balls%204&swf=/api/quasar/storage/flash/fb4/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-fb4-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Factory%20Balls%204&swf=/api/quasar/storage/flash/fb4/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-fb4-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/fb4/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ss2',
    title: 'Sugar Sugar 2',
    thumbnail: `${CDN}/ss2.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/play.html?title=Sugar%20Sugar%202&swf=/api/quasar/storage/flash/ss2/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ss2-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Sugar%20Sugar%202&swf=/api/quasar/storage/flash/ss2/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ss2-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ss2/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-bloxorz',
    title: 'Bloxorz',
    thumbnail: `${CDN}/bloxorz.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloxorz&swf=/api/quasar/storage/flash/bloxorz/game.swf&autoplay=1',
    genres: ['Flash', 'Strategy', 'Arcade'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-bloxorz-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloxorz&swf=/api/quasar/storage/flash/bloxorz/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-bloxorz-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/bloxorz/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-btd5',
    title: 'Bloons Tower Defense 5',
    thumbnail: `${CDN}/btd5.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/play.html?title=Bloons%20Tower%20Defense%205&swf=/api/quasar/storage/flash/btd5/game.swf&autoplay=1',
    genres: ['Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-btd5-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Bloons%20Tower%20Defense%205&swf=/api/quasar/storage/flash/btd5/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-btd5-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/btd5/game.swf', isArchiveIndependent: true }
    ]
  },
  {
    id: 'quasar-ltf3',
    title: 'Learn to Fly 3',
    thumbnail: `${CDN}/ltf3.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/play.html?title=Learn%20to%20Fly%203&swf=/api/quasar/storage/flash/ltf3/game.swf&autoplay=1',
    genres: ['Arcade', 'Strategy', 'Flash'],
    isArchiveIndependent: true,
    mirrors: [
      { id: 'quasar-ltf3-ruffle', name: 'Ruffle WASM (CDN)', type: 'ruffle', url: '/play.html?title=Learn%20to%20Fly%203&swf=/api/quasar/storage/flash/ltf3/game.swf&autoplay=1', isArchiveIndependent: true },
      { id: 'quasar-ltf3-swf', name: 'Direct .swf File', type: 'mirror', url: '/api/quasar/storage/flash/ltf3/game.swf', isArchiveIndependent: true }
    ]
  },
];

export const QUASAR_HTML5_GAMES: QuasarGameEntry[] = [
  {
    id: 'quasar-html-2048',
    title: '2048',
    thumbnail: `${CDN}/2048.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/2048/index.html',
    genres: ['Puzzle', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-adr',
    title: 'A Dark Room',
    thumbnail: `${CDN}/adr.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/adr/index.html',
    genres: ['Adventure', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-br',
    title: 'Backrooms',
    thumbnail: `${CDN}/backrooms.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/br/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-grindcraft',
    title: 'Grindcraft',
    thumbnail: `${CDN}/grindcraft.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/grindcraft/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-adofai',
    title: 'ADOFAI',
    thumbnail: `${CDN}/adofai.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/adofai/index.html',
    genres: ['Rhythm', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-basketrandom',
    title: 'Basket Random',
    thumbnail: `${CDN}/basketrandom.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/basketrandom/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-cc',
    title: 'Cookie Clicker',
    thumbnail: `${CDN}/cc.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/cc/index.html',
    genres: ['Clicker', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-cc3d',
    title: 'Crazy Cattle 3D',
    thumbnail: `${CDN}/cc3d.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/cc3d/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-gdl',
    title: 'Geometry Dash Lite',
    thumbnail: `${CDN}/gdl.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/geodash-lite/index.html',
    genres: ['Rhythm', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-gs',
    title: 'Getaway Shootout',
    thumbnail: `${CDN}/getaways.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/getaway-shootout/index.html',
    genres: ['Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mc',
    title: 'Minecraft',
    thumbnail: `${CDN}/minecraft.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/minecraft/index.html',
    genres: ['Sandbox', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-slope',
    title: 'Slope',
    thumbnail: `${CDN}/slope.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/slope/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-volleyrandom',
    title: 'Volley Random',
    thumbnail: `${CDN}/volleyrandom.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/volleyrandom/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-subwaysurf',
    title: 'Subway Surfers',
    thumbnail: `${CDN}/subwaysurf.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/subwaysurf/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-soccran',
    title: 'Soccer Random',
    thumbnail: `${CDN}/soccran.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/soccerrandom/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-boxingran',
    title: 'Boxing Random',
    thumbnail: `${CDN}/boxingran.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/boxingrandom/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-roofsnip',
    title: 'Rooftop Snipers',
    thumbnail: `${CDN}/roofsnip.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/rooftopsnipers/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-vex3',
    title: 'Vex 3',
    thumbnail: `${CDN}/vex3.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/vex3/index.html',
    genres: ['Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-vex4',
    title: 'Vex 4',
    thumbnail: `${CDN}/vex4.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/vex4/index.html',
    genres: ['Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-vex5',
    title: 'Vex 5',
    thumbnail: `${CDN}/vex5.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/vex5/index.html',
    genres: ['Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-vex6',
    title: 'Vex 6',
    thumbnail: `${CDN}/vex6.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/vex6/index.html',
    genres: ['Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-vex7',
    title: 'Vex 7',
    thumbnail: `${CDN}/vex7.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/vex7/index.html',
    genres: ['Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-2048cup',
    title: '2048 Cupcakes',
    thumbnail: `${CDN}/2048cup.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/2048cup/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-angrybirds',
    title: 'Angry Birds',
    thumbnail: `${CDN}/angrybirds.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/angrybirds/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-angrybirdsshowdown',
    title: 'Angry Birds Showdown',
    thumbnail: `${CDN}/angrybirdsshowdown.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/angrybirdsshowdown/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-angrybirdsspace',
    title: 'Angry Birds Space',
    thumbnail: `${CDN}/angrybirdsspace.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/angrybirdsspace/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-aquapark',
    title: 'Aquapark.io',
    thumbnail: `${CDN}/aquapark.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/aquapark/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bottlejump',
    title: 'Bottle Jump 3D',
    thumbnail: `${CDN}/bottlejump.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bottlejump/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bouncemasters',
    title: 'Bouncemasters',
    thumbnail: `${CDN}/bouncemasters.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bouncemasters/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bowmasters',
    title: 'Bowmasters',
    thumbnail: `${CDN}/bowmasters.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bowmasters/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnaf',
    title: 'Five Nights at Freddy\'s',
    thumbnail: `${CDN}/fnaf.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/1/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnaf2',
    title: 'Five Nights at Freddy\'s 2',
    thumbnail: `${CDN}/fnaf2.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/2/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnaf3',
    title: 'Five Nights at Freddy\'s 3',
    thumbnail: `${CDN}/fnaf3.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/3/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnaf4',
    title: 'Five Nights at Freddy\'s 4',
    thumbnail: `${CDN}/fnaf4.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/4/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnafps',
    title: 'FNAF Pizzeria Simulator',
    thumbnail: `${CDN}/fnafps.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/ps/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnafsl',
    title: 'FNAF Sister Locataion',
    thumbnail: `${CDN}/fnafsl.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/sl/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnafucn',
    title: 'FNAF Ultimate Custom Night',
    thumbnail: `${CDN}/fnafucn.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/ucn/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnafworld',
    title: 'FNAF World',
    thumbnail: `${CDN}/fnafworld.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnaf/world/index.html',
    genres: ['Horror', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-sc',
    title: 'Space Company',
    thumbnail: `${CDN}/sc.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/spacecompany/index.html',
    genres: ['Clicker', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-retrobowl',
    title: 'Retro Bowl',
    thumbnail: `${CDN}/retrobowl.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/retrobowl/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-4ag',
    title: '4th And Goal',
    thumbnail: `${CDN}/4ag.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/4thandgoal/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bsb',
    title: 'Big Shot Boxing',
    thumbnail: `${CDN}/bsb.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bsb/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-boitssotuff',
    title: 'Binding Of Issac; Wrath of the lamb',
    thumbnail: `${CDN}/boi.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/boi/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-btts',
    title: 'Big Tower Tiny Square',
    thumbnail: `${CDN}/btts.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/btts/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-btts2',
    title: 'Big Tower Tiny Square 2',
    thumbnail: `${CDN}/btts2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/btts/2/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-co09',
    title: 'Class of \'09',
    thumbnail: `${CDN}/co09.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/co09/index.html',
    genres: ['Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-csgoc',
    title: 'CSGO Clicker',
    thumbnail: `${CDN}/csgoc.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/csgoc/index.html',
    genres: ['Clicker', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-ting',
    title: 'There Is No Game',
    thumbnail: `${CDN}/ting.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ting/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-blackjack',
    title: 'Blackjack',
    thumbnail: `${CDN}/blackjack.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/blackjack/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-ss',
    title: 'Solar Smash',
    thumbnail: `${CDN}/ss.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ss/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-chess',
    title: 'Chess',
    thumbnail: `${CDN}/chess.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/chess/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-pool',
    title: 'Pool',
    thumbnail: `${CDN}/pool.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/pool/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-poker',
    title: 'Poker',
    thumbnail: `${CDN}/poker.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/poker/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-snake',
    title: 'Snake',
    thumbnail: `${CDN}/gsnake.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/snake/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-drivemad',
    title: 'Drive Mad',
    thumbnail: `${CDN}/drivemad.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/drivemad/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-ftbl',
    title: 'Football Legends',
    thumbnail: `${CDN}/ftbl.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ftbl/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnf',
    title: 'Friday Night Funkin\'',
    thumbnail: `${CDN}/fnftfag.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnf/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnga',
    title: 'Fruit Ninja',
    thumbnail: `${CDN}/fruitninja.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fruitnja/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bbs',
    title: 'Basket Bros',
    thumbnail: `${CDN}/bbs.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/basketbros/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bk',
    title: 'Battle Karts',
    thumbnail: `${CDN}/bk.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bk/index.html',
    genres: ['Sports', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-gdfrvr',
    title: 'Gold Digger FRVR',
    thumbnail: `${CDN}/gdfrvr.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/gdfrvr/index.html',
    genres: ['Clicker', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-foodsball',
    title: 'Google Baseball',
    thumbnail: `${CDN}/gb.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/gb/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-hbd',
    title: 'Harold\'s Bad Day',
    thumbnail: `${CDN}/hbd.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/hbd/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-hnb',
    title: 'Help! No break!',
    thumbnail: `${CDN}/hnb.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/hnb/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-ht',
    title: 'Hardware Tycoon',
    thumbnail: `${CDN}/ht.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ht/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fnfbside',
    title: 'Friday Night Funkin\'; B-Side',
    thumbnail: `${CDN}/bsides.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/fnf/bsides/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3m',
    title: 'Moto X3M',
    thumbnail: `${CDN}/mx3m.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/1/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3m2',
    title: 'Moto X3M 2',
    thumbnail: `${CDN}/mx3m2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/2/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3m3',
    title: 'Moto X3M 3',
    thumbnail: `${CDN}/mx3m3.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/3/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3mpp',
    title: 'Moto X3M Pool Party',
    thumbnail: `${CDN}/mx3mpp.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/pp/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3msl',
    title: 'Moto X3M Spooky Land',
    thumbnail: `${CDN}/mx3msl.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/sl/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mx3mw',
    title: 'Moto X3M Winter',
    thumbnail: `${CDN}/mx3mw.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/motox3m/winter/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-pio2',
    title: 'Paper.io 2',
    thumbnail: `${CDN}/pio2.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/pio2/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-sandb',
    title: 'Sandboxels',
    thumbnail: `${CDN}/sandb.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/sandb/index.html',
    genres: ['Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-cb',
    title: 'Core Ball',
    thumbnail: `${CDN}/cb.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/cb/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-ragarch',
    title: 'Ragdoll Archer',
    thumbnail: `${CDN}/ragarch.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ragarch/index.html',
    genres: ['Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bts',
    title: 'Bad Time Simulator',
    thumbnail: `${CDN}/bts.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bts/index.html',
    genres: ['Strategy', 'Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-wordle',
    title: 'Wordle',
    thumbnail: `${CDN}/wordle.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/wordle/index.html',
    genres: ['Puzzle', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-rbx',
    title: 'Roblox',
    thumbnail: `${CDN}/rbx.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/rbx/index.html',
    genres: ['Sandbox', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-stg',
    title: 'Stumble Guys',
    thumbnail: `${CDN}/stg.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/stg/index.html',
    genres: ['Platformer', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fn',
    title: 'Fortnite',
    thumbnail: `${CDN}/fn.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/fn/index.html',
    genres: ['Shooter', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-crk',
    title: 'Cookie Run Kingdom',
    thumbnail: `${CDN}/crk.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/crk/index.html',
    genres: ['Strategy', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-dhunters',
    title: 'Drift Hunters',
    thumbnail: `${CDN}/dhunters.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/dhunters/index.html',
    genres: ['Sandbox', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-dboss',
    title: 'Drift Boss',
    thumbnail: `${CDN}/dboss.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/dboss/index.html',
    genres: ['Sandbox', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-eroad',
    title: 'Escape Road',
    thumbnail: `${CDN}/eroad.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/eroad/index.html',
    genres: ['Sandbox', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-eroad2',
    title: 'Escape Road 2',
    thumbnail: `${CDN}/eroad2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/eroad2/index.html',
    genres: ['Sandbox', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-raghit',
    title: 'Ragdoll Hit',
    thumbnail: `${CDN}/raghit.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/raghit/index.html',
    genres: ['Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-pvz2',
    title: 'Plants VS Zombies 2',
    thumbnail: `${CDN}/pvz2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/pvz2/index.html',
    genres: ['Arcade', 'Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-cs',
    title: 'CS 1.6',
    thumbnail: `${CDN}/cso.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/cs/index.html',
    genres: ['Action', 'Shooter', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-pt',
    title: 'Polytrack',
    thumbnail: `${CDN}/pt.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/pt/index.html',
    genres: ['Action', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-hl',
    title: 'Half-Life',
    thumbnail: `${CDN}/hl.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/hl/index.html',
    genres: ['Action', 'Shooter', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-rb26',
    title: 'Retro Bowl 26',
    thumbnail: `${CDN}/rb26.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/rb26/index.html',
    genres: ['Strategy', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-btd6',
    title: 'Bloons Tower Defense 6',
    thumbnail: `${CDN}/btd6.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/btd6/index.html',
    genres: ['Strategy', 'Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-dls',
    title: 'Duck Life Space',
    thumbnail: `${CDN}/dls.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/dls/index.html',
    genres: ['Adventure', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-dlb',
    title: 'Duck Life Battle',
    thumbnail: `${CDN}/dlb.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/dlb/index.html',
    genres: ['Adventure', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-jj',
    title: 'Jetpack Joyride',
    thumbnail: `${CDN}/jj.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/jj/index.html',
    genres: ['Action', 'Platformer', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-hj',
    title: 'Helix Jump',
    thumbnail: `${CDN}/hj.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/hj/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-bb',
    title: 'Ball Blast',
    thumbnail: `${CDN}/bb.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/bb/index.html',
    genres: ['Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-gi',
    title: 'Genshin Impact',
    thumbnail: `${CDN}/gi.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/gi/index.html',
    genres: ['Adventure', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-codm',
    title: 'COD Mobile',
    thumbnail: `${CDN}/codm.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/codm/index.html',
    genres: ['Action', 'Shooter', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-smh',
    title: 'Stickman Hook',
    thumbnail: `${CDN}/smh.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/smh/index.html',
    genres: ['Platformer', 'Casual', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-amongus',
    title: 'Among Us',
    thumbnail: `${CDN}/amongus.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/ngg/au/index.html',
    genres: ['Action', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-is',
    title: 'Iron Snout',
    thumbnail: `${CDN}/is.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/is/index.html',
    genres: ['Action', 'Adventure', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mm',
    title: 'Monkey Mart',
    thumbnail: `${CDN}/mm.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/mm/index.html',
    genres: ['Strategy', 'Simulation', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-battlecats',
    title: 'Battle Cats',
    thumbnail: `${CDN}/battlecats.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/battle-cats/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-brawlstars',
    title: 'Brawl Stars',
    thumbnail: `${CDN}/brawlstars.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/brawl-stars/index.html',
    genres: ['Action', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-coc',
    title: 'Clash of Clans',
    thumbnail: `${CDN}/coc.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/coc/index.html',
    genres: ['Action', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-cr',
    title: 'Clash Royale',
    thumbnail: `${CDN}/cr.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/cr/index.html',
    genres: ['Action', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-fcm',
    title: 'FC Mobile',
    thumbnail: `${CDN}/fcm.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/fcm/index.html',
    genres: ['Sports', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-madden',
    title: 'Madden',
    thumbnail: `${CDN}/madden.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/madden/index.html',
    genres: ['Sports', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mojo',
    title: 'MojoLauncher (Minecraft)',
    thumbnail: `${CDN}/mojo.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/mojo/index.html',
    genres: ['Sandbox', 'Arcade', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-pubg',
    title: 'PUBG',
    thumbnail: `${CDN}/pubg.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/astra/pubg/index.html',
    genres: ['Shooter', 'Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-smb',
    title: 'Super Monkey Ball',
    thumbnail: `${CDN}/smb.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/smb/index.html',
    genres: ['Action', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-coffeeshop',
    title: 'Coffee Shop',
    thumbnail: `${CDN}/coffeeshop.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/coffeeshop/index.html',
    genres: ['Simulation', 'Sandbox', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-slowroads',
    title: 'Slow Roads',
    thumbnail: `${CDN}/slowroads.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/slowroads/index.html',
    genres: ['Simulation', 'Sandbox', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-sandtris',
    title: 'Sandtris',
    thumbnail: `${CDN}/sandtris.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/sandtris/index.html',
    genres: ['Puzzle', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-spacewaves',
    title: 'Space Waves',
    thumbnail: `${CDN}/spacewaves.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/spacewaves/index.html',
    genres: ['Arcade', 'Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mfs',
    title: 'Microsoft Flight Simulator',
    thumbnail: `${CDN}/mfs.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/mfs/index.html',
    genres: ['Simulation', 'Casual', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-la2',
    title: 'Little Alchemy 2',
    thumbnail: `${CDN}/la2.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/la2/index.html',
    genres: ['Simulation', 'Casual', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-mcpe',
    title: 'Minecraft: Pocket Edition',
    thumbnail: `${CDN}/mcpe.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/mcpe/index.html',
    genres: ['Adventure', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-dwtd',
    title: 'Dumb Ways to Die',
    thumbnail: `${CDN}/dwtd.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/dwtd/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-html-suika',
    title: 'Suika Game',
    thumbnail: `${CDN}/suika.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/html/suika/index.html',
    genres: ['Strategy', 'HTML5'],
    isArchiveIndependent: true
  },
];

export const QUASAR_WEBGL_GAMES: QuasarGameEntry[] = [
  {
    id: 'quasar-webgl-customersupport',
    title: 'Customer Support',
    thumbnail: `${CDN}/customersupport.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/customersupport/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-f2fha',
    title: 'F2F: Home Alone',
    thumbnail: `${CDN}/f2fha.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/f2fha/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-rerun',
    title: 'RE:RUN',
    thumbnail: `${CDN}/rerun.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/rerun/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gtb',
    title: 'Go To Bed',
    thumbnail: `${CDN}/gotobed.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gtb/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-deadseat',
    title: 'The Deadseat',
    thumbnail: `${CDN}/deadseat.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/deadseat/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-kg',
    title: 'Kindergarten',
    thumbnail: `${CDN}/kg.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/kindergarten/1/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-kg2',
    title: 'Kindergarten 2',
    thumbnail: `${CDN}/kg2.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/kindergarten/2/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-etr',
    title: 'Eat the Rich',
    thumbnail: `${CDN}/eattherich.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/eattherich/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-raft',
    title: 'Raft',
    thumbnail: `${CDN}/raft.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/raft/index.html',
    genres: ['Survival', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-7dip',
    title: '7 Days in Purgatory',
    thumbnail: `${CDN}/7dip.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/7dip/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-people',
    title: 'People Playground',
    thumbnail: `${CDN}/people.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/people-playground/index.html',
    genres: ['Sandbox', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-milkmankarlson',
    title: 'Milkman Karlson',
    thumbnail: `${CDN}/milkmank.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/milkmank/index.html',
    genres: ['Platformer', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-cuphead',
    title: 'Cuphead',
    thumbnail: `${CDN}/cuphead.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/cuphead/index.html',
    genres: ['Platformer', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-swi',
    title: 'Stick With It',
    thumbnail: `${CDN}/stickwithit.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/stickwithit/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bwh',
    title: 'Bowerwhelm',
    thumbnail: `${CDN}/bowerwhelm.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bowerwhelm/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bbcr',
    title: 'Baldi\'s Basics Classic Remastered',
    thumbnail: `${CDN}/bbcr.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bbcr/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bbp',
    title: 'Baldi\'s Basics Plus',
    thumbnail: `${CDN}/bbp.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bbp/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-1v1lol',
    title: '1v1.lol',
    thumbnail: `${CDN}/1v1lol.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/1v1lol/index.html',
    genres: ['Shooter', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-kg3',
    title: 'Kindergarten 3',
    thumbnail: `${CDN}/kg3.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/kindergarten/3/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-adcap',
    title: 'Adventure Capitalist',
    thumbnail: `${CDN}/adcap.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/adcap/index.html',
    genres: ['Clicker', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-assessexam',
    title: 'Assessment Examination',
    thumbnail: `${CDN}/assessexam.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/assessexam/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-goi',
    title: 'Getting over It',
    thumbnail: `${CDN}/goi.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/goi/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bitlife',
    title: 'Bitlife',
    thumbnail: `${CDN}/bitlife.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bitlife/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-granny',
    title: 'Granny',
    thumbnail: `${CDN}/granny.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/granny/1/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-granny2',
    title: 'Granny 2',
    thumbnail: `${CDN}/granny2.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/granny/2/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-granny3',
    title: 'Granny 3',
    thumbnail: `${CDN}/granny3.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/granny/3/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-awdy',
    title: 'Are We There Yet',
    thumbnail: `${CDN}/awdy.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/awdy/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bgt',
    title: 'BERGENTRUCK 201x',
    thumbnail: `${CDN}/bg201.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bg201/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bb',
    title: 'Block Blast',
    thumbnail: `${CDN}/bblast.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bb/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ds',
    title: 'Deepest Sword',
    thumbnail: `${CDN}/ds.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ds/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-hk',
    title: 'Hollow Knight',
    thumbnail: `${CDN}/hk.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/hk/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gag',
    title: 'Grow a Garden',
    thumbnail: `${CDN}/gag.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gag/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-sr3d',
    title: 'Snow Rider 3D',
    thumbnail: `${CDN}/sr3d.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/sr3d/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-avh',
    title: 'Apes VS Helium',
    thumbnail: `${CDN}/avh.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/avh/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-hoho',
    title: 'House Of Hazards',
    thumbnail: `${CDN}/hoho.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/hoho/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-hpsb',
    title: 'Hypper Sandbox',
    thumbnail: `${CDN}/hpsp.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/hbsp/index.html',
    genres: ['Sandbox', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-IWBTG',
    title: 'I wanna be the guy',
    thumbnail: `${CDN}/iwbtg.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/iwbtg/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-dblx',
    title: 'Doblox [Roblox Clone]',
    thumbnail: `${CDN}/dblx.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/dblx/index.html',
    genres: ['Sandbox', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-smashmykart',
    title: 'Smash Karts',
    thumbnail: `${CDN}/smk.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/smashmykart/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-fmh',
    title: 'Funny Mad Racing',
    thumbnail: `${CDN}/fmh.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/fmh/index.html',
    genres: ['Sports', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gbs',
    title: 'Going Balls',
    thumbnail: `${CDN}/gbs.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gbs/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gas-ny',
    title: 'Grand Action Simulator NY',
    thumbnail: `${CDN}/gas-ny.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gas-ny/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-heist',
    title: 'HEI$T',
    thumbnail: `${CDN}/heist.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/heist/index.html',
    genres: ['Clicker', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-k2d',
    title: 'Karlson 2D',
    thumbnail: `${CDN}/k2d.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/k2d/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-hlm',
    title: 'Hotline Miami',
    thumbnail: `${CDN}/hlm.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/hlm/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bsrl',
    title: 'Buckshot Roulette',
    thumbnail: `${CDN}/bsrl.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bsrl/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-pint',
    title: 'Pretend It\'s not There',
    thumbnail: `${CDN}/pint.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/pint/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-karlson',
    title: 'Karlson',
    thumbnail: `${CDN}/karlson.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/karlson/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-hot',
    title: 'Superhot',
    thumbnail: `${CDN}/hot.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/superhot/index.html',
    genres: ['Shooter', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-crush',
    title: 'Cluster Rush',
    thumbnail: `${CDN}/crush.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/crush/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-sonicexe',
    title: 'Sonic EXE',
    thumbnail: `${CDN}/sonicexe.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/sonicexe/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-os',
    title: 'Oneshot',
    thumbnail: `${CDN}/os.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/os/index.html',
    genres: ['Puzzle', 'Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-celeste',
    title: 'Celeste',
    thumbnail: `${CDN}/celeste.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/celeste/index.html',
    genres: ['Platformer', 'Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-cso',
    title: 'CS Online',
    thumbnail: `${CDN}/cs.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/cs_online/index.html',
    genres: ['Shooter', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gs',
    title: 'Gunspin',
    thumbnail: `${CDN}/gs.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gs/index.html',
    genres: ['Clicker', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-bmd',
    title: 'Bacon May Die',
    thumbnail: `${CDN}/bmd.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bmd/index.html',
    genres: ['Sandbox', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-uk',
    title: 'ULTRAKILL',
    thumbnail: `${CDN}/uk.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/uk/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-fg',
    title: 'Flying Gorilla',
    thumbnail: `${CDN}/fg.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/fg/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-pg3d',
    title: 'Pixel Gun 3D (old)',
    thumbnail: `${CDN}/pg3d.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/pg3d/index.html',
    genres: ['Action', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-st',
    title: 'Slendytubbies remake',
    thumbnail: `${CDN}/st.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/st/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ttc',
    title: 'To The Core',
    thumbnail: `${CDN}/ttc.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ttc/index.html',
    genres: ['Clicker', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-gtag',
    title: 'Gorilla Tag',
    thumbnail: `${CDN}/gtag.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/gtag/index.html',
    genres: ['Platformer', 'Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-pdta',
    title: 'Please, Don\'t Touch Anything',
    thumbnail: `${CDN}/pdta.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/pdta/index.html',
    genres: ['Puzzle', 'Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-wbwwb',
    title: 'We Become What We Behold',
    thumbnail: `${CDN}/wbwwb.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/wbwwb/index.html',
    genres: ['Puzzle', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-repo',
    title: 'R.E.P.O.',
    thumbnail: `${CDN}/repo.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/repo/index.html',
    genres: ['Puzzle', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-rep',
    title: 'Replicate',
    thumbnail: `${CDN}/rep.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/rep/index.html',
    genres: ['Puzzle', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-stc',
    title: 'Sort the Court',
    thumbnail: `${CDN}/stc.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/stc/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-balatro',
    title: 'Balatro',
    thumbnail: `${CDN}/balatro.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/balatro/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-sbrunaway',
    title: 'Schoolboy Runaway',
    thumbnail: `${CDN}/sbrunaway.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/sbrunaway/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-adgac',
    title: 'A Difficult Game About Climbing',
    thumbnail: `${CDN}/adgac.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/adgac/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-fvl',
    title: 'FeedVid Live',
    thumbnail: `${CDN}/fvl.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/fvl/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ironlung',
    title: 'Iron Lung',
    thumbnail: `${CDN}/ironlung.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ironlung/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-nso',
    title: 'Needy Streamer Overload',
    thumbnail: `${CDN}/nso.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/nso/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-fnae',
    title: 'Five night\'s at Εpѕteinѕ',
    thumbnail: `${CDN}/fnae.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/fnae/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-jm',
    title: 'Jumbo Mario',
    thumbnail: `${CDN}/jm.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/jm/index.html',
    genres: ['Platformer', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-shiftatmidnight',
    title: 'Shift at Midnight',
    thumbnail: `${CDN}/shiftatmidnight.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/sam/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-aether',
    title: 'The Aether',
    thumbnail: `${CDN}/aether.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/aether/index.html',
    genres: ['Sandbox', 'Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-batim',
    title: 'Bendy and the Ink Machine',
    thumbnail: `${CDN}/batim.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/bendy/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ata',
    title: 'Amanda The Adventurer',
    thumbnail: `${CDN}/ata.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ata/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-cloverpit',
    title: 'CloverPit',
    thumbnail: `${CDN}/cloverpit.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/cloverpit/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ktb',
    title: 'Kick The Buddy',
    thumbnail: `${CDN}/ktb.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ktb/index.html',
    genres: ['Casual', 'Clicker', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-cm',
    title: 'Cell Machine',
    thumbnail: `${CDN}/cm.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/cm/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-christmasmassacre',
    title: 'Christmas Massacre',
    thumbnail: `${CDN}/christmasmassacre.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/christmasmassacre/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-brotato',
    title: 'Brotato',
    thumbnail: `${CDN}/brotato.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/brotato/index.html',
    genres: ['Shooter', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-giag',
    title: 'Game Inside a Game Inside a Game',
    thumbnail: `${CDN}/giag.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/giag/index.html',
    genres: ['Strategy', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ms',
    title: 'Midnight Shift',
    thumbnail: `${CDN}/ms.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ms/index.html',
    genres: ['Horror', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-sio',
    title: 'Survivor IO',
    thumbnail: `${CDN}/sio.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/sio/index.html',
    genres: ['Shooter', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-ugg',
    title: 'Untitled Goose Game',
    thumbnail: `${CDN}/ugg.webp`,
    rating: 4.5,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/ugg/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-undertale',
    title: 'Undertale',
    thumbnail: `${CDN}/undertale.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/undertale/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-uty',
    title: 'Undertale Yellow',
    thumbnail: `${CDN}/uty.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/undertaleyellow/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-deltarune',
    title: 'Deltarune',
    thumbnail: `${CDN}/deltarune.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/deltarune/index.html',
    genres: ['Adventure', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-silk',
    title: 'Hollow Knight: Silksong',
    thumbnail: `${CDN}/silk.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/silk/index.html',
    genres: ['Action', 'Platformer', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-crossyroad',
    title: 'Crossy Road',
    thumbnail: `${CDN}/crossyroad.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/crossyroad/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-yomih',
    title: 'Your Only Move is HUSTLE',
    thumbnail: `${CDN}/yomih.webp`,
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/yomih/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-tmtd',
    title: '10 Minutes Till Dawn',
    thumbnail: `${CDN}/tmtd.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/tmtd/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-svalley',
    title: 'Stardew Valley',
    thumbnail: `${CDN}/svalley.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/svalley/index.html',
    genres: ['Simulation', 'Webport', '3D'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-webgl-wyd',
    title: 'Who\'s Your Daddy?',
    thumbnail: `${CDN}/wyd.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/webgl/wyd/index.html',
    genres: ['Arcade', 'Webport', '3D'],
    isArchiveIndependent: true
  },
];

export const QUASAR_EMULATOR_GAMES: QuasarGameEntry[] = [
  {
    id: 'quasar-emu-customgba',
    title: 'GBA Emulator',
    thumbnail: `${CDN}/gba.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/gba/custom/index.html',
    genres: ['Arcade', 'Emulator', 'GBA'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-customds',
    title: 'DS Emulator',
    thumbnail: `${CDN}/customds.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/ds/custom/index.html',
    genres: ['Arcade', 'Emulator', 'DS'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-customn64',
    title: 'N64 Emulator',
    thumbnail: `${CDN}/n64.webp`,
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/n64/custom/index.html',
    genres: ['Arcade', 'Emulator', 'N64'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-customnes',
    title: 'NES Emulator',
    thumbnail: `${CDN}/customnes.webp`,
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/nes/custom/index.html',
    genres: ['Arcade', 'Emulator', 'NES'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-custompsp',
    title: 'PSP Emulator',
    thumbnail: `${CDN}/custompsp.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/psp/custom/index.html',
    genres: ['Arcade', 'Emulator', 'PSP'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-custompsx',
    title: 'PSX Emulator',
    thumbnail: `${CDN}/custompsx.webp`,
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/psx/custom/index.html',
    genres: ['Arcade', 'Emulator', 'PSX'],
    isArchiveIndependent: true
  },
  {
    id: 'quasar-emu-customsnes',
    title: 'SNES Emulator',
    thumbnail: `${CDN}/customsnes.webp`,
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/quasar/storage/emulator/snes/custom/index.html',
    genres: ['Arcade', 'Emulator', 'SNES'],
    isArchiveIndependent: true
  },
];

export const QUASAR_GAMES: QuasarGameEntry[] = [
  ...QUASAR_FLASH_GAMES,
  ...QUASAR_HTML5_GAMES,
  ...QUASAR_WEBGL_GAMES,
  ...QUASAR_EMULATOR_GAMES
];
