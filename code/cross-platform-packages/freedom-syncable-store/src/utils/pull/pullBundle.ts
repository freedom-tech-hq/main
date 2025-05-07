import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { InSyncBundle, OutOfSyncBundle, SyncableId, SyncablePath, SyncBatchContents, SyncStrategy } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncBatchContentsForPath } from '../../internal/utils/getSyncBatchContentsForPath.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

// TODO: reenable validation in a smarter way
export const pullBundle = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace: Trace,
      store: SyncableStore,
      { hash: downstreamHash, path, strategy }: { path: SyncablePath; hash?: Sha256Hash; strategy: SyncStrategy }
    ): PR<InSyncBundle | OutOfSyncBundle, 'not-found'> => {
      const bundle = await getSyncableAtPath(trace, store, path, 'bundle');
      if (!bundle.ok) {
        return generalizeFailureResult(trace, bundle, ['untrusted', 'wrong-type']);
      }

      const hash = await bundle.value.getHash(trace);
      if (!hash.ok) {
        return hash;
      }

      if (hash.value === downstreamHash) {
        return makeSuccess({ type: 'bundle', outOfSync: false } satisfies InSyncBundle);
      }

      const metadata = await bundle.value.getMetadata(trace);
      if (!metadata.ok) {
        return metadata;
      }

      const metadataById = await bundle.value.getMetadataById(trace);
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
        type: 'bundle',
        outOfSync: true,
        hashesById,
        metadata: metadata.value,
        batchContents
      } satisfies OutOfSyncBundle);
    }
  ),
  { deepDisableLam: 'not-found' }
);
