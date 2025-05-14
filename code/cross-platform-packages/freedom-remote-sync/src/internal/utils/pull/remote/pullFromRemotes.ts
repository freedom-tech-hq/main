import type { PR, TraceableError } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { Cast, objectKeys } from 'freedom-cast';
import { InternalStateError } from 'freedom-common-errors';
import type { RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../../types/SyncStrategy.ts';
import { pullFromRemote } from './pullFromRemote.ts';

export const pullFromRemotes = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: RemoteSyncService },
    {
      remoteId,
      basePath,
      glob,
      strategy
    }: {
      remoteId?: RemoteId;
      basePath: SyncablePath;
      glob?: SyncGlob;
      strategy?: SyncStrategy;
    }
  ): PR<{ inSync: boolean }, 'not-found'> => {
    const remoteIds = remoteId !== undefined ? [remoteId] : objectKeys(syncService.remoteAccessors);

    if (remoteIds.length === 0) {
      // If there are no remotes setup, there's nothing to do, which is ok
      return makeSuccess({ inSync: true });
    }

    let lastNotFoundError: TraceableError<'not-found'> | undefined;
    const pulled = await allResultsMappedSkipFailures(
      trace,
      remoteIds,
      {
        _errorCodeType: Cast<'not-found'>(),
        maxConcurrency: 1,
        onSuccess: 'stop',
        skipErrorCodes: ['generic', 'not-found']
      },
      async (trace, remoteId): PR<{ inSync: boolean }, 'not-found'> => {
        const pulled = await pullFromRemote(trace, { store, syncService }, { remoteId, basePath, glob, strategy });
        if (!pulled.ok) {
          if (pulled.value.errorCode === 'not-found') {
            lastNotFoundError = pulled.value;
          }
          return pulled;
        }

        return makeSuccess(pulled.value);
      }
    );
    if (!pulled.ok) {
      return pulled;
    }

    const firstSuccess = pulled.value.find((v) => v !== undefined);
    if (firstSuccess === undefined) {
      if (lastNotFoundError !== undefined) {
        // If the syncable was not found on at least one remote, we'll assume it doesn't exist on any remotes
        return makeFailure(lastNotFoundError);
      } else {
        // If there are remotes setup and syncing fails for all of them (except if they failed with "not-found"), that's not ok
        return makeFailure(
          new InternalStateError(trace, {
            message: `Failed to pull ${basePath.toString()} from any remotes`
          })
        );
      }
    }

    return makeSuccess(firstSuccess);
  },
  { deepDisableLam: 'not-found' }
);
