import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { RemoteId, SyncablePath, SyncGlob, SyncPushArgs } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath, syncPushArgsSchema } from 'freedom-sync-types';
import { findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { pullFileFromLocal } from '../../pull/local/pullFileFromLocal.ts';
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
        const found = await findSyncables(trace, store, { basePath, glob });
        if (!found.ok) {
          return found;
        }

        console.log(
          'FOOBARBLA found',
          basePath.toShortString(),
          found.value.map((item) => item.path.toShortString())
        );

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

        console.log(
          'FOOBARBLA args',
          syncPushArgsSchema.stringify({ basePath, item: { metadata: metadata.value, itemsById: organized.value.itemsById } }, { space: 2 })
        );

        return makeSuccess({ basePath, item: { metadata: metadata.value, itemsById: organized.value.itemsById } });
      }
      case 'file': {
        const pushFile = await pullFileFromLocal(trace, store, basePath);
        if (!pushFile.ok) {
          if (pushFile.value.errorCode === 'not-found') {
            return excludeFailureResult(pushFile, 'untrusted', 'wrong-type');
          }
          return generalizeFailureResult(trace, excludeFailureResult(pushFile, 'not-found'), ['untrusted', 'wrong-type']);
        }

        return makeSuccess({ basePath, item: pushFile.value });
      }
    }
  }
);
