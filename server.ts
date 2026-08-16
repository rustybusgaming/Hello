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

// Ensure assets are downloaded in the background if they were wiped
function ensureAssetsSync() {
  const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
  if (!fs.existsSync(gameportsDir)) {
    console.log('Assets missing. Triggering background sync...');
    exec('npm run sync', (error, stdout, stderr) => {
      if (error) {
        console.error(`Sync error: ${error}`);
        return;
      }
      console.log(`Sync stdout: ${stdout}`);
      if (stderr) console.error(`Sync stderr: ${stderr}`);
    });
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

async function fetchArchiveGames() {
  try {
    const response = await fetch('https://archive.org/advancedsearch.php?q=collection:(softwarelibrary_flash)+AND+mediatype:(software)&fl[]=identifier,title,subject,downloads&sort[]=downloads+desc&rows=50&output=json');
    const data = await response.json();
    const docs = data.response.docs;

    return docs.map((doc: any) => {
      let genres = ['Flash'];
      if (doc.subject) {
        if (Array.isArray(doc.subject)) {
          genres = doc.subject.slice(0, 3);
        } else if (typeof doc.subject === 'string') {
          genres = doc.subject.split(',').map((s: string) => s.trim()).slice(0, 3);
        }
      }
      
      // Capitalize first letter of genres
      genres = genres.map(g => g.charAt(0).toUpperCase() + g.slice(1));

      return {
        id: doc.identifier,
        title: doc.title || 'Unknown Title',
        thumbnail: `https://archive.org/services/img/${doc.identifier}`,
        rating: 4.5, // Mock rating or base on downloads
        source: 'archive',
        embedUrl: `https://archive.org/embed/${doc.identifier}`,
        genres: genres.length > 0 ? genres : ['Flash'],
      };
    });
  } catch (e) {
    console.error("Failed to fetch from archive.org", e);
    return [];
  }
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

      res.json({ status: 'ok', data: games });
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ error: 'Failed to fetch games' });
    }
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
