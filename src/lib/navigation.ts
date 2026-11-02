import React, { useEffect } from 'react';

/**
 * Keyboard and controller movement through the library.
 *
 * Inside a grid of cards the arrow keys move by row and column, the way a launcher does on a
 * television. Each card's main link carries `data-nav-item`; the grid carries `data-nav-grid`.
 * A connected gamepad drives the same thing: the d-pad and left stick send arrow keys, A
 * activates, B goes back. The bridge stops while a game is running so the game gets the pad.
 */

const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

function moveInGrid(grid: HTMLElement, current: HTMLElement, key: string): boolean {
  const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-nav-item]'));
  const index = items.indexOf(current);
  if (index < 0) return false;

  // Columns are whatever the layout currently gives: count the items on the first row
  const firstTop = items[0].getBoundingClientRect().top;
  const columns = Math.max(1, items.filter(el => Math.abs(el.getBoundingClientRect().top - firstTop) < 4).length);

  const target =
    key === 'ArrowLeft' ? index - 1 :
    key === 'ArrowRight' ? index + 1 :
    key === 'ArrowUp' ? index - columns :
    index + columns;

  if (target < 0 || target >= items.length) return false;
  items[target].focus();
  items[target].scrollIntoView({ block: 'nearest' });
  return true;
}

export function onGridKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  if (!ARROWS.has(e.key)) return;
  const current = (e.target as HTMLElement).closest<HTMLElement>('[data-nav-item]');
  if (!current) return;
  if (moveInGrid(e.currentTarget, current, e.key)) e.preventDefault();
}

/** Fire a real key event at whatever has focus, so pad and keyboard share one code path. */
function sendKey(key: string) {
  const target = (document.activeElement as HTMLElement | null) || document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function focusFirstItem() {
  const first = document.querySelector<HTMLElement>('main [data-nav-item]');
  first?.focus();
}

export function useGamepadNavigation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator.getGamepads !== 'function') return;

    let frame = 0;
    const held = new Map<string, number>();
    const REPEAT_DELAY = 380;
    const REPEAT_RATE = 120;

    const press = (name: string, down: boolean, action: () => void) => {
      const now = performance.now();
      if (!down) return void held.delete(name);
      const since = held.get(name);
      if (since === undefined) {
        held.set(name, now);
        action();
      } else if (now - since > REPEAT_DELAY) {
        held.set(name, now - REPEAT_DELAY + REPEAT_RATE);
        action();
      }
    };

    const arrow = (key: string) => () => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) return focusFirstItem();
      sendKey(key);
    };

    const tick = () => {
      const pad = Array.from(navigator.getGamepads()).find(Boolean);
      if (pad) {
        const b = (i: number) => !!pad.buttons[i]?.pressed;
        const [x = 0, y = 0] = pad.axes;
        press('up', b(12) || y < -0.6, arrow('ArrowUp'));
        press('down', b(13) || y > 0.6, arrow('ArrowDown'));
        press('left', b(14) || x < -0.6, arrow('ArrowLeft'));
        press('right', b(15) || x > 0.6, arrow('ArrowRight'));
        press('a', b(0), () => (document.activeElement as HTMLElement | null)?.click());
        press('b', b(1), () => window.history.back());
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!Array.from(navigator.getGamepads()).some(Boolean)) cancelAnimationFrame(frame);
    };

    // Poll only while a pad is connected
    if (Array.from(navigator.getGamepads()).some(Boolean)) start();
    window.addEventListener('gamepadconnected', start);
    window.addEventListener('gamepaddisconnected', stop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('gamepadconnected', start);
      window.removeEventListener('gamepaddisconnected', stop);
    };
  }, [enabled]);
}
