import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { StructHashes, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { disableSyncableValidation, findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { insertIntoStructHashes } from '../internal/utils/struct-hashes/insertIntoStructHashes.ts';

export const getLocalHashesRelativeToBasePathWithGlob = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { basePath, glob }: { basePath: SyncablePath; glob: SyncGlob }): PR<StructHashes> => {
    const hashes: StructHashes = {};

    // not-found is expected when we're pulling content for a basePath that doesn't exist locally yet
    const baseMetadata = await disableLam('not-found', getMetadataAtPath)(trace, store, basePath);
    /* node:coverage disable */
    if (!baseMetadata.ok) {
      if (baseMetadata.value.errorCode === 'not-found') {
        return makeSuccess({});
      }
      return generalizeFailureResult(trace, excludeFailureResult(baseMetadata, 'not-found'), ['untrusted', 'wrong-type']);
    }
    /* node:coverage enable */

    hashes.hash = baseMetadata.value.hash;

    const found = await disableSyncableValidation(findSyncables)(trace, store, { basePath, glob });
    /* node:coverage disable */
    if (!found.ok) {
      return generalizeFailureResult(trace, found, 'not-found');
    }
    /* node:coverage enable */

    const inserted = await allResultsMapped(trace, found.value, {}, async (trace, item) => {
      const metadata = await getMetadataAtPath(trace, store, item.path);
      if (metadata.ok) {
        insertIntoStructHashes(hashes, basePath, item.path, metadata.value.hash);
      }

      return makeSuccess(undefined);
    });
    /* node:coverage disable */
    if (!inserted.ok) {
      return inserted;
    }
    /* node:coverage enable */

    return makeSuccess(hashes);
  }
);
