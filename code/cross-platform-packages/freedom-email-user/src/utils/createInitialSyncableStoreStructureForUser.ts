import type { PR, PRFunc } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import { encName } from 'freedom-sync-types';
import { createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createDefaultCollectionsForUser } from './createDefaultCollectionsForUser.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

/** Ignores conflicts if some of the structure already exists */
export const createInitialSyncableStoreStructureForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    const created = await allResultsMappedSkipFailures(
      trace,
      [
        // Mail Storage Folder
        (trace) => createFolderAtPath(trace, syncableStore, paths.storage.value, { name: encName('storage') }),
        // Mail Out Folder
        (trace) => createFolderAtPath(trace, syncableStore, paths.out.value, { name: encName('out') }),
        // Mail Drafts Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.drafts.value, { name: encName('drafts') }),
        // Mail Indexes Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.indexes.value, { name: encName('indexes') }),
        // Mail Email Ids by Message Id Index Bundle
        (trace) =>
          createBundleAtPath(trace, syncableStore, paths.indexes.mailIdsByMessageIdIndex, { name: encName('mailIdsByMessageIdIndex') }),
        // Mail Threads Bundle
        (trace) => createBundleAtPath(trace, syncableStore, paths.threads, { name: encName('threads') }),
        // Creating default collections
        (trace) => createDefaultCollectionsForUser(trace, syncableStore),
        // Route Processing
        (trace) => createBundleAtPath(trace, syncableStore, paths.routeProcessing.value, { name: encName('routeProcessing') })
      ] satisfies Array<PRFunc<unknown, 'conflict' | 'not-found' | 'wrong-type' | 'untrusted' | 'deleted'>>,
      {
        _successType: Cast<unknown>(),
        skipErrorCodes: ['conflict'],
        maxConcurrency: 1
      },
      (trace, step) => step(trace)
    );
    if (!created.ok) {
      return generalizeFailureResult(trace, created, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'conflict' }
);
