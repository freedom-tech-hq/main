import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { createBundleAtPath, createFolderAtPath } from 'freedom-syncable-store';

import { createDefaultCollectionsForUser } from './createDefaultCollectionsForUser.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const createInitialSyncableStoreStructureForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess): PR<undefined> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    // Mail Storage Folder
    const mailStorageBundle = await createFolderAtPath(trace, userFs, paths.storage.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Out Folder
    const mailOutFolder = await createFolderAtPath(trace, userFs, paths.out.value);
    if (!mailOutFolder.ok) {
      return generalizeFailureResult(trace, mailOutFolder, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Collections Bundle
    const mailCollectionsBundle = await createBundleAtPath(trace, userFs, paths.collections.value);
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Drafts Bundle
    const mailDraftsBundle = await createBundleAtPath(trace, userFs, paths.drafts.value);
    if (!mailDraftsBundle.ok) {
      return generalizeFailureResult(trace, mailDraftsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Indexes Bundle
    const mailIndexesBundle = await createBundleAtPath(trace, userFs, paths.indexes.value);
    if (!mailIndexesBundle.ok) {
      return generalizeFailureResult(trace, mailIndexesBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Email Ids by Message Id Index Bundle
    const mailIdsByMessageIdIndexBundle = await createBundleAtPath(trace, userFs, paths.indexes.mailIdsByMessageIdIndex);
    if (!mailIdsByMessageIdIndexBundle.ok) {
      return generalizeFailureResult(trace, mailIdsByMessageIdIndexBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Threads Bundle
    const mailThreadsBundle = await createBundleAtPath(trace, userFs, paths.threads);
    if (!mailThreadsBundle.ok) {
      return generalizeFailureResult(trace, mailThreadsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Creating default collections
    const createdDefaultCollections = await createDefaultCollectionsForUser(trace, access);
    if (!createdDefaultCollections.ok) {
      return createdDefaultCollections;
    }

    return makeSuccess(undefined);
  }
);
