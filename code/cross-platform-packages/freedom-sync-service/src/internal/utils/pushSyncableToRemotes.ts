import type { PR } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';
import { pushSyncableToRemote } from './pushSyncableToRemote.ts';

export const pushSyncableToRemotes = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { path, hash }: { path: SyncablePath; hash: Sha256Hash }
  ): PR<undefined> => {
    const remotes = syncService.getRemotes();

    if (remotes.length === 0) {
      // If there are no remotes setup, there's nothing to do, which is ok
      return makeSuccess(undefined);
    }

    const shouldSyncWithAllRemotes = await syncService.shouldSyncWithAllRemotes(trace, { store, path, hash });
    if (!shouldSyncWithAllRemotes.ok) {
      return generalizeFailureResult(trace, shouldSyncWithAllRemotes, 'not-found');
    }

    const onSuccess = shouldSyncWithAllRemotes.value ? 'continue' : 'stop';

    const pushed = await allResultsMappedSkipFailures(
      trace,
      remotes,
      { maxConcurrency: 1, onSuccess, skipErrorCodes: ['generic'] },
      async (trace, remote): PR<'ok'> => {
        const pushed = await pushSyncableToRemote(trace, { store, syncService }, { remoteId: remote.id, path, hash });
        if (!pushed.ok) {
          return pushed;
        }

        return makeSuccess('ok' as const);
      }
    );
    if (!pushed.ok) {
      return pushed;
    }

    if (!pushed.value.includes('ok')) {
      // If there are remotes setup and syncing fails for all of them, that's not ok
      return makeFailure(new InternalStateError(trace, { message: `Failed to push ${path.toString()} to any remotes` }));
    }

    return makeSuccess(undefined);
  }
);
