import type { PR, PRFunc } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import { createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createDefaultCollectionsForUser } from './createDefaultCollectionsForUser.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

/** Ignores conflicts if some of the structure already exists */
export const createInitialSyncableStoreStructureForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    await allResultsMappedSkipFailures(
      trace,
      [
        // Mail Storage Folder
        (trace) => createFolderAtPath(trace, syncableStore, paths.storage.value),
        // Mail Out Folder
        (trace) => createFolderAtPath(trace, syncableStore, paths.out.value),
        // Mail Drafts Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.drafts.value),
        // Mail Indexes Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.indexes.value),
        // Mail Email Ids by Message Id Index Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.indexes.mailIdsByMessageIdIndex),
        // Mail Threads Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.threads),
        // Creating default collections
        (trace) => createDefaultCollectionsForUser(trace, syncableStore)
      ] satisfies Array<PRFunc<unknown, 'conflict' | 'not-found' | 'wrong-type' | 'untrusted' | 'deleted'>>,
      {
        _successType: Cast<unknown>(),
        skipErrorCodes: ['conflict'],
        maxConcurrency: 1
      },
      (trace, step) => step(trace)
    );

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'conflict' }
);
