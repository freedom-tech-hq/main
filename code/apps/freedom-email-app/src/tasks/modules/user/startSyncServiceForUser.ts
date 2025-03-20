import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';

import type { EmailUserId } from '../../../types/EmailUserId.js';
import { useUserSyncableRemotes } from '../../contexts/user-syncable-remotes.js';
import { useMockRemotes } from '../../mock-remote/mock-remotes-context.js';
import { startMockRemotes } from '../../mock-remote/startMockRemotes.js';
import { makeSyncServiceForUserSyncables } from '../internal/storage/makeSyncServiceForUserSyncables.js';
import { getRequiredCryptoKeysForUser } from '../internal/user/getRequiredCryptoKeysForUser.js';

export const startSyncServiceForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const userSyncableRemotes = useUserSyncableRemotes(trace);

    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    // TODO: REMOVE ONCE SERVICES ARE READY
    const mockRemotes = useMockRemotes(trace);
    if (mockRemotes.mockRemotes === undefined) {
      const startedMockRemotes = await startMockRemotes(trace, { creatorPublicCryptoKeysSet: cryptoKeys.value.publicOnly() });
      if (!startedMockRemotes.ok) {
        return startedMockRemotes;
      }

      mockRemotes.mockRemotes = startedMockRemotes.value;
    }

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      userId,
      shouldRecordLogs: false,
      deviceNotificationClients: mockRemotes.mockRemotes.deviceNotificationClients,
      puller: mockRemotes.mockRemotes.puller,
      pusher: mockRemotes.mockRemotes.pusher,
      getRemotes: () => userSyncableRemotes
    });
    if (!syncService.ok) {
      return syncService;
    }

    return await syncService.value.start(trace);
  }
);
