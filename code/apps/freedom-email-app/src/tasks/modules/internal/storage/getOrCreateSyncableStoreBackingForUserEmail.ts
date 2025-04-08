import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { storageRootIdInfo } from 'freedom-sync-types';
import {
  generateProvenanceForNewSyncableStore,
  InMemorySyncableStoreBacking,
  type SyncableStoreBacking
} from 'freedom-syncable-store-types';

import { makeCryptoServiceForUser } from '../../../utils/makeCryptoServiceForUser.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, SyncableStoreBacking> = {};

export const getOrCreateSyncableStoreBackingForUserEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<SyncableStoreBacking> => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const cryptoService = makeCryptoServiceForUser({ userId });

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId: storageRootIdInfo.make(userId),
      cryptoService,
      trustedTimeSignature: undefined
    });
    if (!provenance.ok) {
      return provenance;
    }

    const output = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
