import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

const upload = multer({ dest: path.join(process.cwd(), 'public', 'custom_games') });

// Ensure custom_games dir exists
const customGamesDir = path.join(process.cwd(), 'public', 'custom_games');
if (!fs.existsSync(customGamesDir)) {
  fs.mkdirSync(customGamesDir, { recursive: true });
}

// Track syncing status
let isSyncing = false;
let syncProgressMessage = 'Idle';

function runSync() {
  if (isSyncing) return;
  isSyncing = true;
  syncProgressMessage = 'Syncing games repository in background...';
  console.log(syncProgressMessage);

  const scriptPath = path.join(process.cwd(), 'sync-games.sh');
  exec(`bash "${scriptPath}"`, (error, stdout, stderr) => {
    isSyncing = false;
    if (error) {
      syncProgressMessage = `Sync failed: ${error.message}`;
      console.error(`Sync error: ${error}`);
      return;
    }
    syncProgressMessage = 'Games synchronized successfully!';
    console.log(`Sync stdout: ${stdout}`);
    if (stderr) console.warn(`Sync stderr: ${stderr}`);
  });
}

// Ensure assets are downloaded in the background if they were wiped
function ensureAssetsSync() {
  const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
  const quasarDir = path.join(process.cwd(), 'public', 'quasar');
  if (!fs.existsSync(gameportsDir) || !fs.existsSync(quasarDir)) {
    console.log('Assets missing. Triggering background sync...');
    runSync();
  }
}

// Keep a few webports and steam games for variety
const MOCK_GAMES = [
  {
    id: 'sm64',
    title: 'Super Mario 64 Web',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Super_Mario_64_box_cover.jpg',
    rating: 5.0,
    source: 'webporting' as const,
    embedUrl: 'https://sm64web.com/',
    genres: ['Adventure', 'Platformer']
  },
  {
    id: 'quake',
    title: 'WebQuake',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Quake_box_art.jpg',
    rating: 4.9,
    source: 'webporting' as const,
    embedUrl: 'https://netquake.io/',
    genres: ['Action', 'Shooter']
  },
  {
    id: '220',
    title: 'Half-Life 2',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/220/header.jpg',
    rating: 5.0,
    source: 'steam' as const,
    embedUrl: 'https://store.steampowered.com/widget/220/',
    genres: ['Action', 'Shooter']
  }
];

