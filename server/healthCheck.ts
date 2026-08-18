import fs from 'fs';
import path from 'path';

/**
 * Catalogue health check.
 *
 * The catalogue points at mirrors that rot: repositories get renamed, Archive.org items are
 * pulled, image hosts expire links. This walks every entry the way a player would reach it
 * — through this server — and records what no longer answers, so dead games can be hidden
 * before somebody clicks one.
 */

export interface HealthResult {
  id: string;
  title: string;
  target: string;
  kind: 'game' | 'thumbnail';
  ok: boolean;
  status: number | string;
}

export interface HealthReport {
  startedAt: string;
  finishedAt: string | null;
  checked: number;
  total: number;
  failures: HealthResult[];
}

interface CatalogEntry {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const REPORT_FILE = path.join(DATA_DIR, 'health.json');

const CONCURRENCY = 6;
const TIMEOUT_MS = 12000;

let running = false;
let report: HealthReport | null = null;

export function getHealthReport(): { running: boolean; report: HealthReport | null } {
  if (!report) {
    try {
      if (fs.existsSync(REPORT_FILE)) {
        const raw = fs.readFileSync(REPORT_FILE, 'utf8').trim();
        if (raw) report = JSON.parse(raw);
      }
    } catch {
      report = null;
    }
  }
  return { running, report };
}

function saveReport() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Could not persist health report:', err);
  }
}

/**
 * Reduce a catalogue URL to the thing whose availability actually matters.
 * A player URL like /play.html?swf=<url> is only as healthy as the .swf behind it, and
 * play.html itself is a static local file that always answers.
 */
function resolveTarget(url: string, origin: string): string | null {
  if (!url) return null;

  if (url.startsWith('/play.html')) {
    const query = url.slice(url.indexOf('?') + 1);
    const params = new URLSearchParams(query);
    const swf = params.get('swf') || params.get('url');
    if (!swf) return null; // drag-and-drop player, nothing upstream to verify
    return swf.startsWith('http') ? swf : origin + swf;
  }

  if (url.startsWith('/')) return origin + url;
  if (url.startsWith('http')) return url;
  return null;
}

/**
 * An entry document that answers 200 proves very little: several mirrored games ship an
 * index.html whose actual code was never copied across. So for HTML entry points the first
 * game script is probed too, which is what a player's browser would fail on.
 */
async function probeGameScript(entryUrl: string): Promise<{ ok: boolean; status: number | string } | null> {
  try {
    const res = await fetch(entryUrl, {
      headers: { 'User-Agent': 'FlashHub-HealthCheck/1.0' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('html')) return null;

    const html = (await res.text()).slice(0, 120000);
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)].map(m => m[1]);

    // Skip analytics and ad tags: their absence never stops a game from running
    const noise = ['googletagmanager', 'google-analytics', 'doubleclick', '2mdn.net', 'imasdk', 'adsbygoogle'];
    const candidate = scripts.find(src => !noise.some(n => src.includes(n)));
    if (!candidate) return null;

    const resolved = new URL(candidate, entryUrl).toString();
    return await probe(resolved);
  } catch {
    return null;
  }
}

async function probe(target: string): Promise<{ ok: boolean; status: number | string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      // One byte is enough to prove the asset resolves without pulling a 90 MB Unity blob
      headers: { Range: 'bytes=0-0', 'User-Agent': 'FlashHub-HealthCheck/1.0' }
    });
    // Read the single byte to completion rather than cancelling: tearing the stream down
    // mid-flight makes the proxy on the other end log a destroyed-socket error for every probe.
    await res.arrayBuffer().catch(() => undefined);
    return { ok: res.ok || res.status === 206, status: res.status };
  } catch (err: any) {
    return { ok: false, status: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'error').slice(0, 40) };
  } finally {
    clearTimeout(timer);
  }
}

export async function runHealthCheck(games: CatalogEntry[], origin: string): Promise<void> {
  if (running) return;
  running = true;

  const jobs: { entry: CatalogEntry; target: string; kind: 'game' | 'thumbnail' }[] = [];
  for (const game of games) {
    const gameTarget = resolveTarget(game.embedUrl, origin);
    if (gameTarget) jobs.push({ entry: game, target: gameTarget, kind: 'game' });

    // Locally generated cover art cannot 404, so only external thumbnails are worth probing
    if (game.thumbnail && game.thumbnail.startsWith('http')) {
      jobs.push({ entry: game, target: game.thumbnail, kind: 'thumbnail' });
    }
  }

  report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    checked: 0,
    total: jobs.length,
    failures: []
  };

  let cursor = 0;
  const worker = async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      let { ok, status } = await probe(job.target);

      // An HTML game that answers but cannot load its own code is still broken
      if (ok && job.kind === 'game' && /\.html?($|\?)/i.test(job.target)) {
        const script = await probeGameScript(job.target);
        if (script && !script.ok) {
          ok = false;
          status = `script ${script.status}`;
        }
      }

      if (!report) return;
      report.checked++;
      if (!ok) {
        report.failures.push({
          id: job.entry.id,
          title: job.entry.title,
          target: job.target,
          kind: job.kind,
          ok: false,
          status
        });
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    if (report) {
      report.finishedAt = new Date().toISOString();
      report.failures.sort((a, b) => a.title.localeCompare(b.title));
      saveReport();
    }
    console.log(`[Health] Checked ${report?.checked ?? 0} targets, ${report?.failures.length ?? 0} failing.`);
  } finally {
    running = false;
  }
}
