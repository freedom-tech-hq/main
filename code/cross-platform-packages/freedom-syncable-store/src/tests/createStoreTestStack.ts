import { makeTrace, makeUuid } from 'freedom-contexts';
import { makeUserKeysForTesting } from 'freedom-crypto-service/tests';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, type SaltsById, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { DefaultSyncableStore } from '../types/DefaultSyncableStore.ts';
import { generateProvenanceForNewSyncableStore } from '../utils/generateProvenanceForNewSyncableStore.ts';
import { initializeRoot } from '../utils/initializeRoot.ts';
import { getPrivateKeysFixture } from './getPrivateKeysFixture.ts';

export async function createStoreTestStack({
  extraSaltsById = {}
}: {
  extraSaltsById?: SaltsById;
} = {}) {
  // Trace
  const trace = makeTrace('test');

  // User Credentials
  // TODO: Make more realistic and freeze as a fixture
  const storageRootId = storageRootIdInfo.make('test');
  const saltsById = {
    ...extraSaltsById,
    [DEFAULT_SALT_ID]: makeUuid()
  };

  // User Keys
  const privateKeys = await getPrivateKeysFixture();

  // Crypto Service Mock
  const userKeys = makeUserKeysForTesting({ privateKeys });

  // Provenance Parameters
  const provenance = await generateProvenanceForNewSyncableStore(trace, {
    storageRootId,
    userKeys,
    trustedTimeSignature: undefined
  });
  expectOk(provenance);

  // Single Store
  const storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
  const store = new DefaultSyncableStore({
    storageRootId,
    backing: storeBacking,
    userKeys,
    creatorPublicKeys: privateKeys.publicOnly(),
    saltsById
  });

  // Initialize a store (this is a slow operation)
  expectOk(await initializeRoot(trace, store));

  return {
    trace,

    // User Credentials
    storageRootId,
    privateKeys,
    saltsById,

    // Test Subject
    userKeys,
    storeBacking,
    store
  };
}
