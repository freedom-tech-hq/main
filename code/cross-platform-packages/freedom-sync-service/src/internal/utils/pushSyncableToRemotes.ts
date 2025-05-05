import type { PR, TraceableError } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { Cast, objectKeys } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { SyncService } from '../../types/SyncService.ts';
import { pushSyncableToRemote } from './pushSyncableToRemote.ts';

export const pushSyncableToRemotes = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { path, hash }: { path: SyncablePath; hash: Sha256Hash }
  ): PR<undefined, 'not-found'> => {
    const remoteIds = objectKeys(syncService.getRemotesAccessors());

    if (remoteIds.length === 0) {
      // If there are no remotes setup, there's nothing to do, which is ok
      return makeSuccess(undefined);
    }

    const shouldSyncWithAllRemotes = await syncService.shouldSyncWithAllRemotes(trace, { store, path, hash });
    if (!shouldSyncWithAllRemotes.ok) {
      return generalizeFailureResult(trace, shouldSyncWithAllRemotes, 'not-found');
    }

    const onSuccess = shouldSyncWithAllRemotes.value ? 'continue' : 'stop';

    let lastNotFoundError: TraceableError<'not-found'> | undefined;
    const pushed = await allResultsMappedSkipFailures(
      trace,
      remoteIds,
      {
        _errorCodeType: Cast<'not-found'>(),
        maxConcurrency: 1,
        onSuccess,
        skipErrorCodes: ['generic', 'not-found']
      },
      async (trace, remoteId): PR<'ok', 'not-found'> => {
        const pushed = await disableLam(trace, 'not-found', (trace) =>
          pushSyncableToRemote(trace, { store, syncService }, { remoteId, path, hash })
        );
        if (!pushed.ok) {
          if (pushed.value.errorCode === 'not-found') {
            lastNotFoundError = pushed.value;
          }
          return pushed;
        }

        return makeSuccess('ok' as const);
      }
    );
    if (!pushed.ok) {
      return pushed;
    }

    if (!pushed.value.includes('ok')) {
      if (lastNotFoundError !== undefined) {
        // If one of the syncable's parents aren't found on at least one remote, we'll assume it doesn't exist on any remotes
        return makeFailure(lastNotFoundError);
      } else {
        // If there are remotes setup and syncing fails for all of them, that's not ok
        return makeFailure(new InternalStateError(trace, { message: `Failed to push ${path.toString()} to any remotes` }));
      }
    }

    return makeSuccess(undefined);
  },
  { disableLam: 'not-found' }
);
