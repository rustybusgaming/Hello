export interface FlashGameEntry {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'archive' | 'webporting' | 'steam';
  embedUrl: string;
  genres: string[];
}

export const CURATED_FLASH_COLLECTIONS: FlashGameEntry[] = [
  // 1. Classic Internet Archive Flash Games with Instant Ruffle / Emulator Support
  {
    id: 'alienhominid',
    title: 'Alien Hominid',
    thumbnail: '/api/archive-img/alienhominid',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/alienhominid',
    genres: ['Action', 'Shooter', 'Flash']
  },
  {
    id: 'super-smash-flash-2',
    title: 'Super Smash Flash 2',
    thumbnail: '/api/archive-img/super-smash-flash-2',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/super-smash-flash-2',
    genres: ['Fighting', 'Action', 'Flash']
  },
  {
    id: 'electric-man-2-hs',
    title: 'Electric Man 2',
    thumbnail: '/api/archive-img/electric-man-2-hs',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/electric-man-2-hs',
    genres: ['Action', 'Fighting', 'Flash']
  },
  {
    id: 'interactive-buddy',
    title: 'Interactive Buddy',
    thumbnail: '/api/archive-img/interactive-buddy',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/interactive-buddy',
    genres: ['Simulation', 'Sandbox', 'Flash']
  },
  {
    id: 'the-impossible-quiz',
    title: 'The Impossible Quiz',
    thumbnail: '/api/archive-img/the-impossible-quiz',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/the-impossible-quiz',
    genres: ['Puzzle', 'Trivia', 'Flash']
  },
  {
    id: 'the-impossible-quiz-2',
    title: 'The Impossible Quiz 2',
    thumbnail: '/api/archive-img/the-impossible-quiz-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/the-impossible-quiz-2',
    genres: ['Puzzle', 'Trivia', 'Flash']
  },
  {
    id: 'learn-to-fly',
    title: 'Learn to Fly',
    thumbnail: '/api/archive-img/learn-to-fly',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/learn-to-fly',
    genres: ['Strategy', 'Arcade', 'Flash']
  },
  {
    id: 'learn-to-fly-2',
    title: 'Learn to Fly 2',
    thumbnail: '/api/archive-img/learn-to-fly-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/learn-to-fly-2',
    genres: ['Strategy', 'Arcade', 'Flash']
  },
  {
    id: 'age-of-war',
    title: 'Age of War',
    thumbnail: '/api/archive-img/age-of-war',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/age-of-war',
    genres: ['Strategy', 'Defense', 'Flash']
  },
  {
    id: 'age-of-war-2',
    title: 'Age of War 2',
    thumbnail: '/api/archive-img/age-of-war-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/age-of-war-2',
    genres: ['Strategy', 'Defense', 'Flash']
  },
  {
    id: 'bloons-tower-defense-4',
    title: 'Bloons Tower Defense 4',
    thumbnail: '/api/archive-img/bloons-tower-defense-4',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bloons-tower-defense-4',
    genres: ['Strategy', 'Tower Defense', 'Flash']
  },
  {
    id: 'fancy-pants-adventures',
    title: 'The Fancy Pants Adventures',
    thumbnail: '/api/archive-img/fancy-pants-adventures',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fancy-pants-adventures',
    genres: ['Platformer', 'Adventure', 'Flash']
  },
  {
    id: 'fancy-pants-adventures-world-2',
    title: 'Fancy Pants Adventures: World 2',
    thumbnail: '/api/archive-img/fancy-pants-adventures-world-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fancy-pants-adventures-world-2',
    genres: ['Platformer', 'Adventure', 'Flash']
  },
  {
    id: 'swords-and-sandals-2',
    title: 'Swords and Sandals 2',
    thumbnail: '/api/archive-img/swords-and-sandals-2',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/swords-and-sandals-2',
    genres: ['RPG', 'Fighting', 'Flash']
  },
  {
    id: 'duck-life-4',
    title: 'Duck Life 4',
    thumbnail: '/api/archive-img/duck-life-4',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/duck-life-4',
    genres: ['Adventure', 'Simulation', 'Flash']
  },
  {
    id: 'duck-life-3',
    title: 'Duck Life 3: Evolution',
    thumbnail: '/api/archive-img/duck-life-3',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/duck-life-3',
    genres: ['Adventure', 'Simulation', 'Flash']
  },
  {
    id: 'paparie-flash',
    title: "Papa's Pizzeria",
    thumbnail: '/api/archive-img/papas-pizzeria_flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-pizzeria_flash',
    genres: ['Cooking', 'Simulation', 'Flash']
  },
  {
    id: 'papas-freezeria-flash',
    title: "Papa's Freezeria",
    thumbnail: '/api/archive-img/papas-freezeria-flash',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-freezeria-flash',
    genres: ['Cooking', 'Simulation', 'Flash']
  },
  {
    id: 'papas-burgeria-flash',
    title: "Papa's Burgeria",
    thumbnail: '/api/archive-img/papas-burgeria-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/papas-burgeria-flash',
    genres: ['Cooking', 'Simulation', 'Flash']
  },
  {
    id: 'strike-force-heroes',
    title: 'Strike Force Heroes',
    thumbnail: '/api/archive-img/strike-force-heroes',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/strike-force-heroes',
    genres: ['Shooter', 'Action', 'Flash']
  },
  {
    id: 'strike-force-heroes-2',
    title: 'Strike Force Heroes 2',
    thumbnail: '/api/archive-img/strike-force-heroes-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/strike-force-heroes-2',
    genres: ['Shooter', 'Action', 'Flash']
  },
  {
    id: 'raze-flash-game',
    title: 'Raze',
    thumbnail: '/api/archive-img/raze-flash-game',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/raze-flash-game',
    genres: ['Shooter', 'Action', 'Flash']
  },
  {
    id: 'raze-2',
    title: 'Raze 2',
    thumbnail: '/api/archive-img/raze-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/raze-2',
    genres: ['Shooter', 'Action', 'Flash']
  },
  {
    id: 'super-mario-63',
    title: 'Super Mario 63',
    thumbnail: '/api/archive-img/super-mario-63',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/super-mario-63',
    genres: ['Platformer', 'Adventure', 'Flash']
  },
  {
    id: 'fireboy-and-watergirl-forest-temple',
    title: 'Fireboy and Watergirl: The Forest Temple',
    thumbnail: '/api/archive-img/fireboy-and-watergirl-forest-temple',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/fireboy-and-watergirl-forest-temple',
    genres: ['Puzzle', 'Co-op', 'Flash']
  },
  {
    id: 'run-3',
    title: 'Run 3',
    thumbnail: '/api/archive-img/run-3-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/run-3-flash',
    genres: ['Arcade', 'Runner', 'Flash']
  },
  {
    id: 'qwop-flash',
    title: 'QWOP',
    thumbnail: '/api/archive-img/qwop-game',
    rating: 4.6,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/qwop-game',
    genres: ['Funny', 'Sports', 'Flash']
  },
  {
    id: 'happy-wheels-flash',
    title: 'Happy Wheels (Flash Classic)',
    thumbnail: '/api/archive-img/happy-wheels-original',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/happy-wheels-original',
    genres: ['Physics', 'Funny', 'Flash']
  },
  {
    id: 'stick-war',
    title: 'Stick War',
    thumbnail: '/api/archive-img/stick-war',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stick-war',
    genres: ['Strategy', 'War', 'Flash']
  },
  {
    id: 'stick-war-2',
    title: 'Stick War 2: Order Empire',
    thumbnail: '/api/archive-img/stick-war-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stick-war-2',
    genres: ['Strategy', 'War', 'Flash']
  },
  {
    id: 'sugar-sugar',
    title: 'Sugar Sugar',
    thumbnail: '/api/archive-img/sugar-sugar',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/sugar-sugar',
    genres: ['Puzzle', 'Physics', 'Flash']
  },
  {
    id: 'red-ball-4',
    title: 'Red Ball 4',
    thumbnail: '/api/archive-img/red-ball-4',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/red-ball-4',
    genres: ['Platformer', 'Physics', 'Flash']
  },
  {
    id: 'bad-ice-cream',
    title: 'Bad Ice Cream',
    thumbnail: '/api/archive-img/bad-ice-cream',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bad-ice-cream',
    genres: ['Arcade', 'Puzzle', 'Flash']
  },
  {
    id: 'bad-ice-cream-2',
    title: 'Bad Ice Cream 2',
    thumbnail: '/api/archive-img/bad-ice-cream-2',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/bad-ice-cream-2',
    genres: ['Arcade', 'Puzzle', 'Flash']
  },
  {
    id: 'jacksmith',
    title: 'Jacksmith',
    thumbnail: '/api/archive-img/jacksmith-flash',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/jacksmith-flash',
    genres: ['Crafting', 'RPG', 'Flash']
  },
  {
    id: 'plazma-burst-2',
    title: 'Plazma Burst 2',
    thumbnail: '/api/archive-img/plazma-burst-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/plazma-burst-2',
    genres: ['Shooter', 'Action', 'Flash']
  },
  {
    id: 'sonny-2',
    title: 'Sonny 2',
    thumbnail: '/api/archive-img/sonny-2',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/sonny-2',
    genres: ['RPG', 'Turn-Based', 'Flash']
  },
  {
    id: 'infiltrating-the-airship',
    title: 'Henry Stickmin: Infiltrating the Airship',
    thumbnail: '/api/archive-img/infiltrating-the-airship',
    rating: 5.0,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/infiltrating-the-airship',
    genres: ['Adventure', 'Comedy', 'Flash']
  },
  {
    id: 'stealing-the-diamond',
    title: 'Henry Stickmin: Stealing the Diamond',
    thumbnail: '/api/archive-img/stealing-the-diamond',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/stealing-the-diamond',
    genres: ['Adventure', 'Comedy', 'Flash']
  },
  {
    id: 'escaping-the-prison',
    title: 'Henry Stickmin: Escaping the Prison',
    thumbnail: '/api/archive-img/escaping-the-prison',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/escaping-the-prison',
    genres: ['Adventure', 'Comedy', 'Flash']
  },
  {
    id: 'breaking-the-bank',
    title: 'Henry Stickmin: Breaking the Bank',
    thumbnail: '/api/archive-img/breaking-the-bank',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/breaking-the-bank',
    genres: ['Adventure', 'Comedy', 'Flash']
  },
  {
    id: 'crush-the-castle',
    title: 'Crush the Castle',
    thumbnail: '/api/archive-img/crush-the-castle',
    rating: 4.8,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/crush-the-castle',
    genres: ['Physics', 'Destruction', 'Flash']
  },
  {
    id: 'effing-worms',
    title: 'Effing Worms',
    thumbnail: '/api/archive-img/effing-worms',
    rating: 4.7,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/effing-worms',
    genres: ['Arcade', 'Action', 'Flash']
  },
  {
    id: 'super-fighters',
    title: 'Superfighters',
    thumbnail: '/api/archive-img/superfighters',
    rating: 4.9,
    source: 'archive',
    embedUrl: 'https://archive.org/embed/superfighters',
    genres: ['Action', 'Fighting', 'Flash']
  }
];
