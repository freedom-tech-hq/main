import type { PR, TraceableError } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { Cast, objectKeys } from 'freedom-cast';
import { InternalStateError } from 'freedom-common-errors';
import type { RemoteId, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';
import { pullSyncableFromRemote } from './pullSyncableFromRemote.ts';

export const pullSyncableFromRemotes = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId?: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const remoteIds = remoteId !== undefined ? [remoteId] : objectKeys(syncService.remoteAccessors);

    if (remoteIds.length === 0) {
      // If there are no remotes setup, there's nothing to do, which is ok
      return makeSuccess(undefined);
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
      async (trace, remoteId): PR<'ok', 'not-found'> => {
        const pulled = await pullSyncableFromRemote(trace, { store, syncService }, { path, remoteId });
        if (!pulled.ok) {
          if (pulled.value.errorCode === 'not-found') {
            lastNotFoundError = pulled.value;
          }
          return pulled;
        }

        return makeSuccess('ok' as const);
      }
    );
    if (!pulled.ok) {
      return pulled;
    }

    if (!pulled.value.includes('ok')) {
      if (lastNotFoundError !== undefined) {
        // If the syncable was not found on at least one remote, we'll assume it doesn't exist on any remotes
        return makeFailure(lastNotFoundError);
      } else {
        // If there are remotes setup and syncing fails for all of them (except if they failed with "not-found"), that's not ok
        return makeFailure(
          new InternalStateError(trace, {
            message: `Failed to pull ${path.toString()} from any remotes`
          })
        );
      }
    }

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);
