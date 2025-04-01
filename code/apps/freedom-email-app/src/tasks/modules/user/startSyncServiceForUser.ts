import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { remoteIdInfo } from 'freedom-sync-types';

import type { EmailUserId } from '../../../types/EmailUserId.ts';
import { useMockRemotes } from '../../mock-remote/mock-remotes-context.ts';
import { startMockRemote } from '../../mock-remote/startMockRemote.ts';
import { makeSyncServiceForUserSyncables } from '../internal/storage/makeSyncServiceForUserSyncables.ts';
import { getRequiredCryptoKeysForUser } from '../internal/user/getRequiredCryptoKeysForUser.ts';

export const startSyncServiceForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    // TODO: REMOVE ONCE SERVICES ARE READY
    const mockRemotes = useMockRemotes(trace);
    if (mockRemotes.mockRemotes === undefined) {
      const startedMockRemotes = await startMockRemote(trace, { creatorPublicCryptoKeysSet: cryptoKeys.value.publicOnly() });
      if (!startedMockRemotes.ok) {
        return startedMockRemotes;
      }

      mockRemotes.mockRemotes = startedMockRemotes.value;
    }

    const syncService = await makeSyncServiceForUserSyncables(trace, {
      userId,
      shouldRecordLogs: false,
      deviceNotificationClients: () => [mockRemotes.mockRemotes!.deviceNotificationClient],
      getRemotesAccessors: () => ({ [remoteIdInfo.make('default')]: mockRemotes.mockRemotes!.remoteAccessors })
    });
    if (!syncService.ok) {
      return syncService;
    }

    return await syncService.value.start(trace);
  }
);
