import type { AccessControlDocument } from 'freedom-access-control-types';
import type { CryptoKeySetId } from 'freedom-crypto-data';

import type { SyncableStoreRole } from './SyncableStoreRole.ts';

export interface ISyncableStoreAccessControlDocument extends AccessControlDocument<SyncableStoreRole> {
  readonly creatorCryptoKeySetId: CryptoKeySetId | undefined;
}
