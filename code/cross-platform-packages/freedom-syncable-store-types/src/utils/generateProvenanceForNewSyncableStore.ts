import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { CryptoService } from 'freedom-crypto-service';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';

import { ROOT_FOLDER_ID } from '../types/in-memory-backing/internal/consts/special-ids.ts';
import { generateOrigin } from './generateOrigin.ts';

export const generateProvenanceForNewSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { storageRootId, cryptoService }: { storageRootId: StorageRootId; cryptoService: CryptoService }
  ): PR<SyncableProvenance> => {
    const origin = await generateOrigin(trace, {
      path: new SyncablePath(storageRootId),
      type: 'folder',
      name: ROOT_FOLDER_ID,
      contentHash: undefined,
      cryptoService
    });
    if (!origin.ok) {
      return origin;
    }

    return makeSuccess({ origin: origin.value });
  }
);
