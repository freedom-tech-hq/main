import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { storageRootIdInfo } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from './getFsRootPathForStorageRootId.ts';

export const getSyncableStoreBackingForUserEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }) => {
    const storageRootId = storageRootIdInfo.make(userId);

    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    return makeSuccess(storeBacking);
  }
);
