import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { storageRootIdInfo } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { EmailUserId } from '../../../../types/EmailUserId.js';
import { useDataSources } from '../../../contexts/data-sources.js';
import { makeCryptoServiceForUser } from '../../../utils/makeCryptoServiceForUser.js';
import { getRequiredCryptoKeysForUser } from '../user/getRequiredCryptoKeysForUser.js';

export const getUserFs = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<MutableSyncableStore> => {
    const dataSources = useDataSources(trace);

    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    const storageRootId = storageRootIdInfo.make(userId);
    const cryptoService = makeCryptoServiceForUser({ userId });
    return dataSources.getOrCreateSyncableStore(trace, { storageRootId, cryptoService });
  }
);
