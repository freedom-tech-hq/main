import type { PR } from 'freedom-async';
import {
  allResults,
  bestEffort,
  callWithRetrySupport,
  makeAsyncResultFunc,
  makeFailure,
  makeSuccess,
  uncheckedResult
} from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import { doSoon } from 'freedom-do-soon';
import { createInitialSyncableStoreStructureForUser } from 'freedom-email-user';
import { dataUploadExponentialBackoffTimeMSec, makeApiFetchTask, MAX_RETRY_DATA_UPLOAD_ACCUMULATED_DELAY_MSEC } from 'freedom-fetching';
import { api as fakeEmailServiceApi } from 'freedom-store-api-server-api';
import type { PullItem } from 'freedom-sync-types';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { routeMail } from '../../internal/tasks/mail/routeMail.ts';
import { grantAppenderAccessOnStorageFolderToRemote } from '../../internal/tasks/storage/grantAppenderAccessOnStorageFolderToRemote.ts';
import { grantEditorAccessOnOutFolderToRemote } from '../../internal/tasks/storage/grantEditorAccessOnOutFolderToRemote.ts';
import { makeSyncServiceForUserSyncables } from '../../internal/tasks/storage/makeSyncServiceForUserSyncables.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';
import { makeEmailServiceRemoteConnection } from '../../internal/utils/makeEmailServiceRemoteConnection.ts';

const getPublicKeysForRemote = makeApiFetchTask([import.meta.filename, 'getPublicKeysForRemote'], fakeEmailServiceApi.publicKeys.GET);

export const startSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, isConnected: () => TypeOrPromisedType<boolean>): PR<undefined, 'email-unavailable'> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
    }

    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const remoteConnection = await makeEmailServiceRemoteConnection(trace, { storageRootId: syncableStore.path.storageRootId });
    if (!remoteConnection.ok) {
      return remoteConnection;
    }

    const gotRemotePublicKeys = await getPublicKeysForRemote(trace, { context: getDefaultApiRoutingContext() });
    if (!gotRemotePublicKeys.ok) {
      return gotRemotePublicKeys;
    }
    const remotePublicKeys = gotRemotePublicKeys.value.body;

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      credential,
      shouldRecordLogs: false,
      remoteConnections: [remoteConnection.value]
    });
    if (!syncService.ok) {
      return syncService;
    }

    const startedRoutingMail = await routeMail(trace, syncService.value, credential);
    if (!startedRoutingMail.ok) {
      return startedRoutingMail;
    }

    const startedRemoteConnectionContentChangeNotifications = await remoteConnection.value.start(trace);
    if (!startedRemoteConnectionContentChangeNotifications.ok) {
      return startedRemoteConnectionContentChangeNotifications;
    }

    const startedSyncService = await syncService.value.start(trace);
    if (!startedSyncService.ok) {
      return startedSyncService;
    }

    doSoon(trace, (trace) =>
      bestEffort(trace, async (trace): PR<undefined> => {
        const globPatterns = await createInitialSyncableStoreStructureForUser.getGlobPatterns(syncableStore);
        const pulled = await callWithRetrySupport<PullItem, 'not-found'>(
          (_failure, { attemptCount, accumulatedDelayMSec }) => ({
            retry: accumulatedDelayMSec < MAX_RETRY_DATA_UPLOAD_ACCUMULATED_DELAY_MSEC,
            delayMSec:
              dataUploadExponentialBackoffTimeMSec[attemptCount] ??
              dataUploadExponentialBackoffTimeMSec[dataUploadExponentialBackoffTimeMSec.length - 1] ??
              0
          }),
          (_attemptCount) => syncService.value.pullFromRemotes(trace, { basePath: syncableStore.path, ...globPatterns })
        );
        if (!pulled.ok) {
          return generalizeFailureResult(trace, pulled, 'not-found', 'Failed to pull initial content from remote');
        }

        // Calling this every time we start syncing in case our code has changed to need a different structure.
        //
        // This ignores conflicts but must be performed after the initial sync because we don't want to recreate folders that were already
        // created and just not downloaded yet (duplicate bundles and files are generally ok but duplicate folders are problematic because
        // there will be differing snapshots and deltas in the access-control document and the folder contents may be encrypted with
        // multiple sets of keys that are effectively in different, but colocated, access control documents)
        await bestEffort(trace, createInitialSyncableStoreStructureForUser(trace, syncableStore));

        // These will typically fail if we're recovering an account from the remote -- because the storage folder won't exist locally yet, but
        // that's ok, it means the remote already has the access it needs.
        // Giving Appender Access on the Storage Folder to the Server
        await bestEffort(trace, grantAppenderAccessOnStorageFolderToRemote(trace, credential, { remotePublicKeys }));
        // Giving Editor Access on the Out Folder to the Server
        await bestEffort(trace, grantEditorAccessOnOutFolderToRemote(trace, credential, { remotePublicKeys }));

        return makeSuccess(undefined);
      })
    );

    const stop = async () => {
      await bestEffort(
        trace,
        allResults(trace, [
          startedRoutingMail.value.stop(trace),
          startedRemoteConnectionContentChangeNotifications.value.stop(trace),
          syncService.value.stop(trace)
        ])
      );
    };

    // Periodically checking if the connection is still active
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        clearInterval(checkConnectionInterval);
        stop();
      }
    }, ONE_SEC_MSEC);

    return makeSuccess(undefined);
  }
);
