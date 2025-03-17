import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { encId, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { InMemorySyncableStore } from '../../types/InMemorySyncableStore.ts';
import { createFolderAtPath } from '../create/createFolderAtPath.ts';
import { createJsonFileAtPath } from '../create/createJsonFileAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../generateProvenanceForNewSyncableStore.ts';
import { getJsonFromFileAtPath } from '../get/getJsonFromFileAtPath.ts';
import { initializeRoot } from '../initializeRoot.ts';

const theSchema = schema.object({ one: schema.string(), two: schema.number() });

describe('createJsonFileAtPath', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let store!: InMemorySyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    cryptoService = makeCryptoServiceForTesting({ cryptoKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    store = new InMemorySyncableStore({ storageRootId, cryptoService, provenance: provenance.value });

    expectOk(await initializeRoot(trace, store));
  });

  it('should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const helloJsonFile = await createJsonFileAtPath(
      trace,
      store,
      testingPath,
      encId('hello.json'),
      { one: 'hello', two: 3.14 },
      theSchema
    );
    expectOk(helloJsonFile);
    const helloJsonPath = helloJsonFile.value.path;

    const objValue = await getJsonFromFileAtPath(trace, store, helloJsonPath, theSchema);
    expectOk(objValue);
    t.assert.deepStrictEqual(objValue.value, { one: 'hello', two: 3.14 });
  });
});
