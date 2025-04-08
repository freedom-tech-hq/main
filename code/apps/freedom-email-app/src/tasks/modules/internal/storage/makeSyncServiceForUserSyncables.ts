import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import type { MakeSyncServiceArgs, SyncService } from 'freedom-sync-service';
import { makeSyncService } from 'freedom-sync-service';

import { getOrCreateEmailAccessForUser } from '../user/getOrCreateEmailAccessForUser.ts';

export const makeSyncServiceForUserSyncables = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      userId,
      ...fwdArgs
    }: Omit<MakeSyncServiceArgs, 'shouldSyncWithAllRemotes' | 'store'> & {
      userId: EmailUserId;
    }
  ): PR<SyncService> => {
    const access = await getOrCreateEmailAccessForUser(trace, { userId });
    if (!access.ok) {
      return access;
    }

    return await makeSyncService(trace, {
      ...fwdArgs,
      shouldSyncWithAllRemotes: async () => makeSuccess(false),
      store: access.value.userFs
    });
  }
);
