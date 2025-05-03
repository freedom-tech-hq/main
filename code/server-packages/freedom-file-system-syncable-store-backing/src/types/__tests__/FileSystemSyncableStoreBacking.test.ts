import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { DEFAULT_SALT_ID, encName, storageRootIdInfo, syncableItemTypes, uuidId } from 'freedom-sync-types';
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
  getStringFromFile,
  initializeRoot,
  isSyncableDeleted
} from 'freedom-syncable-store';
import { saltedId } from 'freedom-syncable-store-types';
import { expectErrorCode, expectIncludes, expectNotOk, expectOk, expectStrictEqual } from 'freedom-testing-tools';

import type { HotSwappableUserKeys } from '../../__test_dependency__/makeHotSwappableUserKeysForTesting.ts';
import { makeHotSwappableUserKeysForTesting } from '../../__test_dependency__/makeHotSwappableUserKeysForTesting.ts';
import { makeUserKeysForTesting } from '../../__test_dependency__/makeUserKeysForTesting.ts';
import { FileSystemSyncableStoreBacking } from '../FileSystemSyncableStoreBacking.ts';

describe('FileSystemSyncableStore', () => {
  afterEach(invalidateAllInMemoryCaches);

  let trace!: Trace;
  let privateKeys!: PrivateCombinationCryptoKeySet;
  let userKeys!: HotSwappableUserKeys;
  let primaryUserKeys!: UserKeys;
  let storeBacking!: FileSystemSyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  before(async () => {
    const trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    privateKeys = internalCryptoKeys.value;
  });

  beforeEach(async () => {
    trace = makeTrace('test');

    primaryUserKeys = makeUserKeysForTesting({ privateKeys: privateKeys });
    userKeys = makeHotSwappableUserKeysForTesting(primaryUserKeys);

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      userKeys,
      trustedTimeSignature: undefined
    });
    expectOk(provenance);

    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'testing-'));
    console.log('rootPath', rootPath);

    storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    expectOk(await storeBacking.initialize(trace, { provenance: provenance.value }));
    store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      userKeys,
      creatorPublicKeys: privateKeys.publicOnly(),
      saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  it('deleting files and folders should work', async (t: TestContext) => {
    // Creating folder with default initial access
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    // Creating file
    const helloWorldTxtFile = await createStringFileAtPath(trace, store, testingPath.append(uuidId('file')), {
      name: encName('hello-world.txt'),
      value: 'hello world'
    });
    expectOk(helloWorldTxtFile);
    const helloWorldTxtPath = helloWorldTxtFile.value.path;

    const helloWorldStringContent = await getStringFromFile(trace, store, helloWorldTxtPath);
    expectOk(helloWorldStringContent);
    t.assert.strictEqual(helloWorldStringContent.value, 'hello world');

    // Deleting file
    expectOk(await deleteSyncableItemAtPath(trace, store, helloWorldTxtPath));

    expectErrorCode(await getStringFromFile(trace, store, helloWorldTxtPath), 'deleted');

    // Deleting folder
    expectOk(await deleteSyncableItemAtPath(trace, store, testingPath));

    expectStrictEqual((await isSyncableDeleted(trace, store, testingPath, { recursive: false })).value, true);
  });

  it('getIds should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const folderIds = await store.getIds(trace, { type: 'folder' });
    expectOk(folderIds);
    expectIncludes(folderIds.value, testingFolder.value.path.lastId);
  });

  it('getFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });

  it('getMutableFolderAtPath should work', async (_t: TestContext) => {
    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getMutableFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });

  it('giving root folder access to a second user should work', async (t: TestContext) => {
    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    expectOk(await store.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value.publicOnly(), role: 'editor' }));

    const secondaryUserKeys = makeUserKeysForTesting({ privateKeys: cryptoKeys2.value });

    userKeys.hotSwap(secondaryUserKeys);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, store.path.append(uuidId('file')), {
      name: encName('test.txt'),
      value: 'hello world'
    });
    expectOk(createdTestTxtFile);

    // Should be able to read back that file
    const textContent = await getStringFromFile(trace, store, createdTestTxtFile.value.path);
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('giving access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    expectOk(
      await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value.publicOnly(), role: 'editor' })
    );

    const secondaryUserKeys = makeUserKeysForTesting({ privateKeys: cryptoKeys2.value });

    userKeys.hotSwap(secondaryUserKeys);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(uuidId('file')), {
      name: encName('test.txt'),
      value: 'hello world'
    });
    expectOk(createdTestTxtFile);

    // Should be able to read back that file
    const textContent = await getStringFromFile(trace, store, createdTestTxtFile.value.path);
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('giving appender (write-only) access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    expectOk(
      await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value.publicOnly(), role: 'appender' })
    );

    const secondaryUserKeys = makeUserKeysForTesting({ privateKeys: cryptoKeys2.value });

    userKeys.hotSwap(secondaryUserKeys);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(uuidId('file')), {
      name: encName('test.txt'),
      value: 'hello world'
    });
    expectOk(createdTestTxtFile);

    // Should NOT be able to read back that file
    const textContent2 = await getStringFromFile(trace, store, createdTestTxtFile.value.path);
    expectNotOk(textContent2);

    userKeys.hotSwap(primaryUserKeys);

    // Primary user should be able to read back that file
    const textContent = await getStringFromFile(trace, store, createdTestTxtFile.value.path);
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('creating nested folders and bundles should work', async (_t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('outer') });
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath.append(uuidId('folder')), { name: encName('inner') });
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const bundle = await createBundleAtPath(trace, store, innerPath.append(uuidId('bundle')), { name: encName('my-bundle') });
    expectOk(bundle);
    const myBundlePath = bundle.value.path;

    const helloWorldTxtFile = await createBinaryFileAtPath(trace, store, myBundlePath.append(uuidId('file')), {
      name: encName('hello-world.txt'),
      value: Buffer.from('hello world', 'utf-8')
    });
    expectOk(helloWorldTxtFile);

    const nestedBundle = await createBundleAtPath(trace, store, myBundlePath.append(uuidId('bundle')), { name: encName('nested-bundle') });
    expectOk(nestedBundle);

    const fileIds = await bundle.value.getIds(trace, { type: syncableItemTypes.exclude('folder') });
    expectOk(fileIds);
    expectIncludes(fileIds.value, helloWorldTxtFile.value.path.lastId);
    expectIncludes(fileIds.value, nestedBundle.value.path.lastId);

    const bundleIds = await bundle.value.getIds(trace, { type: 'bundle' });
    expectOk(bundleIds);
    expectIncludes(bundleIds.value, nestedBundle.value.path.lastId);
  });

  it('salted IDs should work', async (_t: TestContext) => {
    const outerId = saltedId('folder', 'outer');
    const innerId = saltedId('folder', 'inner');
    const myBundleId = saltedId('bundle', 'my-bundle');
    const helloWorldTxtId = saltedId('file', 'hello-world.txt');
    const nestedBundleId = saltedId('bundle', 'nested-bundle');

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
