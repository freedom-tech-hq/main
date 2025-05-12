import { allResultsMapped, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { StructHashes, SyncableId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

export const getLocalHashesRelativeToBasePathWithGlob = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { basePath, glob }: { basePath: SyncablePath; glob: SyncGlob }): PR<StructHashes> => {
    const hashes: StructHashes = {};

    const found = await findSyncables(trace, store, { basePath, glob });
    if (!found.ok) {
      return generalizeFailureResult(trace, found, 'not-found');
    }

    const insertIntoStructHashesWithRelativeIds = (
      hashes: StructHashes,
      relativeIds: SyncableId[],
      relativeIdsOffset: number,
      hash: Sha256Hash
    ) => {
      if (relativeIdsOffset === relativeIds.length - 1) {
        hashes.hash = hash;
        return;
      }

      const id = relativeIds[relativeIdsOffset];
      if (hashes.contents === undefined) {
        hashes.contents = {};
      }
      if (hashes.contents[id] === undefined) {
        hashes.contents[id] = {};
      }

      insertIntoStructHashesWithRelativeIds(hashes.contents[id], relativeIds, relativeIdsOffset + 1, hash);
    };

    const insertIntoStructHashes = (hashes: StructHashes, basePath: SyncablePath, itemPath: SyncablePath, hash: Sha256Hash) => {
      const relativeIds = itemPath.relativeTo(basePath);
      if (relativeIds !== undefined) {
        insertIntoStructHashesWithRelativeIds(hashes, relativeIds, 0, hash);
      }
    };

    const inserted = await allResultsMapped(trace, found.value, {}, async (trace, item) => {
      const metadata = await getMetadataAtPath(trace, store, item.path);
      if (metadata.ok) {
        insertIntoStructHashes(hashes, basePath, item.path, metadata.value.hash);
      }

      return makeSuccess(undefined);
    });
    if (!inserted.ok) {
      return inserted;
    }

    return makeSuccess(hashes);
  }
);
