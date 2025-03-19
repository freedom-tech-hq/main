import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { encId, storageRootIdInfo } from 'freedom-sync-types';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { createFolderAtPath } from 'freedom-syncable-store-types';
import { createStringFileAtPath } from 'freedom-syncable-store-types';
import { deleteSyncableItemAtPath } from 'freedom-syncable-store-types';
import { generateProvenanceForNewSyncableStore } from 'freedom-syncable-store-types';
import { getDynamicIds } from 'freedom-syncable-store-types';
import { getFolderAtPath } from 'freedom-syncable-store-types';
import { getMutableFolderAtPath } from 'freedom-syncable-store-types';
import { getStringFromFileAtPath } from 'freedom-syncable-store-types';
import { initializeRoot } from 'freedom-syncable-store-types';
import { FSSyncableStore } from '../FSSyncableStore.ts';

const DATA_PATH = import.meta.dirname + '/data';

describe('FSSyncableStore', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let store!: FSSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    cryptoService = makeCryptoServiceForTesting({ cryptoKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    store = new FSSyncableStore({ storageRootId, cryptoService, provenance: provenance.value, fsDirectory: DATA_PATH });

    expectOk(await initializeRoot(trace, store));
  });

  it('deleting files and folders should work', async (t: TestContext) => {
    // Creating folder with default initial access
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    // Creating file
    const helloWorldTxtFile = await createStringFileAtPath(trace, store, testingPath, encId('hello-world.txt'), 'hello world');
    expectOk(helloWorldTxtFile);
    const helloWorldTxtPath = helloWorldTxtFile.value.path;

    const helloWorldStringContent = await getStringFromFileAtPath(trace, store, helloWorldTxtPath);
    expectOk(helloWorldStringContent);
    t.assert.strictEqual(helloWorldStringContent.value, 'hello world');

    // Deleting file
    expectOk(await deleteSyncableItemAtPath(trace, store, helloWorldTxtPath));

    expectErrorCode(await getStringFromFileAtPath(trace, store, helloWorldTxtPath), 'deleted');

    // Deleting folder
    expectOk(await deleteSyncableItemAtPath(trace, store, testingPath));

    expectErrorCode(await getFolderAtPath(trace, store, testingPath), 'deleted');
  });

  it('getIds should work', async (t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);

    const folderIds = await getDynamicIds(trace, store, { type: 'folder' });
    expectOk(folderIds);
    t.assert.deepStrictEqual(folderIds.value, [encId('testing')]);
  });

  it('getFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });

  it('getMutableFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getMutableFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });
});
