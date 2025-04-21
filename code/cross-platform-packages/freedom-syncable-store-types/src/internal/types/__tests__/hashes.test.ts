import type { SuiteContext, TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { DEFAULT_SALT_ID, encName, storageRootIdInfo, uuidId } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../../tests/makeCryptoServiceForTesting.ts';
import { DefaultSyncableStore } from '../../../types/DefaultSyncableStore.ts';
import { InMemorySyncableStoreBacking } from '../../../types/in-memory-backing/InMemorySyncableStoreBacking.ts';
import { createBinaryFileAtPath } from '../../../utils/create/createBinaryFileAtPath.ts';
import { createBundleAtPath } from '../../../utils/create/createBundleAtPath.ts';
import { createFolderAtPath } from '../../../utils/create/createFolderAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../../../utils/generateProvenanceForNewSyncableStore.ts';
import { clearDocumentCache } from '../../../utils/get/getConflictFreeDocumentFromBundleAtPath.ts';
import { initializeRoot } from '../../../utils/initializeRoot.ts';

describe('hashes', () => {
  let trace!: Trace;
  let privateKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(clearDocumentCache);

  beforeEach(async (_t: TestContext | SuiteContext) => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    privateKeys = internalCryptoKeys.value;

    cryptoService = makeCryptoServiceForTesting({ privateKeys: privateKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      cryptoService,
      trustedTimeSignature: undefined
    });
    expectOk(provenance);

    storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      cryptoService,
      creatorPublicKeys: privateKeys.publicOnly(),
      saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  it('should be invalidated correctly', async (t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('outer') });
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath.append(uuidId('folder')), { name: encName('inner') });
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const myBundle = await createBundleAtPath(trace, store, innerPath.append(uuidId('bundle')), { name: encName('my-bundle') });
    expectOk(myBundle);
    const myBundlePath = myBundle.value.path;

    const helloWorldTxtFile = await createBinaryFileAtPath(trace, store, myBundlePath.append(uuidId('file')), {
      name: encName('hello-world.txt'),
      value: Buffer.from('hello world', 'utf-8')
    });
    expectOk(helloWorldTxtFile);

    const nestedBundle = await createBundleAtPath(trace, store, myBundlePath.append(uuidId('bundle')), { name: encName('nested-bundle') });
    expectOk(nestedBundle);
    const nestedBundlePath = nestedBundle.value.path;

    const ls1 = await store.ls(trace);
    expectOk(ls1);

    const createdFiles = await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map((letter) =>
        createBinaryFileAtPath(trace, store, nestedBundlePath.append(uuidId('file')), {
          name: encName(`${letter}.txt`),
          value: Buffer.from(letter, 'utf-8')
        })
      )
    );
    for (const createdFile of createdFiles) {
      expectOk(createdFile);
    }

    const ls2 = await store.ls(trace);
    expectOk(ls2);

    t.assert.notDeepEqual(ls1.value, ls2.value);
  });
});
