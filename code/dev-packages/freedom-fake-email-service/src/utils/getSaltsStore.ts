import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { InMemoryObjectStore, type MutableObjectStore } from 'freedom-object-store-types';
import type { SaltsById, StorageRootId } from 'freedom-sync-types';
import { saltsByIdSchema } from 'freedom-sync-types';

const secretKey = makeUuid();

export const getSaltsStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce(
      [import.meta.filename],
      secretKey,
      async (_trace): PR<MutableObjectStore<StorageRootId, SaltsById>> =>
        makeSuccess(new InMemoryObjectStore<StorageRootId, SaltsById>({ schema: saltsByIdSchema }))
    )
);
