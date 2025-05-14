import type { PR, PRFunc } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import { encName } from 'freedom-sync-types';
import { createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';
import { ACCESS_CONTROL_BUNDLE_ID, type MutableSyncableStore, type SyncableStore } from 'freedom-syncable-store-types';
import { merge } from 'lodash-es';

import { createDefaultCollectionsForUser } from './createDefaultCollectionsForUser.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

const getGlobPatterns = async (syncableStore: SyncableStore): Promise<{ include: string[]; exclude?: string[] }> => {
  const paths = await getUserMailPaths(syncableStore);

  const include: string[] = [];
  const exclude: string[] = [];

  include.push(paths.storage.value.toRelativePathString(syncableStore.path));
  include.push(`${paths.storage.value.append(ACCESS_CONTROL_BUNDLE_ID).toRelativePathString(syncableStore.path)}/**`);

  include.push(paths.out.value.toRelativePathString(syncableStore.path));
  include.push(`${paths.out.value.append(ACCESS_CONTROL_BUNDLE_ID).toRelativePathString(syncableStore.path)}/**`);

  include.push(paths.drafts.value.toRelativePathString(syncableStore.path));
  include.push(paths.indexes.value.toRelativePathString(syncableStore.path));
  include.push(paths.indexes.mailIdsByMessageIdIndex.toRelativePathString(syncableStore.path));
  include.push(paths.threads.toRelativePathString(syncableStore.path));
  include.push(paths.routeProcessing.value.toRelativePathString(syncableStore.path));

  const createDefaultCollectionsForUserGlobPatterns = await createDefaultCollectionsForUser.getGlobPatterns(syncableStore);
  include.push(...createDefaultCollectionsForUserGlobPatterns.include);
  exclude.push(...(createDefaultCollectionsForUserGlobPatterns.exclude ?? []));

  return { include, exclude };
};

/** Ignores conflicts if some of the structure already exists */
export const createInitialSyncableStoreStructureForUser = merge(
  makeAsyncResultFunc(
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
          // Route Processing
          (trace) => createBundleAtPath(trace, syncableStore, paths.routeProcessing.value, { name: encName('routeProcessing') }),
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
      if (!created.ok) {
        return generalizeFailureResult(trace, created, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      return makeSuccess(undefined);
    },
    { deepDisableLam: 'conflict' }
  ),
  { getGlobPatterns }
);
