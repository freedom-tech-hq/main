import type { SuiteContext, TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { encId, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { InMemorySyncableStore } from '../../../types/InMemorySyncableStore.ts';
import { createBinaryFileAtPath } from '../../../utils/create/createBinaryFileAtPath.ts';
import { createBundleFileAtPath } from '../../../utils/create/createBundleFileAtPath.ts';
import { createFolderAtPath } from '../../../utils/create/createFolderAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../../../utils/generateProvenanceForNewSyncableStore.ts';
import { initializeRoot } from '../../../utils/initializeRoot.ts';

describe('hashes', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let store!: InMemorySyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async (_t: TestContext | SuiteContext) => {
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

  it('should be invalidated correctly', async (t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path, encId('outer'));
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath, encId('inner'));
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const myBundle = await createBundleFileAtPath(trace, store, innerPath, encId('my-bundle'));
    expectOk(myBundle);
    const myBundlePath = myBundle.value.path;

    const helloWorldTxtFile = await createBinaryFileAtPath(
      trace,
      store,
      myBundlePath,
      encId('hello-world.txt'),
      Buffer.from('hello world', 'utf-8')
    );
    expectOk(helloWorldTxtFile);

    const nestedBundle = await createBundleFileAtPath(trace, store, myBundlePath, encId('nested-bundle'));
    expectOk(nestedBundle);
    const nestedBundlePath = nestedBundle.value.path;

    const ls1 = await store.ls(trace);
    expectOk(ls1);

    const createdFiles = await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map((letter) =>
        createBinaryFileAtPath(trace, store, nestedBundlePath, encId(`${letter}.txt`), Buffer.from(letter, 'utf-8'))
      )
    );
    for (const createdFile of createdFiles) {
      expectOk(createdFile);
    }

    const ls2 = await store.ls(trace);
    expectOk(ls2);

    expectOk(await store.getHash(trace, { recompute: true }));

    const ls3 = await store.ls(trace);
    expectOk(ls3);
    t.assert.deepStrictEqual(ls2.value, ls3.value);

    t.assert.notDeepEqual(ls1.value, ls2.value);
  });
});
