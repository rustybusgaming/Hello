import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StoreDetails } from '../types';
import { StoreLoad } from '../lib/useStoreDetails';

/**
 * Pieces of a game page drawn from the Steam store. The store is an extra: every piece says
 * where its words come from, says plainly when the store has nothing, and the page around it
 * never waits on it.
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Whether a store page is really about this catalogue game. The catalogue takes its art from
 * Steam app ids, and one of them pointed at an unrelated DLC; a store page is only shown
 * when it is a game and its name and the catalogue's agree.
 */
export function storeMatches(title: string, details: StoreDetails): boolean {
  if (details.type !== 'game') return false;
  const a = norm(details.name);
  const b = norm(title);
  return !!a && !!b && (a.includes(b) || b.includes(a));
}

export function platformList(p: StoreDetails['platforms']): string {
  return [p.windows && 'Windows', p.mac && 'macOS', p.linux && 'Linux'].filter(Boolean).join(', ') || '—';
}

/** One plain sentence for each way the store can have nothing to say. */
export function storeNote(load: StoreLoad | null): string | null {
  if (!load || load.status === 'loading') return 'Loading from the Steam store…';
  if (load.status === 'refused') return 'The Steam store details are not available right now.';
  const { result } = load;
  if (result.state === 'missing') return 'The Steam store has no page for this game any more.';
  if (result.state === 'unavailable') return 'The Steam store did not answer, so there is no description right now.';
  return null;
}

/** "From the Steam store", with the date when an older copy is showing because Steam is quiet. */
export function StoreCredit({ load }: { load: StoreLoad | null }) {
  if (!load || load.status !== 'done' || !load.result.details) return null;
  const { stale, fetchedAt } = load.result;
  return (
    <p className="mt-3 text-[12px] text-faint">
      From the Steam store
      {stale && fetchedAt ? `, as of ${new Date(fetchedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}.
    </p>
  );
}

/** A strip of the store's screenshots; any of them opens full size. */
/** `inColumn`: two across, for a screenshot block that shares a row with the details list. */
export function Screenshots({ details, inColumn = false }: { details: StoreDetails; inColumn?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  // Beside the details list, one row of two keeps the row level; the viewer holds them all
  const shots = details.screenshots.slice(0, inColumn ? 2 : 4);
  if (!shots.length) return null;

  return (
    <section aria-labelledby="shots-heading" className={inColumn ? '' : 'lg:col-span-6'}>
      <h2 id="shots-heading" className="mb-3 text-[16px] font-semibold">Screenshots</h2>
      <ul className={`grid grid-cols-2 gap-[14px] ${inColumn ? '' : 'md:grid-cols-4'}`}>
        {shots.map((shot, i) => (
          // Two on a phone: the first pair, so the row never ends on one
          <li key={shot.full} className={i >= 2 && !inColumn ? 'hidden md:block' : i >= 2 ? 'hidden sm:block' : ''}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block aspect-video w-full overflow-hidden bg-shade outline-none"
              aria-label={`Screenshot ${i + 1} of ${shots.length}, full size`}
            >
              <img
                src={shot.thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover outline outline-1 outline-transparent transition-[outline-color] duration-150 group-hover:outline-control group-focus-visible:outline-2 group-focus-visible:outline-accent"
              />
            </button>
          </li>
        ))}
      </ul>
      {details.screenshots.length > shots.length && (
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="mt-3 text-[13px] font-semibold text-muted underline decoration-control underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          All {details.screenshots.length} screenshots
        </button>
      )}
      {open !== null && <Lightbox shots={details.screenshots} start={open} title={details.name} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** Full-size screenshots: arrows to move, Escape to close, focus kept inside. */
function Lightbox({
  shots,
  start,
  title,
  onClose
}: {
  shots: StoreDetails['screenshots'];
  start: number;
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(document.activeElement);
  const move = useCallback((by: number) => setIndex(i => (i + by + shots.length) % shots.length), [shots.length]);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = opener.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      (previous as HTMLElement | null)?.focus?.();
    };
  }, [move, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshots`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-14 flex-none items-center justify-between px-4">
        <p className="text-[13px] tabular-nums text-muted">
          {title} · {index + 1} of {shots.length}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className="btn-quiet h-10 w-10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
        <img src={shots[index].full} alt={`${title}, screenshot ${index + 1}`} className="max-h-full max-w-full object-contain" />
        {shots.length > 1 && (
          <>
            <button type="button" onClick={() => move(-1)} className="btn-quiet absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2" aria-label="Previous screenshot">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => move(1)} className="btn-quiet absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2" aria-label="Next screenshot">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
