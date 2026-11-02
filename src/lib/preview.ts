/**
 * The GitHub Pages preview.
 *
 * GitHub Pages serves static files only, and Flashhub's games, accounts, saves and Steam all
 * run on its Express server. The Pages build (VITE_STATIC_PREVIEW=1, see
 * .github/workflows/pages.yml) is therefore a look at the interface: it reads a snapshot of the
 * catalogue taken at build time, draws covers in the browser, and says plainly that playing,
 * signing in and uploading need the full server. Normal builds never take these paths.
 */

export const STATIC_PREVIEW = import.meta.env.VITE_STATIC_PREVIEW === '1';

/** Where the app is served from: "/" normally, "/<repo>/" on GitHub Pages. */
export const BASE_URL = import.meta.env.BASE_URL || '/';

export const PREVIEW_MESSAGE =
  'This is a preview of Flashhub’s interface on GitHub Pages. Playing games, accounts, saves and Steam need the full Flashhub server.';

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * The drawn cover the server makes at /api/cover, made in the browser instead: one flat,
 * low-chroma field per game, a red mark, the title flush left at the foot.
 */
export function drawnCoverDataUri(seed: string, title: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;

  const lines: string[] = [];
  let current = '';
  for (const word of title.split(/\s+/).filter(Boolean)) {
    if ((current + ' ' + word).trim().length > 16 && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
    if (lines.length === 2) break;
  }
  if (current && lines.length < 3) lines.push(current);

  const size = lines.length > 2 ? 32 : 38;
  const leading = size * 1.04;
  const first = 300 - 28 - (lines.length - 1) * leading;
  const text = lines
    .map((line, i) => `<text x="26" y="${(first + i * leading).toFixed(1)}" fill="#f3f2f2" font-family="Archivo, Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="800" letter-spacing="-0.8">${escape(line)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="hsl(${hue}, 18%, 17%)"/><rect x="26" y="26" width="28" height="6" fill="#ec3013"/>${text}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
