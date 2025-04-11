import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailCredential } from 'freedom-email-user';
import type { MakeSyncServiceArgs, SyncService } from 'freedom-sync-service';
import { makeSyncService } from 'freedom-sync-service';

import { getOrCreateEmailAccessForUser } from '../user/getOrCreateEmailAccessForUser.ts';

export const makeSyncServiceForUserSyncables = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      credential,
      ...fwdArgs
    }: Omit<MakeSyncServiceArgs, 'shouldSyncWithAllRemotes' | 'store'> & {
      credential: EmailCredential;
    }
  ): PR<SyncService> => {
    const access = await getOrCreateEmailAccessForUser(trace, credential);
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
