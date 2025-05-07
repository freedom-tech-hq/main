import type { PR } from 'freedom-async';
import { allResults, bestEffort, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { InternalStateError } from 'freedom-common-errors';
import { makeApiFetchTask } from 'freedom-fetching';
import { api as fakeEmailServiceApi } from 'freedom-store-api-server-api';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
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
  async (trace, isConnected: () => TypeOrPromisedType<boolean>): PR<undefined, 'email-is-unavailable'> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
    }

    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const remoteConnection = await makeEmailServiceRemoteConnection(trace);
    if (!remoteConnection.ok) {
      return remoteConnection;
    }

    const rootMetadata = await syncableStore.getMetadata(trace);
    if (!rootMetadata.ok) {
      return rootMetadata;
    }

    const registered = await remoteConnection.value.register(trace, {
      name: `user${Math.random()}`,
      creatorPublicKeys: credential.privateKeys.publicOnly(),
      storageRootId: storageRootIdInfo.make(credential.userId),
      metadata: { provenance: rootMetadata.value.provenance },
      saltsById: { [DEFAULT_SALT_ID]: syncableStore.saltsById[DEFAULT_SALT_ID] }
    });
    if (!registered.ok) {
      return registered;
    }

    const gotRemotePublicKeys = await getPublicKeysForRemote(trace, { context: getDefaultApiRoutingContext() });
    if (!gotRemotePublicKeys.ok) {
      return gotRemotePublicKeys;
    }
    const remotePublicKeys = gotRemotePublicKeys.value.body;

    // These will typically fail if we're recovering an account from the remote -- because the storage folder won't exist locally yet, but
    // that's ok, it means the remote already has the access it needs.
    // Giving Appender Access on the Storage Folder to the Server
    await disableLam(true, bestEffort)(trace, grantAppenderAccessOnStorageFolderToRemote(trace, credential, { remotePublicKeys }));
    // Giving Editor Access on the Out Folder to the Server
    await disableLam(true, bestEffort)(trace, grantEditorAccessOnOutFolderToRemote(trace, credential, { remotePublicKeys }));

    const startedRoutingMail = await routeMail(trace, credential);
    if (!startedRoutingMail.ok) {
      return startedRoutingMail;
    }

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      credential,
      shouldRecordLogs: false,
      remoteConnections: [remoteConnection.value]
    });
    if (!syncService.ok) {
      return syncService;
    }

    const startedRemoteConnectionContentChangeNotifications = await remoteConnection.value.start(trace);
    if (!startedRemoteConnectionContentChangeNotifications.ok) {
      return startedRemoteConnectionContentChangeNotifications;
    }

    const startedSyncService = await syncService.value.start(trace);
    if (!startedSyncService.ok) {
      return startedSyncService;
    }

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
