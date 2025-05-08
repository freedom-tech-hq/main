import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { encName } from 'freedom-sync-types';
import { getOrCreateBundlesAtPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

/** Ignores conflicts if some of the structure already exists */
export const createDefaultCollectionsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    const createdAllCollectionsBundles = await allResultsMapped(
      trace,
      mailCollectionTypes,
      {},
      async (trace, collectionType) =>
        await getOrCreateBundlesAtPaths(
          trace,
          syncableStore,
          [paths.collections.value, { name: encName('collections') }],
          [paths.collections[collectionType].value, { name: encName(collectionType) }]
        )
    );
    if (!createdAllCollectionsBundles.ok) {
      return generalizeFailureResult(trace, createdAllCollectionsBundles, [
        'deleted',
        'format-error',
        'not-found',
        'untrusted',
        'wrong-type'
      ]);
    }

    return makeSuccess(undefined);
  }
);