// Fallback iconic flash games for when archive.org times out or is unreachable
const FALLBACK_ARCHIVE_GAMES = [
  {
    id: 'alienhominid',
    title: 'Alien Hominid',
    thumbnail: 'https://archive.org/services/img/alienhominid',
    rating: 4.9,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/alienhominid',
    genres: ['Action', 'Shooter', 'Flash']
  },
  {
    id: 'super-smash-flash-2',
    title: 'Super Smash Flash 2',
    thumbnail: 'https://archive.org/services/img/super-smash-flash-2',
    rating: 5.0,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/super-smash-flash-2',
    genres: ['Fighting', 'Action', 'Flash']
  },
  {
    id: 'electric-man-2-hs',
    title: 'Electric Man 2',
    thumbnail: 'https://archive.org/services/img/electric-man-2-hs',
    rating: 4.8,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/electric-man-2-hs',
    genres: ['Action', 'Fighting', 'Flash']
  },
  {
    id: 'interactive-buddy',
    title: 'Interactive Buddy',
    thumbnail: 'https://archive.org/services/img/interactive-buddy',
    rating: 4.7,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/interactive-buddy',
    genres: ['Simulation', 'Sandbox', 'Flash']
  },
  {
    id: 'the-impossible-quiz',
    title: 'The Impossible Quiz',
    thumbnail: 'https://archive.org/services/img/the-impossible-quiz',
    rating: 4.9,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/the-impossible-quiz',
    genres: ['Puzzle', 'Trivia', 'Flash']
  },
  {
    id: 'learn-to-fly',
    title: 'Learn to Fly',
    thumbnail: 'https://archive.org/services/img/learn-to-fly',
    rating: 4.8,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/learn-to-fly',
    genres: ['Strategy', 'Arcade', 'Flash']
  },
  {
    id: 'age-of-war',
    title: 'Age of War',
    thumbnail: 'https://archive.org/services/img/age-of-war',
    rating: 4.9,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/age-of-war',
    genres: ['Strategy', 'Defense', 'Flash']
  },
  {
    id: 'bloons-tower-defense-4',
    title: 'Bloons Tower Defense 4',
    thumbnail: 'https://archive.org/services/img/bloons-tower-defense-4',
    rating: 4.9,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/bloons-tower-defense-4',
    genres: ['Strategy', 'Tower Defense', 'Flash']
  },
  {
    id: 'fancy-pants-adventures',
    title: 'The Fancy Pants Adventures',
    thumbnail: 'https://archive.org/services/img/fancy-pants-adventures',
    rating: 4.8,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/fancy-pants-adventures',
    genres: ['Platformer', 'Adventure', 'Flash']
  },
  {
    id: 'swords-and-sandals-2',
    title: 'Swords and Sandals 2',
    thumbnail: 'https://archive.org/services/img/swords-and-sandals-2',
    rating: 4.7,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/swords-and-sandals-2',
    genres: ['RPG', 'Fighting', 'Flash']
  },
  {
    id: 'duck-life-4',
    title: 'Duck Life 4',
    thumbnail: 'https://archive.org/services/img/duck-life-4',
    rating: 4.8,
    source: 'archive' as const,
    embedUrl: 'https://archive.org/embed/duck-life-4',
    genres: ['Adventure', 'Simulation', 'Flash']
  }
];

// In-memory cache for Archive.org results
let cachedArchiveGames: any[] = [];
let lastArchiveFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

async function fetchArchiveGames() {
  const now = Date.now();
  if (cachedArchiveGames.length > 0 && now - lastArchiveFetchTime < CACHE_TTL_MS) {
    return cachedArchiveGames;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      'https://archive.org/advancedsearch.php?q=collection:(softwarelibrary_flash)+AND+mediatype:(software)&fl[]=identifier,title,subject,downloads&sort[]=downloads+desc&rows=50&output=json',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const data: any = await response.json();
    const docs = data?.response?.docs || [];

    const games = docs.map((doc: any) => {
      let genres = ['Flash'];
      if (doc.subject) {
        if (Array.isArray(doc.subject)) {
          genres = doc.subject.slice(0, 3);
        } else if (typeof doc.subject === 'string') {
          genres = doc.subject.split(',').map((s: string) => s.trim()).slice(0, 3);
        }
      }
      
      genres = genres.map(g => g.charAt(0).toUpperCase() + g.slice(1));

      return {
        id: doc.identifier,
        title: doc.title || 'Unknown Title',
        thumbnail: `https://archive.org/services/img/${doc.identifier}`,
        rating: 4.5,
        source: 'archive',
        embedUrl: `https://archive.org/embed/${doc.identifier}`,
        genres: genres.length > 0 ? genres : ['Flash'],
      };
    });

    if (games.length > 0) {
      cachedArchiveGames = games;
      lastArchiveFetchTime = now;
      return games;
    }
  } catch (e: any) {
    // Graceful fallback without crashing or blocking the server
    console.warn(`Archive.org fetch notice: ${e.name === 'AbortError' ? 'Request timed out' : (e.message || 'Service unavailable')}. Using curated fallback catalog.`);
  }

  // Use previously cached games or built-in iconic games
  return cachedArchiveGames.length > 0 ? cachedArchiveGames : FALLBACK_ARCHIVE_GAMES;
}

