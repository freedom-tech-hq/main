import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { SaltId } from 'freedom-sync-types';

import type { MutableTrustMarkStore } from './MutableTrustMarkStore.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';
import type { SyncableStoreLogEntry } from './SyncableStoreLogEntry.ts';

export interface SyncableStore extends SyncableFolderAccessor {
  readonly localTrustMarks: MutableTrustMarkStore;

  readonly creatorPublicKeys: CombinationCryptoKeySet;
  readonly cryptoService: CryptoService;

  readonly saltsById: Partial<Record<SaltId, string>>;

  readonly devLogging: DevLoggingSupport<SyncableStoreLogEntry>;
}
