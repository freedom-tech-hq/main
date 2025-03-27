import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { MakeSyncServiceArgs, SyncService } from 'freedom-sync-service';
import { makeSyncService } from 'freedom-sync-service';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { getUserFs } from './getUserFs.ts';

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
    const userFs = await getUserFs(trace, { userId });
    if (!userFs.ok) {
      return userFs;
    }

    return await makeSyncService(trace, {
      ...fwdArgs,
      shouldSyncWithAllRemotes: async () => makeSuccess(false),
      store: userFs.value
    });
  }
);
