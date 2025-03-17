import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';

import type { AccessControlledFolderAccessor } from './AccessControlledFolderAccessor.ts';
import type { MutableTrustMarkStore } from './MutableTrustMarkStore.ts';

export interface SyncableStore extends AccessControlledFolderAccessor {
  readonly localTrustMarks: MutableTrustMarkStore;

  readonly creatorCryptoKeySetId: CryptoKeySetId;
  readonly cryptoService: CryptoService;
}
