import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { before, beforeEach, describe, it, skip } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { defaultSaltId, encName, storageRootIdInfo, syncableItemTypes } from 'freedom-sync-types';
import {
  createBinaryFileAtPath,
  createBundleAtPath,
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  deleteSyncableItemAtPath,
  generateProvenanceForNewSyncableStore,
  getFolderAtPath,
  getMutableFolderAtPath,
  getStringFromFileAtPath,
  initializeRoot,
  saltedId
} from 'freedom-syncable-store-types';
import { expectErrorCode, expectIncludes, expectNotOk, expectOk } from 'freedom-testing-tools';

import type { TestingCryptoService } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import type { HotSwappableCryptoService } from '../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { makeHotSwappableCryptoServiceForTesting } from '../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { FileSystemSyncableStoreBacking } from '../FileSystemSyncableStoreBacking.ts';

describe('FileSystemSyncableStore', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: HotSwappableCryptoService;
  let primaryUserCryptoService!: TestingCryptoService;
  let storeBacking!: FileSystemSyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  before(async () => {
    const trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;
  });

  beforeEach(async () => {
    trace = makeTrace('test');

    primaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys });
    cryptoService = makeHotSwappableCryptoServiceForTesting(primaryUserCryptoService);

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'testing-'));
    console.log('rootPath', rootPath);

    storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    expectOk(await storeBacking.initialize(trace, { provenance: provenance.value }));
    store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      cryptoService,
      provenance: provenance.value,
      saltsById: { [defaultSaltId]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  it('deleting files and folders should work', async (t: TestContext) => {
    // Creating folder with default initial access
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    // Creating file
    const helloWorldTxtFile = await createStringFileAtPath(trace, store, testingPath.append(makeUuid()), {
      name: encName('hello-world.txt'),
      value: 'hello world'
    });
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

  it('getIds should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);

    const folderIds = await store.getIds(trace, { type: 'folder' });
    expectOk(folderIds);
    expectIncludes(folderIds.value, testingFolder.value.path.lastId);
  });

  it('getFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });

  it('getMutableFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getMutableFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });

  it('giving access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeyId: cryptoKeys2.value.id, role: 'editor' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(makeUuid()), {
      name: encName('test.txt'),
      value: 'hello world'
    });
    expectOk(createdTestTxtFile);

    // Should be able to read back that file
    const textContent = await getStringFromFileAtPath(trace, store, createdTestTxtFile.value.path);
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('giving appender (write-only) access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeyId: cryptoKeys2.value.id, role: 'appender' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(makeUuid()), {
      name: encName('test.txt'),
      value: 'hello world'
    });
    expectOk(createdTestTxtFile);

    // Should NOT be able to read back that file
    const textContent2 = await getStringFromFileAtPath(trace, store, createdTestTxtFile.value.path);
    expectNotOk(textContent2);

    cryptoService.hotSwap(primaryUserCryptoService);

    // Primary user should be able to read back that file
    const textContent = await getStringFromFileAtPath(trace, store, createdTestTxtFile.value.path);
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  // TODO: work on these
  skip('creating nested folders and bundles should work', async (_t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path.append(makeUuid()), { name: encName('outer') });
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath.append(makeUuid()), { name: encName('inner') });
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const bundle = await createBundleAtPath(trace, store, innerPath.append(makeUuid()), { name: encName('my-bundle') });
    expectOk(bundle);
    const myBundlePath = bundle.value.path;

    const helloWorldTxtFile = await createBinaryFileAtPath(trace, store, myBundlePath.append(makeUuid()), {
      name: encName('hello-world.txt'),
      value: Buffer.from('hello world', 'utf-8')
    });
    expectOk(helloWorldTxtFile);

    const nestedBundle = await createBundleAtPath(trace, store, myBundlePath.append(makeUuid()), { name: encName('nested-bundle') });
    expectOk(nestedBundle);

    const fileIds = await bundle.value.getIds(trace, { type: syncableItemTypes.exclude('folder') });
    expectOk(fileIds);
    expectIncludes(fileIds.value, helloWorldTxtFile.value.path.lastId);
    expectIncludes(fileIds.value, nestedBundle.value.path.lastId);

    const bundleIds = await bundle.value.getIds(trace, { type: 'bundle' });
    expectOk(bundleIds);
    expectIncludes(bundleIds.value, nestedBundle.value.path.lastId);
  });

  // TODO: work on these
  skip('salted IDs should work', async (_t: TestContext) => {
    const outerId = saltedId('outer');
    const innerId = saltedId('inner');
    const myBundleId = saltedId('my-bundle');
    const helloWorldTxtId = saltedId('hello-world.txt');
    const nestedBundleId = saltedId('nested-bundle');

    const outerFolder = await createFolderAtPath(trace, store, store.path.append(await outerId(store)), { name: encName('outer') });
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath.append(await innerId(store)), { name: encName('inner') });
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const bundle = await createBundleAtPath(trace, store, innerPath.append(await myBundleId(store)), { name: encName('my-bundle') });
    expectOk(bundle);
    const myBundlePath = bundle.value.path;

    const helloWorldTxtFile = await createBinaryFileAtPath(trace, store, myBundlePath.append(await helloWorldTxtId(store)), {
      name: encName('hello-world.txt'),
      value: Buffer.from('hello world', 'utf-8')
    });
    expectOk(helloWorldTxtFile);

    const nestedBundle = await createBundleAtPath(trace, store, myBundlePath.append(await nestedBundleId(store)), {
      name: encName('nested-bundle')
    });
    expectOk(nestedBundle);

    const fileIds = await bundle.value.getIds(trace, { type: syncableItemTypes.exclude('folder') });
    expectOk(fileIds);
    expectIncludes(fileIds.value, helloWorldTxtFile.value.path.lastId);
    expectIncludes(fileIds.value, nestedBundle.value.path.lastId);

    const bundleIds = await bundle.value.getIds(trace, { type: 'bundle' });
    expectOk(bundleIds);
    expectIncludes(bundleIds.value, nestedBundle.value.path.lastId);
  });
});
