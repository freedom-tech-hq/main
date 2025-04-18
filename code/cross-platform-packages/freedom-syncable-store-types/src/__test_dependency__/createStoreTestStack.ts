import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from './makeCryptoServiceForTesting.ts';
import { generateProvenanceForNewSyncableStore } from '../utils/generateProvenanceForNewSyncableStore.ts';
import { initializeRoot } from '../utils/initializeRoot.ts';
import { DefaultSyncableStore } from '../types/DefaultSyncableStore.ts';
import { InMemorySyncableStoreBacking } from '../types/in-memory-backing/InMemorySyncableStoreBacking.ts';

export const storageRootId = storageRootIdInfo.make('test');

export async function createStoreTestStack() {
  const trace = makeTrace('test');

  const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
  expectOk(internalCryptoKeys);
  const privateKeys = internalCryptoKeys.value;

  const cryptoService = makeCryptoServiceForTesting({ privateKeys });

  const provenance = await generateProvenanceForNewSyncableStore(trace, {
    storageRootId,
    cryptoService,
    trustedTimeSignature: undefined
  });
  expectOk(provenance);

  const storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
  const store = new DefaultSyncableStore({
    storageRootId,
    backing: storeBacking,
    cryptoService,
    creatorPublicKeys: privateKeys.publicOnly(),
    saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
  });

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