async function fetchLocalWebports() {
  const localGames = [];

  // 1. Scan aukak/gameports
  try {
    const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
    if (fs.existsSync(gameportsDir)) {
      const dirs = fs.readdirSync(gameportsDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const indexPath = path.join(gameportsDir, dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          localGames.push({
            id: `gameports-${dir}`,
            title: dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
            rating: 4.8,
            source: 'webporting',
            embedUrl: `/gameports/${encodeURIComponent(dir)}/index.html`,
            genres: ['Web Port', 'Gameports']
          });
        }
      }
    }
  } catch(e) { console.error('Error scanning gameports:', e); }

  // 2. Scan slqntdevss/quasar
  try {
    const quasarDir = path.join(process.cwd(), 'public', 'quasar', 'storage', 'flash');
    if (fs.existsSync(quasarDir)) {
      const dirs = fs.readdirSync(quasarDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const gameHtml = path.join(quasarDir, dir, 'index.html');
        const gameSwf = path.join(quasarDir, dir, 'game.swf');
        
        let embedUrl = '';
        if (fs.existsSync(gameHtml)) {
          embedUrl = `/quasar/storage/flash/${encodeURIComponent(dir)}/index.html`;
        } else if (fs.existsSync(gameSwf)) {
          embedUrl = `/play.html?swf=/quasar/storage/flash/${encodeURIComponent(dir)}/game.swf`;
        }
        
        if (embedUrl) {
          localGames.push({
            id: `quasar-${dir}`,
            title: dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            thumbnail: `/quasar/img/games/${encodeURIComponent(dir)}.png`, // fallback handled by frontend if needed
            rating: 4.7,
            source: 'webporting',
            embedUrl,
            genres: ['Flash', 'Quasar']
          });
        }
      }
    }
  } catch(e) { console.error('Error scanning quasar:', e); }

  // 3. Scan custom_games
  try {
    const customDir = path.join(process.cwd(), 'public', 'custom_games');
    if (fs.existsSync(customDir)) {
      const dirs = fs.readdirSync(customDir);
      for (const dir of dirs) {
        if (dir.startsWith('.')) continue;
        const metaPath = path.join(customDir, dir, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          localGames.push(meta);
        }
      }
    }
  } catch(e) { console.error('Error scanning custom games:', e); }

  return localGames;
}

async function startServer() {
  ensureAssetsSync();
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API Route to fetch games
  app.get('/api/games', async (req, res) => {
    try {
      const archiveGames = await fetchArchiveGames();
      const localGames = await fetchLocalWebports();
      
      // Combine archive games with our curated web/steam ports and local games
      let games = [...localGames, ...archiveGames, ...MOCK_GAMES];

      res.json({ status: 'ok', data: games, isSyncing, syncProgressMessage });
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
  });

  // API Route to trigger background games sync
  app.post('/api/sync', (req, res) => {
    if (isSyncing) {
      return res.json({ status: 'in_progress', message: syncProgressMessage });
    }
    runSync();
    res.json({ status: 'started', message: 'Game synchronization started.' });
  });

  // API Route to check sync status
  app.get('/api/sync-status', (req, res) => {
    res.json({
      isSyncing,
      message: syncProgressMessage,
    });
  });

  // API Route to upload games
  app.post('/api/upload', upload.single('game'), (req, res) => {
    if (!req.file || !req.body.title) {
      return res.status(400).json({ error: 'Missing file or title' });
    }

    const title = req.body.title;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    
    // Create a folder for the new game
    const gameId = `custom-${Date.now()}`;
    const gameDir = path.join(customGamesDir, gameId);
    fs.mkdirSync(gameDir, { recursive: true });

    // Move file
    const targetFile = ext === '.swf' ? 'game.swf' : 'index.html';
    fs.renameSync(req.file.path, path.join(gameDir, targetFile));

    // Create metadata.json for the game
    const meta = {
      id: gameId,
      title: title,
      source: 'custom',
      embedUrl: ext === '.swf' ? `/play.html?swf=/custom_games/${gameId}/game.swf` : `/custom_games/${gameId}/index.html`,
      genres: ['Custom', 'Uploaded'],
      thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80',
      rating: 5.0
    };
    
    fs.writeFileSync(path.join(gameDir, 'metadata.json'), JSON.stringify(meta));

    res.json({ status: 'ok', game: meta });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
