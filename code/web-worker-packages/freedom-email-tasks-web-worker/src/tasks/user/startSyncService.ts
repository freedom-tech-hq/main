import type { PR } from 'freedom-async';
import { allResults, bestEffort, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import { api as fakeEmailServiceApi } from 'freedom-fake-email-service-api';
import { makeApiFetchTask } from 'freedom-fetching';
import type { RemoteAccessor } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, remoteIdInfo, storageRootIdInfo } from 'freedom-sync-types';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { routeMail } from '../../internal/tasks/mail/routeMail.ts';
import { grantAppenderAccessOnStorageFolderToRemote } from '../../internal/tasks/storage/grantAppenderAccessOnStorageFolderToRemote.ts';
import { grantEditorAccessOnOutFolderToRemote } from '../../internal/tasks/storage/grantEditorAccessOnOutFolderToRemote.ts';
import { makeSyncServiceForUserSyncables } from '../../internal/tasks/storage/makeSyncServiceForUserSyncables.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import { makeLocalFakeEmailServiceRemoteConnection } from '../../internal/utils/makeLocalFakeEmailServiceRemoteConnection.ts';

const getPublicKeysForRemote = makeApiFetchTask([import.meta.filename, 'getPublicKeysForRemote'], fakeEmailServiceApi.publicKeys.GET);

export const startSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<{ stop: () => TypeOrPromisedType<void> }, 'email-is-unavailable'> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;

    // TODO: remove once real services are ready
    const remoteConnection = await makeLocalFakeEmailServiceRemoteConnection(trace);
    if (!remoteConnection.ok) {
      return remoteConnection;
    }

    const mockRemotes: { deviceNotificationClient: DeviceNotificationClient; remoteAccessor: RemoteAccessor } = remoteConnection.value;

    const rootMetadata = await userFs.getMetadata(trace);
    if (!rootMetadata.ok) {
      return rootMetadata;
    }

    const registered = await remoteConnection.value.register(trace, {
      name: `user${Math.random()}`,
      creatorPublicKeys: credential.privateKeys.publicOnly(),
      storageRootId: storageRootIdInfo.make(credential.userId),
      metadata: { provenance: rootMetadata.value.provenance },
      saltsById: { [DEFAULT_SALT_ID]: access.saltsById[DEFAULT_SALT_ID] }
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
    await bestEffort(trace, grantAppenderAccessOnStorageFolderToRemote(trace, credential, { remotePublicKeys }));
    // Giving Editor Access on the Out Folder to the Server
    await bestEffort(trace, grantEditorAccessOnOutFolderToRemote(trace, credential, { remotePublicKeys }));

    const startedRoutingMail = await routeMail(trace, credential);
    if (!startedRoutingMail.ok) {
      return startedRoutingMail;
    }

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      credential,
      shouldRecordLogs: false,
      deviceNotificationClients: () => [mockRemotes.deviceNotificationClient],
      getRemotesAccessors: () => ({ [remoteIdInfo.make('default')]: mockRemotes.remoteAccessor })
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

    return makeSuccess({ stop });
  }
);
