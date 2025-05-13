import { allResultsMapped, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { StructHashes, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { insertIntoStructHashes } from './struct-hashes/insertIntoStructHashes.ts';

export const getLocalHashesRelativeToBasePathWithGlob = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { basePath, glob }: { basePath: SyncablePath; glob: SyncGlob }): PR<StructHashes, 'not-found'> => {
    const hashes: StructHashes = {};

    const baseMetadata = await getMetadataAtPath(trace, store, basePath);
    if (!baseMetadata.ok) {
      return generalizeFailureResult(trace, baseMetadata, ['untrusted', 'wrong-type']);
    }

    hashes.hash = baseMetadata.value.hash;

    const found = await findSyncables(trace, store, { basePath, glob });
    if (!found.ok) {
      return generalizeFailureResult(trace, found, 'not-found');
    }

    const inserted = await allResultsMapped(trace, found.value, {}, async (trace, item) => {
      const metadata = await getMetadataAtPath(trace, store, item.path);
      if (metadata.ok) {
        insertIntoStructHashes(basePath, item.path, metadata.value.hash, hashes);
      }

      return makeSuccess(undefined);
    });
    if (!inserted.ok) {
      return inserted;
    }

    return makeSuccess(hashes);
  }
);
