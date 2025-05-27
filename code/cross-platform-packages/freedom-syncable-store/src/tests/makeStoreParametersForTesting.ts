import type { Trace } from 'freedom-contexts';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import { expectOk } from 'freedom-testing-tools';

import { generateProvenanceForNewSyncableStore } from '../exports.ts';
import { ROOT_FOLDER_ID } from '../internal/consts/special-ids.ts';
import { getPrivateKeysFixture } from './getPrivateKeysFixture.ts';
import { type HotSwappableUserKeys, makeHotSwappableUserKeysForTesting } from './makeHotSwappableUserKeysForTesting.ts';
import { makeUserKeysForTesting } from './makeUserKeysForTesting.ts';

export interface StoreTestParameters {
  privateKeys: PrivateCombinationCryptoKeySet;
  primaryUserKeys: UserKeys;
  userKeys: HotSwappableUserKeys;
  provenance: SyncableProvenance;
  rootMetadata: SyncableStoreBackingItemMetadata;
}

export const makeStoreParametersForTesting = async (trace: Trace, storageRootId: StorageRootId): Promise<StoreTestParameters> => {
  const privateKeys = await getPrivateKeysFixture();

  const primaryUserKeys = makeUserKeysForTesting({ privateKeys });
  const userKeys = makeHotSwappableUserKeysForTesting(primaryUserKeys);

  const provenanceResult = await generateProvenanceForNewSyncableStore(trace, {
    storageRootId,
    userKeys,
    trustedTimeSignature: undefined
  });
  expectOk(provenanceResult);
  const provenance = provenanceResult.value;

  const rootMetadata: SyncableStoreBackingItemMetadata = {
    name: ROOT_FOLDER_ID,
    provenance
  };

  return {
    privateKeys,
    primaryUserKeys,
    userKeys,
    provenance,
    rootMetadata
  };
};
