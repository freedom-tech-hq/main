import type { PR } from 'freedom-async';
import {
  allResults,
  bestEffort,
  excludeFailureResult,
  makeAsyncResultFunc,
  makeFailure,
  makeSuccess,
  uncheckedResult
} from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import { getMailPaths } from 'freedom-email-sync';
import { api as fakeEmailServiceApi } from 'freedom-fake-email-service-api';
import { makeApiFetchTask } from 'freedom-fetching';
import type { RemoteAccessor } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, remoteIdInfo, storageRootIdInfo } from 'freedom-sync-types';
import { getMutableFolderAtPath } from 'freedom-syncable-store';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { routeMail } from '../../internal/tasks/mail/routeMail.ts';
import { makeSyncServiceForUserSyncables } from '../../internal/tasks/storage/makeSyncServiceForUserSyncables.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import { makeLocalFakeEmailServiceRemoteConnection } from '../../internal/utils/makeLocalFakeEmailServiceRemoteConnection.ts';

const getPublicKeysForRemote = makeApiFetchTask([import.meta.filename, 'getPublicKeysForRemote'], fakeEmailServiceApi.publicKeys.GET);

export const startSyncService = makeAsyncResultFunc([import.meta.filename], async (trace): PR<{ stop: () => TypeOrPromisedType<void> }> => {
  const credential = useActiveCredential(trace).credential;

  if (credential === undefined) {
    return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
  }

  const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

  const userFs = access.userFs;
  const mailPaths = await getMailPaths(userFs);

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
    creatorPublicKeys: credential.privateKeys.publicOnly(),
    storageRootId: storageRootIdInfo.make(credential.userId),
    metadata: { provenance: rootMetadata.value.provenance },
    saltsById: { [DEFAULT_SALT_ID]: access.saltsById[DEFAULT_SALT_ID] }
  });
  if (!registered.ok) {
    if (registered.value.errorCode !== 'conflict') {
      // Ignoring conflicts
      return excludeFailureResult(registered, 'conflict');
    }
  }

  const gotRemotePublicKeys = await getPublicKeysForRemote(trace, { context: getDefaultApiRoutingContext() });
  if (!gotRemotePublicKeys.ok) {
    return gotRemotePublicKeys;
  }
  const remotePublicKeys = gotRemotePublicKeys.value.body;

  // Giving Appender Access on the Storage Folder to the Server
  {
    const storageFolderPath = mailPaths.storage.value;
    const storageFolder = await getMutableFolderAtPath(trace, userFs, storageFolderPath);
    if (!storageFolder.ok) {
      return generalizeFailureResult(trace, storageFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const remoteCurrentStorageFolderRoles = await storageFolder.value.getRolesByCryptoKeySetId(trace, {
      cryptoKeySetIds: [remotePublicKeys.id]
    });
    if (!remoteCurrentStorageFolderRoles.ok) {
      return remoteCurrentStorageFolderRoles;
    }

    if (remoteCurrentStorageFolderRoles.value[remotePublicKeys.id] === undefined) {
      const addedRemoteAppenderAccess = await storageFolder.value.updateAccess(trace, {
        type: 'add-access',
        publicKeys: remotePublicKeys,
        role: 'appender'
      });
      if (!addedRemoteAppenderAccess.ok) {
        return generalizeFailureResult(trace, addedRemoteAppenderAccess, 'conflict');
      }
    }
  }

  // Giving Editor Access on the Out Folder to the Server
  {
    const outFolderPath = mailPaths.out.value;
    const outFolder = await getMutableFolderAtPath(trace, userFs, outFolderPath);
    if (!outFolder.ok) {
      return generalizeFailureResult(trace, outFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const remoteCurrentOutFolderRoles = await outFolder.value.getRolesByCryptoKeySetId(trace, {
      cryptoKeySetIds: [remotePublicKeys.id]
    });
    if (!remoteCurrentOutFolderRoles.ok) {
      return remoteCurrentOutFolderRoles;
    }

    if (remoteCurrentOutFolderRoles.value[remotePublicKeys.id] === undefined) {
      const addedRemoteEditorAccess = await outFolder.value.updateAccess(trace, {
        type: 'add-access',
        publicKeys: remotePublicKeys,
        role: 'editor'
      });
      if (!addedRemoteEditorAccess.ok) {
        return generalizeFailureResult(trace, addedRemoteEditorAccess, 'conflict');
      }
    }
  }

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
});
