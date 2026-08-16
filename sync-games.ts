import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Cross-platform directory helper
function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDirRecursive(targetDir: string) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
}

function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || stdout || err.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function syncGamesLibrary(): Promise<void> {
  console.log('[Sync] Initializing local games folders and proxy configurations...');

  const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
  const quasarDir = path.join(process.cwd(), 'public', 'quasar');
  const customGamesDir = path.join(process.cwd(), 'public', 'custom_games');

  fs.mkdirSync(gameportsDir, { recursive: true });
  fs.mkdirSync(quasarDir, { recursive: true });
  fs.mkdirSync(customGamesDir, { recursive: true });

  console.log('[Sync] Game catalogs & on-demand cloud proxies active.');
}
