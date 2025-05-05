import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getOrCreateBundlesAtPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const createDefaultCollectionsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    const createdAllCollectionsBundles = await allResultsMapped(
      trace,
      mailCollectionTypes,
      {},
      async (trace, collectionType) =>
        await getOrCreateBundlesAtPaths(trace, syncableStore, paths.collections.value, paths.collections[collectionType].value)
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
