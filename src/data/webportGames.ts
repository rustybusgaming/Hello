import { GameMirror } from '../types';

export interface WebportGameEntry {
  id: string;
  repoKey: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'webporting';
  embedUrl: string;
  genres: string[];
  isArchiveIndependent?: boolean;
  mirrors?: GameMirror[];
}

export const GENIZY_WEBPORT_GAMES: WebportGameEntry[] = [
  {
    id: 'webport-milkman-karlson',
    repoKey: 'milkman-karlson',
    title: 'Milkman Karlson',
    thumbnail: '/api/cover/milkman-karlson?title=Milkman%20Karlson',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/milkman-karlson',
    genres: ['Ragdoll', 'Action', 'Comedy']
  },
  {
    id: 'webport-buckshot-roulette',
    repoKey: 'buckshot-roulette',
    title: 'Buckshot Roulette',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2835570/header.jpg',
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/webports/play/buckshot-roulette',
    genres: ['Horror', 'Strategy', 'Tabletop']
  },
  {
    id: 'webport-karlson',
    repoKey: 'karlson',
    title: 'Karlson (3D FPS)',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1228610/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/karlson',
    genres: ['Action', 'FPS', 'Parkour']
  },
  {
    id: 'webport-pizza-tower',
    repoKey: 'pizza-tower',
    title: 'Pizza Tower',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2231450/header.jpg',
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/webports/play/pizza-tower',
    genres: ['Platformer', 'Fast-Paced', 'Comedy']
  },
  {
    id: 'webport-ultrakill',
    repoKey: 'ultrakill',
    title: 'ULTRAKILL (Prelude)',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1229490/header.jpg',
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/webports/play/ultrakill',
    genres: ['Shooter', 'Action', 'Fast-Paced']
  },
  {
    id: 'webport-cuphead',
    repoKey: 'cuphead',
    title: 'Cuphead (Boss Rush)',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/268910/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/cuphead',
    genres: ['Action', 'Platformer', 'Difficult']
  },
  {
    id: 'webport-getting-over-it',
    repoKey: 'getting-over-it',
    title: 'Getting Over It with Bennett Foddy',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/240720/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/getting-over-it',
    genres: ['Physics', 'Difficult', 'Precision']
  },
  {
    id: 'webport-baldi-plus',
    repoKey: 'baldi-plus',
    title: "Baldi's Basics Plus",
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1275890/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/baldi-plus',
    genres: ['Horror', 'Comedy', 'Survival']
  },
  {
    id: 'webport-baldi-remaster',
    repoKey: 'baldi-remaster',
    title: "Baldi's Basics Classic Remastered",
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1712710/header.jpg',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/baldi-remaster',
    genres: ['Horror', 'Comedy', 'Retro']
  },
  {
    id: 'webport-bendy',
    repoKey: 'bendy',
    title: 'Bendy and the Ink Machine',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/622650/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/bendy',
    genres: ['Horror', 'Puzzle', 'Story']
  },
  {
    id: 'webport-thats-not-my-neighbor',
    repoKey: 'thats-not-my-neighbor',
    title: "That's Not My Neighbor",
    thumbnail: '/api/cover/thats-not-my-neighbor?title=That%27s%20Not%20My%20Neighbor',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/thats-not-my-neighbor',
    genres: ['Horror', 'Simulation', 'Mystery']
  },
  {
    id: 'webport-undertale-yellow',
    repoKey: 'undertale-yellow',
    title: 'Undertale Yellow',
    thumbnail: '/api/cover/undertale-yellow?title=Undertale%20Yellow',
    rating: 5.0,
    source: 'webporting',
    embedUrl: '/api/webports/play/undertale-yellow',
    genres: ['RPG', 'Adventure', 'Bullet Hell']
  },
  {
    id: 'webport-people-playground',
    repoKey: 'people-playground',
    title: 'People Playground',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1118200/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/people-playground',
    genres: ['Sandbox', 'Physics', 'Simulation']
  },
  {
    id: 'webport-amanda-the-adventurer',
    repoKey: 'amanda-the-adventurer',
    title: 'Amanda the Adventurer',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2166060/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/amanda-the-adventurer',
    genres: ['Horror', 'Puzzle', 'Interactive']
  },
  {
    id: 'webport-dead-plate',
    repoKey: 'dead-plate',
    title: 'Dead Plate',
    thumbnail: '/api/cover/dead-plate?title=Dead%20Plate',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/dead-plate',
    genres: ['RPG', 'Horror', 'Cooking']
  },
  {
    id: 'webport-hotline-miami',
    repoKey: 'hotline-miami',
    title: 'Hotline Miami',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/219150/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/hotline-miami',
    genres: ['Action', 'Top-Down', 'Retro']
  },
  {
    id: 'webport-jelly-drift',
    repoKey: 'jelly-drift',
    title: 'Jelly Drift',
    thumbnail: '/api/cover/jelly-drift?title=Jelly%20Drift',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/jelly-drift',
    genres: ['Racing', 'Drift', 'Physics']
  },
  {
    id: 'webport-web-fishing',
    repoKey: 'web-fishing',
    title: 'Webfishing',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3146520/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/web-fishing',
    genres: ['Casual', 'Multiplayer', 'Fishing']
  },
  {
    id: 'webport-omori-fixed',
    repoKey: 'omori-fixed',
    title: 'OMORI (Web Edition)',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1150690/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/omori-fixed',
    genres: ['RPG', 'Psychological', 'Story']
  },
  {
    id: 'webport-slender',
    repoKey: 'slender',
    title: 'Slender: The Eight Pages',
    thumbnail: '/api/cover/slender?title=Slender%3A%20The%20Eight%20Pages',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/slender',
    genres: ['Horror', 'Survival', 'Classic']
  },
  {
    id: 'webport-class-of-09',
    repoKey: 'class-of-09',
    title: "Class of '09",
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1443200/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/class-of-09',
    genres: ['Visual Novel', 'Comedy', 'Drama']
  },
  {
    id: 'webport-kindergarten',
    repoKey: 'kindergarten',
    title: 'Kindergarten',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/578590/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/kindergarten',
    genres: ['Adventure', 'Dark Comedy', 'Puzzle']
  },
  {
    id: 'webport-schoolboy-runaway',
    repoKey: 'schoolboy-runaway',
    title: 'SchoolBoy Runaway: Stealth',
    thumbnail: '/api/cover/schoolboy-runaway?title=SchoolBoy%20Runaway%3A%20Stealth',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/schoolboy-runaway',
    genres: ['Stealth', 'Escape', 'Horror']
  },
  {
    id: 'webport-the-man-in-the-window',
    repoKey: 'the-man-in-the-window',
    title: 'The Man in the Window',
    thumbnail: '/api/cover/the-man-in-the-window?title=The%20Man%20in%20the%20Window',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/the-man-in-the-window',
    genres: ['Horror', 'Puzzle', 'Short']
  },
  {
    id: 'webport-tattletail',
    repoKey: 'tattletail',
    title: 'Tattletail',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/541450/header.jpg',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/tattletail',
    genres: ['Horror', 'Survival', 'Survival']
  },
  {
    id: 'webport-raft',
    repoKey: 'raft',
    title: 'Raft',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/648800/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/raft',
    genres: ['Survival', 'Crafting', 'Open World']
  },
  {
    id: 'webport-yume-nikki',
    repoKey: 'yume-nikki',
    title: 'Yume Nikki',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/650700/header.jpg',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/yume-nikki',
    genres: ['Surreal', 'Exploration', 'Adventure']
  },
  {
    id: 'webport-yandere-simulator',
    repoKey: 'yandere-simulator',
    title: 'Yandere Simulator (Web)',
    thumbnail: '/api/cover/yandere-simulator?title=Yandere%20Simulator%20%28Web%29',
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/webports/play/yandere-simulator',
    genres: ['Stealth', 'Anime', 'Sandbox']
  },
  {
    id: 'webport-sonic-exe',
    repoKey: 'sonic.exe',
    title: 'Sonic.EXE',
    thumbnail: '/api/cover/sonic.exe?title=Sonic.EXE',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/sonic.exe',
    genres: ['Horror', 'Platformer', 'Creepypasta']
  },
  {
    id: 'webport-speed-stars',
    repoKey: 'speed-stars',
    title: 'Speed Stars',
    thumbnail: '/api/cover/speed-stars?title=Speed%20Stars',
    rating: 4.7,
    source: 'webporting',
    embedUrl: '/api/webports/play/speed-stars',
    genres: ['Sports', 'Arcade', 'Runner']
  },
  {
    id: 'webport-andys-apple-farm',
    repoKey: 'andys-apple-farm',
    title: "Andy's Apple Farm",
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1810820/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/andys-apple-farm',
    genres: ['Horror', 'Retro', 'Minigames']
  },
  {
    id: 'webport-fears-to-fathom',
    repoKey: 'fears-to-fathom',
    title: 'Fears to Fathom: Norwood Hitchhike',
    thumbnail: '/api/cover/fears-to-fathom?title=Fears%20to%20Fathom%3A%20Norwood%20Hitchhike',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/fears-to-fathom',
    genres: ['Psychological', 'Horror', 'Story']
  },
  {
    id: 'webport-deltatraveler',
    repoKey: 'deltatraveler',
    title: 'DELTATRAVELER',
    thumbnail: '/api/cover/deltatraveler?title=DELTATRAVELER',
    rating: 4.9,
    source: 'webporting',
    embedUrl: '/api/webports/play/deltatraveler',
    genres: ['RPG', 'Undertale', 'Adventure']
  },
  {
    id: 'webport-bloodmoney',
    repoKey: 'bloodmoney',
    title: 'Bloodmoney',
    thumbnail: '/api/cover/bloodmoney?title=Bloodmoney',
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/webports/play/bloodmoney',
    genres: ['Action', 'Shooter', 'Arcade']
  },
  {
    id: 'webport-witch-heart',
    repoKey: 'witch-heart',
    title: "Witch's Heart",
    thumbnail: '/api/cover/witch-heart?title=Witch%27s%20Heart',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/witch-heart',
    genres: ['RPG Maker', 'Mystery', 'Story']
  },
  {
    id: 'webport-deadseat',
    repoKey: 'deadseat',
    title: 'The Deadseat',
    thumbnail: '/api/cover/deadseat?title=The%20Deadseat',
    rating: 4.6,
    source: 'webporting',
    embedUrl: '/api/webports/play/deadseat',
    genres: ['Simulation', 'Horror', 'Short']
  },
  {
    id: 'webport-happy-sheepies',
    repoKey: 'happy-sheepies',
    title: 'Happy Sheepies',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2764950/header.jpg',
    rating: 4.8,
    source: 'webporting',
    embedUrl: '/api/webports/play/happy-sheepies',
    genres: ['Casual', 'Farming', 'Simulation']
  }
];
