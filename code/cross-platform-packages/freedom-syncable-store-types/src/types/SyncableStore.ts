import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { SaltId } from 'freedom-sync-types';

import type { MutableTrustMarkStore } from './MutableTrustMarkStore.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';

export interface SyncableStore extends SyncableFolderAccessor {
  readonly localTrustMarks: MutableTrustMarkStore;

  readonly creatorCryptoKeySetId: CryptoKeySetId;
  readonly cryptoService: CryptoService;

  readonly defaultSalt: string | undefined;
  readonly saltsById: Partial<Record<SaltId, string>>;
}
