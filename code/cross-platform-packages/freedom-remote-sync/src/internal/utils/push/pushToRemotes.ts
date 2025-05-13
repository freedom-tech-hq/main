import type { PR, TraceableError } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { Cast, objectKeys } from 'freedom-cast';
import { InternalStateError } from 'freedom-common-errors';
import type { PullItem, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../types/SyncStrategy.ts';
import { pushToRemote } from './pushToRemote.ts';

export const pushToRemotes = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
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
  ): PR<PullItem, 'not-found'> => {
    const remoteIds = remoteId !== undefined ? [remoteId] : objectKeys(syncService.remoteAccessors);

    if (remoteIds.length === 0) {
      // If there are no remotes setup, there's nothing to do, which is ok
      return makeSuccess('in-sync' as const);
    }

    let lastNotFoundError: TraceableError<'not-found'> | undefined;
    const pushed = await allResultsMappedSkipFailures(
      trace,
      remoteIds,
      {
        _errorCodeType: Cast<'not-found'>(),
        maxConcurrency: 1,
        onSuccess: 'stop',
        skipErrorCodes: ['generic', 'not-found']
      },
      async (trace, remoteId): PR<PullItem, 'not-found'> => {
        const pushed = await pushToRemote(trace, { store, syncService }, { remoteId, basePath, glob, strategy });
        if (!pushed.ok) {
          if (pushed.value.errorCode === 'not-found') {
            lastNotFoundError = pushed.value;
          }
          return pushed;
        }

        return makeSuccess(pushed.value);
      }
    );
    if (!pushed.ok) {
      return pushed;
    }

    const firstSuccess = pushed.value.find((v) => v !== undefined);
    if (firstSuccess === undefined) {
      if (lastNotFoundError !== undefined) {
        // If one of the syncable's parents aren't found on at least one remote, we'll assume it doesn't exist on any remotes
        return makeFailure(lastNotFoundError);
      } else {
        // If there are remotes setup and syncing fails for all of them, that's not ok
        return makeFailure(new InternalStateError(trace, { message: `Failed to push ${basePath.toString()} to any remotes` }));
      }
    }

    return makeSuccess(firstSuccess);
  },
  { deepDisableLam: 'not-found' }
);
