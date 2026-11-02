import React, { useEffect, useMemo, useState } from 'react';
import { LibraryEntry, formatWhen } from '../lib/library';
import { useLibrary } from '../lib/libraryContext';
import { hrefFor } from '../lib/router';
import { onGridKeyDown } from '../lib/navigation';
import { GameCard } from './GameCard';
import { CARD_GRID, EmptyBlock } from './Section';

/** One of the player's collections: its games, and renaming, removing and deleting. */
export function CollectionView({ id }: { id: string }) {
  const { collections, byKey, steam, currentUser, openAccount, renameCollection, setCollectionKeys, deleteCollection } = useLibrary();
  const collection = collections.find(c => c.id === id);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRenaming(false);
    setConfirmDelete(false);
    setError('');
  }, [id]);

  const entries = useMemo(
    () => (collection ? (collection.keys.map(k => byKey.get(k)).filter(Boolean) as LibraryEntry[]) : []),
    [collection, byKey]
  );
  // Steam games are only known once the Steam library has loaded; say how many are waiting
  const waitingOnSteam = collection ? collection.keys.filter(k => k.startsWith('steam:') && !byKey.has(k)).length : 0;

  if (!currentUser) {
    return (
      <div>
        <h1 className="text-[20px] font-semibold">Collections</h1>
        <div className="mt-6">
          <EmptyBlock action={<button type="button" onClick={openAccount} className="btn-ghost h-9 px-4 text-[13px]">Sign in</button>}>
            Collections are kept on your account. Sign in to see them.
          </EmptyBlock>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div>
        <h1 className="text-[20px] font-semibold">Collection not found</h1>
        <div className="mt-6">
          <EmptyBlock action={<a href={hrefFor({ name: 'library', tab: 'all' })} className="btn-ghost h-9 px-4 text-[13px]">Open the library</a>}>
            This collection is not on your account. It may have been deleted.
          </EmptyBlock>
        </div>
      </div>
    );
  }

  const run = async (work: () => Promise<void>) => {
    setError('');
    try {
      await work();
    } catch (err: any) {
      setError(err?.message || 'That did not save. Try again.');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {renaming ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={e => {
                e.preventDefault();
                run(async () => {
                  await renameCollection(collection.id, name);
                  setRenaming(false);
                });
              }}
            >
              <label htmlFor="collection-name" className="sr-only">Collection name</label>
              <input
                id="collection-name"
                autoFocus
                value={name}
                maxLength={60}
                onChange={e => setName(e.target.value)}
                className="field h-9 w-[280px] max-w-full px-3 text-[14px]"
              />
              <button type="submit" className="btn-ghost h-9 px-4 text-[13px]" disabled={!name.trim()}>Save</button>
              <button type="button" onClick={() => setRenaming(false)} className="btn-quiet h-9 px-3 text-[13px]">Cancel</button>
            </form>
          ) : (
            <h1 className="truncate text-[20px] font-semibold">{collection.name}</h1>
          )}
          <p className="mt-1 text-[14px] text-muted">
            {collection.keys.length.toLocaleString()} {collection.keys.length === 1 ? 'game' : 'games'} · changed {formatWhen(collection.updatedAt)?.toLowerCase()}
          </p>
        </div>
        {!renaming && !confirmDelete && (
          <div className="flex flex-none gap-2">
            <button
              type="button"
              onClick={() => {
                setName(collection.name);
                setRenaming(true);
              }}
              className="btn-ghost h-9 px-4 text-[13px]"
            >
              Rename
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger h-9 px-4 text-[13px]">
              Delete
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="mt-5 flex flex-col gap-3 bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="alertdialog" aria-labelledby="delete-question">
          <p id="delete-question" className="text-[14px]">
            Delete “{collection.name}”? The games stay in your library; only this list goes.
          </p>
          <div className="flex flex-none gap-2">
            <button
              type="button"
              autoFocus
              onClick={() =>
                run(async () => {
                  await deleteCollection(collection.id);
                  window.location.hash = hrefFor({ name: 'library', tab: 'all' });
                })
              }
              className="btn-danger h-9 px-4 text-[13px]"
            >
              Delete collection
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost h-9 px-4 text-[13px]">Keep it</button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-[13px] text-accent-lit">{error}</p>}

      <div className="mt-8">
        {entries.length === 0 && waitingOnSteam === 0 ? (
          <EmptyBlock>No games in this collection yet. Open any game and use Add to collection.</EmptyBlock>
        ) : (
          <div className={CARD_GRID} onKeyDown={onGridKeyDown}>
            {entries.map(entry => (
              <GameCard
                key={entry.key}
                entry={entry}
                action={{
                  label: 'Remove',
                  onClick: () => run(() => setCollectionKeys(collection.id, collection.keys.filter(k => k !== entry.key)))
                }}
              />
            ))}
          </div>
        )}
        {waitingOnSteam > 0 && (
          <p className="mt-6 text-[13px] text-faint">
            {waitingOnSteam} Steam {waitingOnSteam === 1 ? 'game appears' : 'games appear'} here once your Steam library loads
            {steam.status === 'needs-key' || steam.status === 'error' ? ', which it cannot right now.' : '.'}
          </p>
        )}
      </div>
    </div>
  );
}
