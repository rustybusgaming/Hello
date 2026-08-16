export interface ResolvedGameInfo {
  title: string;
  genres: string[];
  description?: string;
  thumbnail?: string;
  rating?: number;
}

export const KNOWN_GAME_ALIASES: Record<string, ResolvedGameInfo> = {
  // Papa's Series
  'ppan': {
    title: "Papa's Pancakeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Flapjack flipping, waffle pressing, and serving hungry morning customers up in Maple Mountain.",
    rating: 4.9
  },
  'ppasta': {
    title: "Papa's Pastaria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Cook pasta noodles to al dente perfection, add sauces, toppings, and fresh garlic bread in Portallini.",
    rating: 4.9
  },
  'ppizza': {
    title: "Papa's Pizzeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "The original Flipline restaurant classic! Top, bake, and slice custom pizzas for eccentric customers.",
    rating: 5.0
  },
  'pscoop': {
    title: "Papa's Scooperia",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Bake warm cookies fresh from the oven and scoop ice cream sundaes in the bustling city of Oniontown.",
    rating: 4.9
  },
  'psushi': {
    title: "Papa's Sushiria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Roll delicious sushi rolls, slice them evenly, and brew flavorful bubble tea drinks in Sakura Bay.",
    rating: 4.9
  },
  'pwing': {
    title: "Papa's Wingeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Fry chicken wings, toss them in savory spicy sauces, and arrange platters in Starlight City.",
    rating: 4.9
  },
  'pburger': {
    title: "Papa's Burgeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Flip burger patties, melt cheeses, and stack burgers high for picky food critics.",
    rating: 4.9
  },
  'pfreeze': {
    title: "Papa's Freezeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Blend delicious Freezer sundaes on Calypso Island with mixables and decadent syrups.",
    rating: 5.0
  },
  'pcupcake': {
    title: "Papa's Cupcakeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Bake, frost, and decorate festive holiday cupcakes in the scenic town of Frostfield.",
    rating: 4.8
  },
  'pdonut': {
    title: "Papa's Donuteria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Roll dough, fry donuts, and fill them with jelly and custard at the Powder Point amusement park.",
    rating: 4.9
  },
  'pbaker': {
    title: "Papa's Bakeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Bake mouthwatering pies and tarts with custom crusts, fillings, and top crust designs.",
    rating: 4.8
  },
  'ptaco': {
    title: "Papa's Taco Mia!",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Craft sizzling tacos and nachos with beef, chicken, beans, and fresh toppings in Tacodale.",
    rating: 4.8
  },
  'photdog': {
    title: "Papa's Hot Doggeria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Grill juicy stadium hot dogs, pour sodas, and pop buttery popcorn at the Griller Stadium.",
    rating: 4.8
  },
  'pcheese': {
    title: "Papa's Cheeseria",
    genres: ['Cooking', 'Simulation', 'Flash'],
    description: "Toast gourmet grilled cheese sandwiches and fry loaded curly fries in Toastwood.",
    rating: 4.9
  },

  // Riddle School & Riddle Transfer Series
  'rs1': {
    title: "Riddle School 1",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "Phil Eggtree's inaugural quest to escape boring elementary school using sharp wit and classroom items.",
    rating: 4.8
  },
  'rs2': {
    title: "Riddle School 2",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "Help Phil escape middle school by outsmarting teachers and finding the exit key.",
    rating: 4.8
  },
  'rs3': {
    title: "Riddle School 3",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "Escape high school with Phil, Smiley, Phred, and Zack in this beloved point-and-click classic.",
    rating: 4.9
  },
  'rs4': {
    title: "Riddle School 4",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "A short, mind-twisting adventure set in a mysterious snowy landscape.",
    rating: 4.7
  },
  'rs5': {
    title: "Riddle School 5",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "The epic extraterrestrial climax of the original Riddle School saga inside an alien mothership.",
    rating: 5.0
  },
  'rt1': {
    title: "Riddle Transfer 1",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "Phil and friends find themselves detained in a secretive government holding facility.",
    rating: 4.9
  },
  'rt2': {
    title: "Riddle Transfer 2",
    genres: ['Adventure', 'Point & Click', 'Puzzle'],
    description: "Jonochrome's grand conclusion to the entire Riddle saga with full voice acting and animations.",
    rating: 5.0
  },

  // Raft Wars Series
  'rw': {
    title: "Raft Wars",
    genres: ['Shooter', 'Strategy', 'Turn-Based'],
    description: "Defend your treasure on the beach with Simon and Paul using tennis ball launchers against greedy pirates.",
    rating: 4.9
  },
  'rw1': {
    title: "Raft Wars",
    genres: ['Shooter', 'Strategy', 'Turn-Based'],
    description: "Defend your treasure on the beach with Simon and Paul using tennis ball launchers against greedy pirates.",
    rating: 4.9
  },
  'rw2': {
    title: "Raft Wars 2",
    genres: ['Shooter', 'Strategy', 'Turn-Based'],
    description: "Simon returns to dig up his buried gold from underneath a luxury water park with rocket upgrades.",
    rating: 4.9
  },

  // Run Series
  'r1': {
    title: "Run 1",
    genres: ['Runner', 'Arcade', 'Platformer'],
    description: "Navigate floating space tiles in this mind-bending 3D corridor gravity runner.",
    rating: 4.7
  },
  'r2': {
    title: "Run 2",
    genres: ['Runner', 'Arcade', 'Platformer'],
    description: "The classic sequel with the Runner and Skater running along dynamic tunnel walls.",
    rating: 4.8
  },
  'r3': {
    title: "Run 3",
    genres: ['Runner', 'Arcade', 'Platformer'],
    description: "The ultimate space tunnel runner! Unlock new alien characters with unique gravitational abilities.",
    rating: 5.0
  },

  // Red Ball Series
  'rb1': {
    title: "Red Ball 1",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Roll and bounce across physics obstacles to reach the goal flag.",
    rating: 4.6
  },
  'rb2': {
    title: "Red Ball 2: King Carrot",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Search for the lost crown across tricky hills, spikes, and water hazards.",
    rating: 4.7
  },
  'rb3': {
    title: "Red Ball 3",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Save your pink ball girlfriend from the nefarious black square.",
    rating: 4.8
  },
  'rb4': {
    title: "Red Ball 4: Volume 1",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Stop the evil black cubes from turning the world square in this vibrant physics adventure.",
    rating: 4.9
  },
  'rb4v1': {
    title: "Red Ball 4: Volume 1",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Stop the evil black cubes from turning the world square in this vibrant physics adventure.",
    rating: 4.9
  },
  'rb4v2': {
    title: "Red Ball 4: Volume 2",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Journey through deep forests and bounce off square henchmen to save the round world.",
    rating: 4.8
  },
  'rb4v3': {
    title: "Red Ball 4: Volume 3",
    genres: ['Platformer', 'Physics', 'Flash'],
    description: "Infiltrate the dangerous square factory filled with lasers, conveyor belts, and robot bosses.",
    rating: 4.9
  },

  // The Impossible Quiz
  'tiq': {
    title: "The Impossible Quiz",
    genres: ['Puzzle', 'Trivia', 'Flash'],
    description: "110 ridiculous, mind-bending questions testing lateral thinking, reflexes, and memory.",
    rating: 4.9
  },
  'tiq1': {
    title: "The Impossible Quiz",
    genres: ['Puzzle', 'Trivia', 'Flash'],
    description: "110 ridiculous, mind-bending questions testing lateral thinking, reflexes, and memory.",
    rating: 4.9
  },
  'tiq2': {
    title: "The Impossible Quiz 2",
    genres: ['Puzzle', 'Trivia', 'Flash'],
    description: "Splapp-me-do's 120-question follow up with even crazier questions, bombs, and Chris the Cat.",
    rating: 4.9
  },

  // The World's Hardest Game
  'whg': {
    title: "The World's Hardest Game",
    genres: ['Skill', 'Puzzle', 'Difficult'],
    description: "Guide the red square past oscillating blue dots and collect yellow coins through 30 brutal levels.",
    rating: 4.8
  },
  'whg1': {
    title: "The World's Hardest Game",
    genres: ['Skill', 'Puzzle', 'Difficult'],
    description: "Guide the red square past oscillating blue dots and collect yellow coins through 30 brutal levels.",
    rating: 4.8
  },
  'whg2': {
    title: "The World's Hardest Game 2",
    genres: ['Skill', 'Puzzle', 'Difficult'],
    description: "50 brand new mind-numbing obstacle courses with tricky keys and checkpoints.",
    rating: 4.8
  },
  'whg3': {
    title: "The World's Hardest Game 3",
    genres: ['Skill', 'Puzzle', 'Difficult'],
    description: "More advanced level geometry and multi-stage puzzles for hardcore puzzle masters.",
    rating: 4.7
  },
  'whg4': {
    title: "The World's Hardest Game 4",
    genres: ['Skill', 'Puzzle', 'Difficult'],
    description: "The intense fourth installment of Snubby Land's punishing precision series.",
    rating: 4.7
  },

  // Sugar, Sugar Series
  'ss': {
    title: "Sugar, Sugar",
    genres: ['Physics', 'Puzzle', 'Flash'],
    description: "Draw ramps and guide falling sugar granules into matching coffee cups in Bart Bonte's masterpiece.",
    rating: 4.8
  },
  'ss1': {
    title: "Sugar, Sugar",
    genres: ['Physics', 'Puzzle', 'Flash'],
    description: "Draw ramps and guide falling sugar granules into matching coffee cups in Bart Bonte's masterpiece.",
    rating: 4.8
  },
  'ss2': {
    title: "Sugar, Sugar 2",
    genres: ['Physics', 'Puzzle', 'Flash'],
    description: "More coffee cups, color filters, gravity inverters, and sugar-pouring physics puzzles.",
    rating: 4.9
  },
  'ss3': {
    title: "Sugar, Sugar 3",
    genres: ['Physics', 'Puzzle', 'Flash'],
    description: "30 new sugar-filtering puzzles with teleportation and dynamic color mixing.",
    rating: 4.8
  },

  // Henry Stickmin Series
  'btb': {
    title: "Henry Stickmin: Breaking the Bank",
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    description: "The origin story of Henry Stickmin trying to break into a bank vault in the desert.",
    rating: 4.8
  },
  'etp': {
    title: "Henry Stickmin: Escaping the Prison",
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    description: "Choose between laser drill, rocket launcher, disguise, teleporter, or file to escape West Mesa.",
    rating: 4.9
  },
  'std': {
    title: "Henry Stickmin: Stealing the Diamond",
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    description: "Infiltrate the city museum and pull off the greatest Tunisian Diamond heist in history.",
    rating: 5.0
  },
  'ita': {
    title: "Henry Stickmin: Infiltrating the Airship",
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    description: "Team up with the Government or join the Toppat Clan aboard the airborne zeppelin fortress.",
    rating: 5.0
  },
  'ftc': {
    title: "Henry Stickmin: Fleeing the Complex",
    genres: ['Comedy', 'Choose Your Own', 'Stickman'],
    description: "Escape The Wall, the ultimate maximum security facility in freezing Siberia with Ellie Rose.",
    rating: 5.0
  },

  // Strike Force Heroes & Action
  'sth': {
    title: "Strike Force Heroes",
    genres: ['Shooter', 'Action', 'Flash'],
    description: "Command soldiers with customizable weapon loadouts, killstreaks, and intense campaign missions.",
    rating: 4.9
  },
  'sfh': {
    title: "Strike Force Heroes",
    genres: ['Shooter', 'Action', 'Flash'],
    description: "Command soldiers with customizable weapon loadouts, killstreaks, and intense campaign missions.",
    rating: 4.9
  },
  'sth2': {
    title: "Strike Force Heroes 2",
    genres: ['Shooter', 'Action', 'Flash'],
    description: "Custom classes, deep weapon crafting, outer space orbital combat, and an epic story.",
    rating: 5.0
  },
  'sfh2': {
    title: "Strike Force Heroes 2",
    genres: ['Shooter', 'Action', 'Flash'],
    description: "Custom classes, deep weapon crafting, outer space orbital combat, and an epic story.",
    rating: 5.0
  },
  'sth3': {
    title: "Strike Force Heroes 3",
    genres: ['Shooter', 'Action', 'Flash'],
    description: "Recruit squad members and unlock over 60 weapons in randomized team missions.",
    rating: 4.8
  },

  // Other Classics
  'portal': {
    title: "Portal: The Flash Version",
    genres: ['Puzzle', 'Platformer', 'Sci-Fi'],
    description: "We Create Stuff's legendary 2D recreation of Aperture Science's portal gun test chambers.",
    rating: 4.9
  },
  'stm': {
    title: "Super Toss The Turtle",
    genres: ['Action', 'Arcade', 'Launch'],
    description: "Fire turtles out of cannons, drop bombs, shoot rockets, and bounce across insane hazard distances.",
    rating: 4.8
  },
  'bic': {
    title: "Bad Ice Cream",
    genres: ['Arcade', 'Retro', 'Flash'],
    description: "Nitrome's retro 2-player arcade gem. Create and break ice walls while gobbling fresh fruits.",
    rating: 4.9
  },
  'bic2': {
    title: "Bad Ice Cream 2",
    genres: ['Arcade', 'Retro', 'Flash'],
    description: "More icy stages, fruit varieties, and angry enemies in icy labyrinths.",
    rating: 4.9
  },
  'bic3': {
    title: "Bad Ice Cream 3",
    genres: ['Arcade', 'Retro', 'Flash'],
    description: "Nitrome's third frozen delight featuring sweet treats and chilly obstacles.",
    rating: 4.9
  },
  'dl1': {
    title: "Duck Life 1",
    genres: ['Adventure', 'Simulation', 'Flash'],
    description: "Train your duck in running, swimming, and flying to save the family farm.",
    rating: 4.7
  },
  'dl2': {
    title: "Duck Life 2: World Champion",
    genres: ['Adventure', 'Simulation', 'Flash'],
    description: "Climb skills, travel international race tracks, and become the world champion duck.",
    rating: 4.8
  },
  'dl3': {
    title: "Duck Life 3: Evolution",
    genres: ['Adventure', 'Simulation', 'Flash'],
    description: "Choose genetically modified duck breeds and evolve your duck into an Olympic athlete.",
    rating: 4.8
  },
  'dl4': {
    title: "Duck Life 4",
    genres: ['Adventure', 'Simulation', 'Flash'],
    description: "Explore the open world island, challenge rival duck teams, and enter the championship volcano.",
    rating: 4.9
  },
  'fbwg': {
    title: "Fireboy & Watergirl: The Forest Temple",
    genres: ['Co-Op', 'Puzzle', 'Flash'],
    description: "Work together to collect diamonds and solve puzzle switches in the ancient Forest Temple.",
    rating: 5.0
  },
  'fbwg1': {
    title: "Fireboy & Watergirl: The Forest Temple",
    genres: ['Co-Op', 'Puzzle', 'Flash'],
    description: "Work together to collect diamonds and solve puzzle switches in the ancient Forest Temple.",
    rating: 5.0
  },
  'fbwg2': {
    title: "Fireboy & Watergirl: The Light Temple",
    genres: ['Co-Op', 'Puzzle', 'Flash'],
    description: "Direct light beams and mirrors to unlock portals in the Light Temple.",
    rating: 4.9
  },
  'btd4': {
    title: "Bloons Tower Defense 4",
    genres: ['Strategy', 'Tower Defense', 'Flash'],
    description: "Pop thousands of bloons with dart monkeys, super monkeys, mortar towers, and airships.",
    rating: 4.9
  },
  'aow': {
    title: "Age of War",
    genres: ['Strategy', 'Defense', 'Flash'],
    description: "Defend your base and evolve from cavemen on dinosaurs to futuristic laser battle tanks.",
    rating: 4.9
  },
  'aow2': {
    title: "Age of War 2",
    genres: ['Strategy', 'Defense', 'Flash'],
    description: "Upgraded generals, special spells, and tactical evolutionary warfare across the ages.",
    rating: 4.9
  },
  'ltf': {
    title: "Learn to Fly",
    genres: ['Strategy', 'Arcade', 'Flash'],
    description: "Prove the internet wrong and make a penguin fly with gliders and rockets.",
    rating: 4.8
  },
  'ltf2': {
    title: "Learn to Fly 2",
    genres: ['Strategy', 'Arcade', 'Flash'],
    description: "Build massive payloads and shatter the iceberg that humiliated you in the first game.",
    rating: 4.9
  },
  'fpa': {
    title: "The Fancy Pants Adventures",
    genres: ['Platformer', 'Adventure', 'Flash'],
    description: "Brad Borne's fluid, high-speed momentum platformer with the stickman wearing fancy orange pants.",
    rating: 4.9
  },
  'fpa2': {
    title: "Fancy Pants Adventures: World 2",
    genres: ['Platformer', 'Adventure', 'Flash'],
    description: "Recover the stolen ice cream cone through bouncy springs, golf swings, and tricky levels.",
    rating: 4.9
  },
  'sm63': {
    title: "Super Mario 63",
    genres: ['Platformer', 'Adventure', 'Flash'],
    description: "Runouw's masterpiece 2D Mario sandbox featuring the FLUDD water pack, Shine Sprites, and level editor.",
    rating: 5.0
  },
  'ssf2': {
    title: "Super Smash Flash 2",
    genres: ['Fighting', 'Action', 'Flash'],
    description: "The ultimate fan-made brawler featuring Goku, Naruto, Mega Man, Sonic, and Nintendo all-stars.",
    rating: 5.0
  },
  'qwop': {
    title: "QWOP",
    genres: ['Ragdoll', 'Sports', 'Difficult'],
    description: "Control the thighs and calves of an Olympic 100m sprinter in Bennett Foddy's hilarious physics game.",
    rating: 4.6
  },
  'hw': {
    title: "Happy Wheels",
    genres: ['Ragdoll', 'Gore', 'Flash'],
    description: "Jim Bonacci's iconic physics ragdoll obstacle course with Wheelchair Guy, Segway Guy, and Irresponsible Dad.",
    rating: 5.0
  },
  'sw1': {
    title: "Stick War",
    genres: ['Strategy', 'Stickman', 'Flash'],
    description: "Lead the nation of Order against surrounding specialized stick empires in Inamorta.",
    rating: 4.9
  },
  'sw2': {
    title: "Stick War 2: Order Empire",
    genres: ['Strategy', 'Stickman', 'Flash'],
    description: "Expanded armies, elemental summons, and real-time stick warfare.",
    rating: 4.9
  },
  'sns2': {
    title: "Swords and Sandals 2",
    genres: ['RPG', 'Fighting', 'Turn-Based'],
    description: "Gladiator arena combat! Buy swords, armors, level up stats, and defeat legendary arena champions.",
    rating: 4.8
  },
  'pb2': {
    title: "Plazma Burst 2",
    genres: ['Shooter', 'Sci-Fi', 'Flash'],
    description: "High-intensity side-scrolling sci-fi tactical gunplay with plasma cannons and physics.",
    rating: 4.9
  },
  'sonny2': {
    title: "Sonny 2",
    genres: ['RPG', 'Turn-Based', 'Flash'],
    description: "Krin's dark zombie RPG with rich tactical turn-based skill trees and orchestral music.",
    rating: 5.0
  },
  'ctc': {
    title: "Crush the Castle",
    genres: ['Physics', 'Destruction', 'Flash'],
    description: "The original trebuchet physics game that inspired Angry Birds! Fling boulders, bombs, and crush castles.",
    rating: 4.8
  },
  'ew': {
    title: "Effing Worms",
    genres: ['Action', 'Arcade', 'Flash'],
    description: "Play as a giant underground worm, leaping out of the ground to devour cows, people, and tanks.",
    rating: 4.7
  },
  'sf': {
    title: "Superfighters",
    genres: ['Action', 'Brawler', 'Shooter'],
    description: "Pixel-art 2D arena brawler with explosive barrels, destructible environments, and wild shootouts.",
    rating: 4.9
  }
};

export function cleanGameSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/^quasar-/, '')
    .replace(/^gameports-/, '')
    .replace(/[-_]+/g, '')
    .trim();
}

export function formatGameInfo(rawId: string, currentTitle: string, currentGenres?: string[]): ResolvedGameInfo {
  const slugKey = cleanGameSlug(rawId || currentTitle);
  const titleKey = cleanGameSlug(currentTitle);

  const matched = KNOWN_GAME_ALIASES[slugKey] || KNOWN_GAME_ALIASES[titleKey];
  if (matched) {
    return {
      title: matched.title,
      genres: matched.genres,
      description: matched.description,
      rating: matched.rating || 4.8
    };
  }

  // General formatting for unmapped titles
  let prettyTitle = currentTitle || rawId || 'Retro Game';
  prettyTitle = prettyTitle
    .replace(/^quasar-/, '')
    .replace(/^gameports-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: prettyTitle,
    genres: (currentGenres && currentGenres.length > 0) ? currentGenres : ['Flash', 'Arcade'],
    rating: 4.7
  };
}
