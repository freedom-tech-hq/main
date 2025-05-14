import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';
import { type LocalItemMetadata, type SyncableId } from 'freedom-sync-types';

import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';
import { getLockStore } from './getLockStore.ts';
import { readMetadataFile } from './readMetadataFile.ts';
import { writeMetadataFile } from './writeMetadataFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadataChanges: Partial<LocalItemMetadata>): PR<undefined> => {
    const lockStore = getLockStore();

    const filePath = getFsPathForMetadataFile(rootPath, ids);

    const completed = await withAcquiredLock(trace, lockStore.lock(filePath), {}, async (trace): PR<undefined> => {
      const metadata = await readMetadataFile(trace, filePath);
      if (!metadata.ok) {
        return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
      }

      const wrote = await writeMetadataFile(trace, filePath, { ...metadata.value, ...metadataChanges });
      if (!wrote.ok) {
        return wrote;
      }

      return makeSuccess(undefined);
    });
    if (!completed.ok) {
      return generalizeFailureResult(trace, completed, 'lock-timeout');
    }

    return makeSuccess(undefined);
  }
);
