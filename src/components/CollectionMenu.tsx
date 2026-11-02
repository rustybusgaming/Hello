import React, { useEffect, useRef, useState } from 'react';
import { Check, FolderPlus } from 'lucide-react';
import { useLibrary } from '../lib/libraryContext';

/**
 * "Add to collection" on a game's page: a menu of the player's collections with a tick on
 * those holding this game, and a field to start a new one with it. Collections live on the
 * account, so signed out it opens sign-in instead.
 */
export function CollectionMenu({ entryKey }: { entryKey: string }) {
  const { collections, currentUser, openAccount, createCollection, setCollectionKeys } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Close on a click elsewhere or Escape, and give focus back to the button
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const inCount = collections.filter(c => c.keys.includes(entryKey)).length;

  const toggle = async (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (!collection) return;
    setBusy(id);
    setError('');
    try {
      const keys = collection.keys.includes(entryKey) ? collection.keys.filter(k => k !== entryKey) : [...collection.keys, entryKey];
      await setCollectionKeys(id, keys);
    } catch (err: any) {
      setError(err?.message || 'That did not save.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => (currentUser ? setOpen(o => !o) : openAccount())}
        aria-expanded={open}
                className="btn-ghost h-11 px-4 text-[14px]"
        title={currentUser ? undefined : 'Collections are kept on your account'}
      >
        <FolderPlus className="h-4 w-4" aria-hidden />
        {inCount ? `In ${inCount} ${inCount === 1 ? 'collection' : 'collections'}` : 'Add to collection'}
      </button>

      {open && (
        <div
          role="group"
          aria-label="Collections"
          className="absolute left-0 top-full z-30 mt-2 w-[300px] max-w-[calc(100vw-32px)] origin-top-left border border-rule bg-shade shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
        >
          {collections.length > 0 && (
            <ul className="max-h-[260px] overflow-y-auto py-1">
              {collections.map(c => {
                const has = c.keys.includes(entryKey);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={has}
                      disabled={busy === c.id}
                      onClick={() => toggle(c.id)}
                      className="flex h-10 w-full items-center gap-3 px-4 text-left text-[14px] text-ink transition-colors duration-150 hover:bg-[#2c2a28] disabled:opacity-60"
                    >
                      <span className={`flex h-4 w-4 flex-none items-center justify-center border ${has ? 'border-ink bg-ink text-ground' : 'border-control'}`}>
                        {has && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-[12px] tabular-nums text-faint">{c.keys.length}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <form
            className={`flex gap-2 p-3 ${collections.length ? 'border-t border-hair' : ''}`}
            onSubmit={async e => {
              e.preventDefault();
              if (!name.trim()) return;
              setBusy('new');
              setError('');
              try {
                await createCollection(name, [entryKey]);
                setName('');
              } catch (err: any) {
                setError(err?.message || 'That did not save.');
              } finally {
                setBusy(null);
              }
            }}
          >
            <label htmlFor={`new-collection-${entryKey}`} className="sr-only">New collection name</label>
            <input
              id={`new-collection-${entryKey}`}
              value={name}
              maxLength={60}
              onChange={e => setName(e.target.value)}
              placeholder="New collection"
              className="field h-9 min-w-0 flex-1 px-3 text-[13px]"
              autoFocus={collections.length === 0}
            />
            <button type="submit" disabled={!name.trim() || busy === 'new'} className="btn-ghost h-9 flex-none px-3 text-[13px]">
              Create
            </button>
          </form>
          {error && <p role="alert" className="px-4 pb-3 text-[12px] text-accent-lit">{error}</p>}
        </div>
      )}
    </div>
  );
}
