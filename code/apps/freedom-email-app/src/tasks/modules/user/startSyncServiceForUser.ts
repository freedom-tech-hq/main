import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc } from 'freedom-async';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import type { RemoteAccessor } from 'freedom-sync-types';
import { remoteIdInfo, storageRootIdInfo } from 'freedom-sync-types';

import type { EmailUserId } from '../../../types/EmailUserId.ts';
import { startLocalFakeEmailServiceSyncing } from '../../local-fake-email-service/startLocalFakeEmailServiceSyncing.ts';
import { startMockRemote } from '../../mock-remote/startMockRemote.ts';
import { getOrCreateEmailAppSaltsForUser } from '../internal/storage/getOrCreateEmailAppSaltsForUser.ts';
import { getUserFs } from '../internal/storage/getUserFs.ts';
import { makeSyncServiceForUserSyncables } from '../internal/storage/makeSyncServiceForUserSyncables.ts';
import { getRequiredCryptoKeysForUser } from '../internal/user/getRequiredCryptoKeysForUser.ts';

const version: 1 | 2 = 2 as 1 | 2;

export const startSyncServiceForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    console.log('startSyncServiceForUser');
    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    // TODO: REMOVE ONCE SERVICES ARE READY
    let mockRemotes: { deviceNotificationClient: DeviceNotificationClient; remoteAccessor: RemoteAccessor };
    switch (version) {
      case 1: {
        const started = await startMockRemote(trace, { creatorPublicCryptoKeysSet: cryptoKeys.value.publicOnly() });
        if (!started.ok) {
          return started;
        }

        mockRemotes = started.value;

        break;
      }

      case 2: {
        const started = await startLocalFakeEmailServiceSyncing(trace);
        if (!started.ok) {
          return started;
        }

        const userFs = await getUserFs(trace, { userId });
        if (!userFs.ok) {
          return userFs;
        }

        const rootMetadata = await userFs.value.getMetadata(trace);
        if (!rootMetadata.ok) {
          return rootMetadata;
        }

        const saltsById = await getOrCreateEmailAppSaltsForUser(trace, { userId });
        if (!saltsById.ok) {
          return saltsById;
        }

        const registered = await started.value.register(trace, {
          creatorPublicKeys: cryptoKeys.value.publicOnly(),
          storageRootId: storageRootIdInfo.make(userId),
          metadata: { provenance: rootMetadata.value.provenance },
          saltsById: saltsById.value
        });
        if (!registered.ok) {
          if (registered.value.errorCode !== 'conflict') {
            // Ignoring conflicts
            return excludeFailureResult(registered, 'conflict');
          }
        }

        mockRemotes = started.value;

        break;
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
