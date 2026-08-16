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
    exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || stdout || err.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function syncGamesLibrary(): Promise<void> {
  console.log('[Sync] Starting cross-platform game synchronization...');

  const gameportsDir = path.join(process.cwd(), 'public', 'gameports');
  const quasarDir = path.join(process.cwd(), 'public', 'quasar');

  fs.mkdirSync(gameportsDir, { recursive: true });
  fs.mkdirSync(quasarDir, { recursive: true });

  // 1. Sync Gameports
  const hasGameports = fs.existsSync(path.join(gameportsDir, 'milkman karlson')) || fs.existsSync(path.join(gameportsDir, 'Build'));
  if (!hasGameports) {
    console.log('[Sync] Downloading Gameports collection from GitHub...');
    const tempGameports = path.join(process.cwd(), 'public', 'gameports_temp');
    removeDirRecursive(tempGameports);

    try {
      await runCommand(`git clone --depth 1 https://github.com/aukak/gameports.git "${tempGameports}"`);
      removeDirRecursive(path.join(tempGameports, '.git'));
      copyDirRecursive(tempGameports, gameportsDir);
      removeDirRecursive(tempGameports);
      console.log('[Sync] Gameports downloaded successfully.');
    } catch (e: any) {
      console.warn('[Sync] Note: Git clone for Gameports failed or git is not installed in PATH:', e.message);
      removeDirRecursive(tempGameports);
    }
  }

  // 2. Sync Quasar
  const quasarStorage = path.join(quasarDir, 'storage');
  const quasarImg = path.join(quasarDir, 'img');
  const hasQuasar = fs.existsSync(quasarStorage) && fs.existsSync(quasarImg) && fs.readdirSync(quasarStorage).length > 0;

  if (!hasQuasar) {
    console.log('[Sync] Downloading Quasar library from GitHub...');
    const tempQuasar = path.join(process.cwd(), 'temp_quasar');
    removeDirRecursive(tempQuasar);

    try {
      await runCommand(`git clone --depth 1 https://github.com/slqntdevss/quasar.git "${tempQuasar}"`);
      
      const srcStorage = path.join(tempQuasar, 'public', 'assets', 'storage');
      const srcImg = path.join(tempQuasar, 'public', 'img');

      if (fs.existsSync(srcStorage)) {
        copyDirRecursive(srcStorage, quasarStorage);
      }
      if (fs.existsSync(srcImg)) {
        copyDirRecursive(srcImg, quasarImg);
      }

      removeDirRecursive(tempQuasar);
      console.log('[Sync] Quasar library downloaded successfully.');
    } catch (e: any) {
      console.warn('[Sync] Note: Git clone for Quasar failed or git is not installed in PATH:', e.message);
      removeDirRecursive(tempQuasar);
    }
  }

  console.log('[Sync] Game synchronization process completed.');
}
