import type { PRFunc } from 'freedom-async';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { SyncableItemMetadata } from 'freedom-sync-types';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import type { ISyncableStoreAccessControlDocument } from '../ISyncableStoreAccessControlDocument.ts';
import type { SyncableStoreRole } from '../SyncableStoreRole.ts';
import type { FileStore } from './FileStore.ts';
import type { FolderStore } from './FolderStore.ts';

export interface SyncableFolderAccessor extends FileStore, FolderStore {
  readonly type: 'folder';

  /** Determines if the specified crypto key set ID was associated with any of the specified roles at the specified time */
  readonly didCryptoKeyHaveRoleAtTimeMSec: PRFunc<
    boolean,
    never,
    [{ cryptoKeySetId: CryptoKeySetId; oneOfRoles: Set<SyncableStoreRole>; timeMSec: number }]
  >;

  /** Gets the access control document */
  readonly getAccessControlDocument: PRFunc<ISyncableStoreAccessControlDocument>;

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;

  /** Gets the roles, if any, currently associated with the specified crypto key set IDs */
  readonly getRolesByCryptoKeySetId: PRFunc<
    Partial<Record<CryptoKeySetId, SyncableStoreRole>>,
    never,
    [{ cryptoKeySetIds: CryptoKeySetId[] }]
  >;

  /** Determines trusted time sources for this folder */
  readonly getTrustedTimeSources: PRFunc<TrustedTimeSource[], 'not-found'>;
}
