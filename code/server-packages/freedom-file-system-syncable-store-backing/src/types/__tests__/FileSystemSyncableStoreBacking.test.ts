import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { encId, storageRootIdInfo } from 'freedom-sync-types';
import {
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  deleteSyncableItemAtPath,
  generateProvenanceForNewSyncableStore,
  getDynamicIds,
  getFolderAtPath,
  getMutableFolderAtPath,
  getStringFromFileAtPath,
  initializeRoot
} from 'freedom-syncable-store-types';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { FileSystemSyncableStoreBacking } from '../FileSystemSyncableStoreBacking.ts';

describe('FileSystemSyncableStore', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let storeBacking!: FileSystemSyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    cryptoService = makeCryptoServiceForTesting({ cryptoKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'testing-'));
    console.log('rootPath', rootPath);

    storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    expectOk(await storeBacking.initialize(trace, { provenance: provenance.value }));
    store = new DefaultSyncableStore({ storageRootId, backing: storeBacking, cryptoService, provenance: provenance.value });

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
