import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import { type EmailUserId, getMailPaths } from 'freedom-email-sync';
import { api as fakeEmailServiceApi } from 'freedom-fake-email-service-api';
import { makeApiFetchTask } from 'freedom-fetching';
import type { RemoteAccessor } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, remoteIdInfo, storageRootIdInfo } from 'freedom-sync-types';
import { getMutableFolderAtPath } from 'freedom-syncable-store-types';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { makeSyncServiceForUserSyncables } from '../../../internal/tasks/storage/makeSyncServiceForUserSyncables.ts';
import { getOrCreateEmailAccessForUser } from '../../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import { getRequiredPrivateKeysForUser } from '../../../internal/tasks/user/getRequiredPrivateKeysForUser.ts';
import { startLocalFakeEmailServiceSyncing } from '../../../internal/utils/startLocalFakeEmailServiceSyncing.ts';

const getPublicKeysForRemote = makeApiFetchTask([import.meta.filename], fakeEmailServiceApi.publicKeys.GET);

export const startSyncServiceForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId }));

    const userFs = access.userFs;
    const mailPaths = await getMailPaths(userFs);

    const privateKeys = await getRequiredPrivateKeysForUser(trace, { userId });
    if (!privateKeys.ok) {
      return privateKeys;
    }

    // TODO: remove once real services are ready
    const started = await startLocalFakeEmailServiceSyncing(trace);
    if (!started.ok) {
      return started;
    }

    const mockRemotes: { deviceNotificationClient: DeviceNotificationClient; remoteAccessor: RemoteAccessor } = started.value;

    const rootMetadata = await userFs.getMetadata(trace);
    if (!rootMetadata.ok) {
      return rootMetadata;
    }

    const registered = await started.value.register(trace, {
      creatorPublicKeys: privateKeys.value.publicOnly(),
      storageRootId: storageRootIdInfo.make(userId),
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

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      userId,
      shouldRecordLogs: false,
      deviceNotificationClients: () => [mockRemotes.deviceNotificationClient],
      getRemotesAccessors: () => ({ [remoteIdInfo.make('default')]: mockRemotes.remoteAccessor })
    });
    if (!syncService.ok) {
      return syncService;
    }

    return await syncService.value.start(trace);
  }
);
