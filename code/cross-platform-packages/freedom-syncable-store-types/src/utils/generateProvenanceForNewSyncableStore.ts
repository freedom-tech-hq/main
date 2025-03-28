import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { CryptoService } from 'freedom-crypto-service';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';

import { generateOrigin } from './generateOrigin.ts';

export const generateProvenanceForNewSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { storageRootId, cryptoService }: { storageRootId: StorageRootId; cryptoService: CryptoService }
  ): PR<SyncableProvenance> => {
    const origin = await generateOrigin(trace, { path: new SyncablePath(storageRootId), contentHash: undefined, cryptoService });
    if (!origin.ok) {
      return origin;
    }

    return makeSuccess({ origin: origin.value });
  }
);
