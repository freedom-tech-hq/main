import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';
import { parse, stringify } from 'freedom-serialization';
import { type LocalItemMetadata, mergeLocalItemMetadata, type SyncablePath } from 'freedom-sync-types';
import { syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';

import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';
import { getFileHandleForDirectoryHandleAndFilename } from './getFileHandleForDirectoryHandleAndFilename.ts';
import { getLockStore } from './getLockStore.ts';
import { readTextFile } from './readTextFile.ts';
import { writeTextFile } from './writeTextFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    metadataChanges: Partial<LocalItemMetadata>
  ): PR<undefined, 'not-found'> => {
    const lockStore = getLockStore();

    const dirAndFilename = await getDirectoryHandleAndFilenameForMetadataFile(trace, rootHandle, path);
    if (!dirAndFilename.ok) {
      return dirAndFilename;
    }

    const { dir, filename, metaFileLockKey } = dirAndFilename.value;

    const fileHandle = await getFileHandleForDirectoryHandleAndFilename(trace, dir, filename);
    if (!fileHandle.ok) {
      return fileHandle;
    }

    const completed = await withAcquiredLock(trace, lockStore.lock(metaFileLockKey), {}, async (trace): PR<undefined> => {
      const metadataJsonString = await readTextFile(trace, fileHandle.value, { lockKey: metaFileLockKey });
      if (!metadataJsonString.ok) {
        return generalizeFailureResult(trace, metadataJsonString, 'format-error');
      }

      const metadata = await parse(trace, metadataJsonString.value, syncableStoreBackingItemMetadataSchema);
      if (!metadata.ok) {
        return metadata;
      }

      mergeLocalItemMetadata(metadata.value, metadataChanges);

      const outMetadataJsonString = await stringify(trace, metadata.value, syncableStoreBackingItemMetadataSchema);
      if (!outMetadataJsonString.ok) {
        return outMetadataJsonString;
      }

      const wrote = await writeTextFile(trace, fileHandle.value, { lockKey: metaFileLockKey, stringValue: outMetadataJsonString.value });
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
