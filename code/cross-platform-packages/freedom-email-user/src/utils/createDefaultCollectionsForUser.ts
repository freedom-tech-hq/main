import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { encName } from 'freedom-sync-types';
import { getOrCreateBundleAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore, SyncableStore } from 'freedom-syncable-store-types';
import { merge } from 'lodash-es';

import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

const getGlobPatterns = async (syncableStore: SyncableStore): Promise<{ include: string[]; exclude?: string[] }> => {
  const paths = await getUserMailPaths(syncableStore);

  const include: string[] = [];

  include.push(paths.collections.value.toRelativePathString(syncableStore.path));

  for (const collectionType of mailCollectionTypes) {
    include.push(paths.collections[collectionType].value.toRelativePathString(syncableStore.path));
  }

  return { include };
};

/** Ignores conflicts if some of the structure already exists */
export const createDefaultCollectionsForUser = merge(
  makeAsyncResultFunc([import.meta.filename], async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    const createdCollectionsBundle = await getOrCreateBundleAtPath(trace, syncableStore, paths.collections.value, {
      name: encName('collections')
    });
    if (!createdCollectionsBundle.ok) {
      return generalizeFailureResult(trace, createdCollectionsBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const createdAllCollectionsBundles = await allResultsMapped(
      trace,
      mailCollectionTypes,
      {},
      async (trace, collectionType) =>
        await getOrCreateBundleAtPath(trace, syncableStore, paths.collections[collectionType].value, { name: encName(collectionType) })
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
  }),
  { getGlobPatterns }
);
