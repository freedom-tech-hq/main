import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createDefaultCollectionsForUser } from './createDefaultCollectionsForUser.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const createInitialSyncableStoreStructureForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const paths = await getUserMailPaths(syncableStore);

    // Mail Storage Folder
    const mailStorageBundle = await createFolderAtPath(trace, syncableStore, paths.storage.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Out Folder
    const mailOutFolder = await createFolderAtPath(trace, syncableStore, paths.out.value);
    if (!mailOutFolder.ok) {
      return generalizeFailureResult(trace, mailOutFolder, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Drafts Bundle
    const mailDraftsBundle = await createBundleAtPath(trace, syncableStore, paths.drafts.value);
    if (!mailDraftsBundle.ok) {
      return generalizeFailureResult(trace, mailDraftsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Indexes Bundle
    const mailIndexesBundle = await createBundleAtPath(trace, syncableStore, paths.indexes.value);
    if (!mailIndexesBundle.ok) {
      return generalizeFailureResult(trace, mailIndexesBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Email Ids by Message Id Index Bundle
    const mailIdsByMessageIdIndexBundle = await createBundleAtPath(trace, syncableStore, paths.indexes.mailIdsByMessageIdIndex);
    if (!mailIdsByMessageIdIndexBundle.ok) {
      return generalizeFailureResult(trace, mailIdsByMessageIdIndexBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Threads Bundle
    const mailThreadsBundle = await createBundleAtPath(trace, syncableStore, paths.threads);
    if (!mailThreadsBundle.ok) {
      return generalizeFailureResult(trace, mailThreadsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Creating default collections
    const createdDefaultCollections = await createDefaultCollectionsForUser(trace, syncableStore);
    if (!createdDefaultCollections.ok) {
      return createdDefaultCollections;
    }

    return makeSuccess(undefined);
  }
);
