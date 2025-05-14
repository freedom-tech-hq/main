import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { pullFromLocal } from 'freedom-local-sync';
import type { PullOutOfSyncFile, RemoteId, SyncablePath, SyncGlob, SyncPushArgs } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import { disableSyncableValidation, findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../types/RemoteSyncService.ts';
import { organizeSyncablesForPushRequest } from './organizeSyncablesForPushRequest.ts';

export const getSyncPushArgsForGlob = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
    {
      remoteId,
      basePath,
      glob
    }: {
      remoteId: RemoteId;
      basePath: SyncablePath;
      glob: SyncGlob;
    }
  ): PR<SyncPushArgs, 'not-found'> => {
    const itemType = extractSyncableItemTypeFromPath(basePath);
    switch (itemType) {
      case 'bundle':
      case 'folder': {
        const found = await disableSyncableValidation(findSyncables)(trace, store, { basePath, glob });
        if (!found.ok) {
          return found;
        }

        const metadata = await getMetadataAtPath(trace, store, basePath);
        if (!metadata.ok) {
          if (metadata.value.errorCode === 'not-found') {
            return excludeFailureResult(metadata, 'untrusted', 'wrong-type');
          }
          return generalizeFailureResult(trace, excludeFailureResult(metadata, 'not-found'), ['untrusted', 'wrong-type']);
        }

        const organized = await organizeSyncablesForPushRequest(trace, { store, syncService }, { remoteId, basePath, items: found.value });
        if (!organized.ok) {
          return organized;
        }

        return makeSuccess({ basePath, item: { metadata: metadata.value, itemsById: organized.value.itemsById } });
      }
      case 'file': {
        const pulled = await pullFromLocal(trace, store, { basePath, localHashesRelativeToBasePath: {}, sendData: true });
        if (!pulled.ok) {
          return pulled;
        }

        const file = pulled.value as PullOutOfSyncFile;

        return makeSuccess({ basePath, item: { metadata: file.metadata, data: file.data! } });
      }
    }
  }
);
