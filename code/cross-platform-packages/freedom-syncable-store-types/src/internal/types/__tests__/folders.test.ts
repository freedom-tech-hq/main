import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { DEFAULT_SALT_ID, encName, storageRootIdInfo, syncableItemTypes, uuidId } from 'freedom-sync-types';
import { expectIncludes, expectNotOk, expectOk } from 'freedom-testing-tools';

import type { TestingCryptoService } from '../../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { makeCryptoServiceForTesting } from '../../../__test_dependency__/makeCryptoServiceForTesting.ts';
import type { HotSwappableCryptoService } from '../../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { makeHotSwappableCryptoServiceForTesting } from '../../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { ACCESS_CONTROL_BUNDLE_ID, STORE_CHANGES_BUNDLE_ID } from '../../../consts/special-file-ids.ts';
import { DefaultSyncableStore } from '../../../types/DefaultSyncableStore.ts';
import { InMemorySyncableStoreBacking } from '../../../types/in-memory-backing/InMemorySyncableStoreBacking.ts';
import { createBinaryFileAtPath } from '../../../utils/create/createBinaryFileAtPath.ts';
import { createBundleAtPath } from '../../../utils/create/createBundleAtPath.ts';
import { createFolderAtPath } from '../../../utils/create/createFolderAtPath.ts';
import { createStringFileAtPath } from '../../../utils/create/createStringFileAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../../../utils/generateProvenanceForNewSyncableStore.ts';
import { getFolderAtPath } from '../../../utils/get/getFolderAtPath.ts';
import { getStringFromFileAtPath } from '../../../utils/get/getStringFromFileAtPath.ts';
import { initializeRoot } from '../../../utils/initializeRoot.ts';
import { saltedId } from '../../../utils/saltedId.ts';

describe('folders', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: HotSwappableCryptoService;
  let primaryUserCryptoService!: TestingCryptoService;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    primaryUserCryptoService = makeCryptoServiceForTesting({ privateKeys: cryptoKeys });
    cryptoService = makeHotSwappableCryptoServiceForTesting(primaryUserCryptoService);

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
      creatorPublicKeys: cryptoKeys.publicOnly(),
      saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  it('giving access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), {
      name: encName('testing')
    });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value, role: 'editor' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ privateKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(uuidId('file')), {
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
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value, role: 'appender' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ privateKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path.append(uuidId('file')), {
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

  it('modifying user access should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeys: cryptoKeys2.value, role: 'editor' }));

    expectOk(
      await testingFolder.value.updateAccess(trace, {
        type: 'modify-access',
        publicKeyId: cryptoKeys2.value.id,
        oldRole: 'editor',
        newRole: 'viewer'
      })
    );

    const rolesByCryptoKeySetId = await testingFolder.value.getRolesByCryptoKeySetId(trace, {
      cryptoKeySetIds: [cryptoKeys.id, cryptoKeys2.value.id]
    });
    expectOk(rolesByCryptoKeySetId);

    t.assert.deepStrictEqual(rolesByCryptoKeySetId.value, {
      [cryptoKeys.id]: 'creator',
      [cryptoKeys2.value.id]: 'viewer'
    });
  });

  it('creating nested folders and files should work', async (t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('outer') });
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath.append(uuidId('folder')), { name: encName('inner') });
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const helloWorldTxtFile = await createStringFileAtPath(trace, store, innerPath.append(uuidId('file')), {
      name: encName('hello-world.txt'),
      value: 'hello world'
    });
    expectOk(helloWorldTxtFile);
    const helloWorldTxtPath = helloWorldTxtFile.value.path;

    const textValue = await getStringFromFileAtPath(trace, store, helloWorldTxtPath);
    expectOk(textValue);
    t.assert.strictEqual(textValue.value, 'hello world');

    const outerFolder2 = await getFolderAtPath(trace, store, outerPath);
    expectOk(outerFolder2);

    const outerFolderItemIds = await outerFolder2.value.getIds(trace);
    expectOk(outerFolderItemIds);
    expectIncludes(outerFolderItemIds.value, ACCESS_CONTROL_BUNDLE_ID);
    expectIncludes(outerFolderItemIds.value, STORE_CHANGES_BUNDLE_ID);
    expectIncludes(outerFolderItemIds.value, innerFolder.value.path.lastId);

    const innerFolder2 = await getFolderAtPath(trace, store, innerPath);
    expectOk(innerFolder2);

    const innerFolderItemIds = await innerFolder2.value.getIds(trace);
    expectOk(innerFolderItemIds);
    expectIncludes(innerFolderItemIds.value, ACCESS_CONTROL_BUNDLE_ID);
    expectIncludes(innerFolderItemIds.value, STORE_CHANGES_BUNDLE_ID);
    expectIncludes(innerFolderItemIds.value, helloWorldTxtFile.value.path.lastId!);
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
