import { makeTrace, makeUuid } from 'freedom-contexts';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from './makeCryptoServiceForTesting.ts';
import { generateProvenanceForNewSyncableStore } from '../utils/generateProvenanceForNewSyncableStore.ts';
import { initializeRoot } from '../utils/initializeRoot.ts';
import { DefaultSyncableStore } from '../types/DefaultSyncableStore.ts';
import { InMemorySyncableStoreBacking } from '../types/in-memory-backing/InMemorySyncableStoreBacking.ts';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { getSerializedFixture } from 'freedom-testing-tools';

export const storageRootId = storageRootIdInfo.make('test');

export async function createStoreTestStack() {
  // Trace
  const trace = makeTrace('test');

  // Keys
  // How to generate:
  //   const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
  //   expectOk(internalCryptoKeys);
  //   const privateKeys = internalCryptoKeys.value;
  //
  //   const x = await privateCombinationCryptoKeySetSchema.serializeAsync(privateKeys);
  //   fs.writeFileSync(
  //     'fixtures/keys.json',
  //     JSON.stringify(x.serialized, null, 2)
  //   );
  const privateKeys = await getSerializedFixture(import.meta.dirname, 'fixtures/keys.json', privateCombinationCryptoKeySetSchema);

  // Crypto Service Mock
  const cryptoService = makeCryptoServiceForTesting({ privateKeys });

  // Provenance Parameters
  const provenance = await generateProvenanceForNewSyncableStore(trace, {
    storageRootId,
    cryptoService,
    trustedTimeSignature: undefined
  });
  expectOk(provenance);

  // Single Store
  const storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
  const store = new DefaultSyncableStore({
    storageRootId,
    backing: storeBacking,
    cryptoService,
    creatorPublicKeys: privateKeys.publicOnly(),
    saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
  });

  // Initialize a store (this is a slow operation)
  expectOk(await initializeRoot(trace, store));

  return {
    trace,
    privateKeys,
    cryptoService,
    storeBacking,
    store,
    storageRootId
  };
}
