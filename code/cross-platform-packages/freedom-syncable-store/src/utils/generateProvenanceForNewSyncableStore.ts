import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';
import type { StorageRootId, SyncableOriginOptions, SyncableProvenance } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';

import { ROOT_FOLDER_ID } from '../internal/consts/special-ids.ts';
import { generateOrigin } from './generateOrigin.ts';

export const generateProvenanceForNewSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { storageRootId, trustedTimeSignature, userKeys }: SyncableOriginOptions & { storageRootId: StorageRootId; userKeys: UserKeys }
  ): PR<SyncableProvenance> => {
    const origin = await generateOrigin(trace, {
      path: new SyncablePath(storageRootId),
      type: 'folder',
      name: ROOT_FOLDER_ID,
      contentHash: undefined,
      trustedTimeSignature,
      userKeys
    });
    if (!origin.ok) {
      return origin;
    }

    return makeSuccess({ origin: origin.value });
  }
);
