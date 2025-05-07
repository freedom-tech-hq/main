import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { InSyncFolder, OutOfSyncFolder, SyncableId, SyncablePath, SyncBatchContents, SyncStrategy } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncBatchContentsForPath } from '../../internal/utils/getSyncBatchContentsForPath.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

// TODO: reenable validation in a smarter way
export const pullFolder = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace: Trace,
      store: SyncableStore,
      { hash: downstreamHash, path, strategy }: { path: SyncablePath; hash?: Sha256Hash; strategy: SyncStrategy }
    ): PR<InSyncFolder | OutOfSyncFolder, 'not-found'> => {
      const folder = await getSyncableAtPath(trace, store, path, 'folder');
      if (!folder.ok) {
        return generalizeFailureResult(trace, folder, ['untrusted', 'wrong-type']);
      }

      const hash = await folder.value.getHash(trace);
      if (!hash.ok) {
        return hash;
      }

      if (hash.value === downstreamHash) {
        return makeSuccess({ type: 'folder', outOfSync: false } satisfies InSyncFolder);
      }

      const metadata = await folder.value.getMetadata(trace);
      if (!metadata.ok) {
        return metadata;
      }

      const metadataById = await folder.value.getMetadataById(trace);
      if (!metadataById.ok) {
        return metadataById;
      }

      const hashesById = objectEntries(metadataById.value).reduce(
        (out, [id, metadata]) => {
          if (metadata === undefined) {
            return out;
          }

          out[id] = metadata.hash;

          return out;
        },
        {} as Partial<Record<SyncableId, Sha256Hash>>
      );

      let batchContents: SyncBatchContents | undefined;
      switch (strategy) {
        case 'default':
          break; // Nothing special to do
        case 'batch': {
          // Loading batches is always best effort
          const loaded = await getSyncBatchContentsForPath(trace, store, path);
          if (loaded.ok) {
            batchContents = loaded.value;
          }
        }
      }

      return makeSuccess({
        type: 'folder',
        outOfSync: true,
        hashesById,
        metadata: metadata.value,
        batchContents
      } satisfies OutOfSyncFolder);
    }
  ),
  { deepDisableLam: 'not-found' }
);
