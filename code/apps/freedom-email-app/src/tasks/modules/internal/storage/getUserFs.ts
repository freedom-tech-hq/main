import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { storageRootIdInfo } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { useDataSources } from '../../../contexts/data-sources.ts';
import { makeCryptoServiceForUser } from '../../../utils/makeCryptoServiceForUser.ts';
import { getRequiredCryptoKeysForUser } from '../user/getRequiredCryptoKeysForUser.ts';
import { getOrCreateEmailAppSaltsForUser } from './getOrCreateEmailAppSaltsForUser.ts';

export const getUserFs = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<MutableSyncableStore> => {
    const dataSources = useDataSources(trace);

    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    const saltsById = await getOrCreateEmailAppSaltsForUser(trace, { userId });
    if (!saltsById.ok) {
      return saltsById;
    }

    const storageRootId = storageRootIdInfo.make(userId);
    const cryptoService = makeCryptoServiceForUser({ userId });
    return await dataSources.getOrCreateSyncableStore(trace, { storageRootId, cryptoService, saltsById: saltsById.value });
  }
);
