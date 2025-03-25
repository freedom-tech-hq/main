import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { encId, storageRootIdInfo, syncableItemTypes } from 'freedom-sync-types';
import { expectNotOk, expectOk } from 'freedom-testing-tools';

import type { TestingCryptoService } from '../../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { makeCryptoServiceForTesting } from '../../../__test_dependency__/makeCryptoServiceForTesting.ts';
import type { HotSwappableCryptoService } from '../../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { makeHotSwappableCryptoServiceForTesting } from '../../../__test_dependency__/makeHotSwappableCryptoServiceForTesting.ts';
import { ACCESS_CONTROL_BUNDLE_FILE_ID, STORE_CHANGES_BUNDLE_FILE_ID } from '../../../consts/special-file-ids.ts';
import { InMemorySyncableStoreBacking } from '../../../types/in-memory-backing/InMemorySyncableStoreBacking.ts';
import { InMemorySyncableStore } from '../../../types/InMemorySyncableStore.ts';
import { createBinaryFileAtPath } from '../../../utils/create/createBinaryFileAtPath.ts';
import { createBundleFileAtPath } from '../../../utils/create/createBundleFileAtPath.ts';
import { createFolderAtPath } from '../../../utils/create/createFolderAtPath.ts';
import { createStringFileAtPath } from '../../../utils/create/createStringFileAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../../../utils/generateProvenanceForNewSyncableStore.ts';
import { getDynamicIds } from '../../../utils/get/getDynamicIds.ts';
import { getFolderAtPath } from '../../../utils/get/getFolderAtPath.ts';
import { getStringFromFileAtPath } from '../../../utils/get/getStringFromFileAtPath.ts';
import { initializeRoot } from '../../../utils/initializeRoot.ts';

describe('InMemoryAccessControlledFolder', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: HotSwappableCryptoService;
  let primaryUserCryptoService!: TestingCryptoService;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: InMemorySyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    primaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys });
    cryptoService = makeHotSwappableCryptoServiceForTesting(primaryUserCryptoService);

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    store = new InMemorySyncableStore({ storageRootId, backing: storeBacking, cryptoService, provenance: provenance.value });

    expectOk(await initializeRoot(trace, store));
  });

  it('giving access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeyId: cryptoKeys2.value.id, role: 'editor' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path, encId('test.txt'), 'hello world');
    expectOk(createdTestTxtFile);

    // Should be able to read back that file
    const textContent = await getStringFromFileAtPath(trace, store, testingFolder.value.path.dynamic.append(encId('test.txt')));
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('giving appender (write-only) access to a second user should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);
    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeyId: cryptoKeys2.value.id, role: 'appender' }));

    const secondaryUserCryptoService = makeCryptoServiceForTesting({ cryptoKeys: cryptoKeys2.value });
    secondaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys.publicOnly() });

    cryptoService.hotSwap(secondaryUserCryptoService);

    // Should be able to write new file
    const createdTestTxtFile = await createStringFileAtPath(trace, store, testingFolder.value.path, encId('test.txt'), 'hello world');
    expectOk(createdTestTxtFile);

    // Should NOT be able to read back that file
    const textContent2 = await getStringFromFileAtPath(trace, store, testingFolder.value.path.dynamic.append(encId('test.txt')));
    expectNotOk(textContent2);

    cryptoService.hotSwap(primaryUserCryptoService);

    // Primary user should be able to read back that file
    const textContent = await getStringFromFileAtPath(trace, store, testingFolder.value.path.dynamic.append(encId('test.txt')));
    expectOk(textContent);
    t.assert.strictEqual(textContent.value, 'hello world');
  });

  it('modifying user access should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    primaryUserCryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    expectOk(await testingFolder.value.updateAccess(trace, { type: 'add-access', publicKeyId: cryptoKeys2.value.id, role: 'editor' }));

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
    const outerFolder = await createFolderAtPath(trace, store, store.path, encId('outer'));
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath, encId('inner'));
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const helloWorldTxtFile = await createStringFileAtPath(trace, store, innerPath, encId('hello-world.txt'), 'hello world');
    expectOk(helloWorldTxtFile);
    const helloWorldTxtPath = helloWorldTxtFile.value.path;

    const textValue = await getStringFromFileAtPath(trace, store, helloWorldTxtPath);
    expectOk(textValue);
    t.assert.strictEqual(textValue.value, 'hello world');

    const outerFolder2 = await getFolderAtPath(trace, store, outerPath);
    expectOk(outerFolder2);

    const folderIds = await getDynamicIds(trace, outerFolder2.value, { type: 'folder' });
    expectOk(folderIds);
    t.assert.deepStrictEqual(folderIds.value, [encId('inner')]);

    const innerFolder2 = await getFolderAtPath(trace, store, innerPath);
    expectOk(innerFolder2);

    const fileIds = await getDynamicIds(trace, innerFolder2.value, { type: syncableItemTypes.exclude('folder') });
    expectOk(fileIds);

    t.assert.deepEqual(
      fileIds.value.sort(),
      [ACCESS_CONTROL_BUNDLE_FILE_ID, STORE_CHANGES_BUNDLE_FILE_ID, encId('hello-world.txt')].sort()
    );
  });

  it('creating nested folders and bundles should work', async (t: TestContext) => {
    const outerFolder = await createFolderAtPath(trace, store, store.path, encId('outer'));
    expectOk(outerFolder);
    const outerPath = outerFolder.value.path;

    const innerFolder = await createFolderAtPath(trace, store, outerPath, encId('inner'));
    expectOk(innerFolder);
    const innerPath = innerFolder.value.path;

    const bundle = await createBundleFileAtPath(trace, store, innerPath, encId('my-bundle'));
    expectOk(bundle);
    const myBundlePath = bundle.value.path;

    expectOk(await createBinaryFileAtPath(trace, store, myBundlePath, encId('hello-world.txt'), Buffer.from('hello world', 'utf-8')));

    expectOk(await createBundleFileAtPath(trace, store, myBundlePath, encId('nested-bundle')));

    const fileIds = await getDynamicIds(trace, bundle.value, { type: syncableItemTypes.exclude('folder') });
    expectOk(fileIds);
    t.assert.deepStrictEqual(fileIds.value, [encId('hello-world.txt'), encId('nested-bundle')]);

    const bundleIds = await getDynamicIds(trace, bundle.value, { type: 'bundleFile' });
    expectOk(bundleIds);
    t.assert.deepStrictEqual(bundleIds.value, [encId('nested-bundle')]);
  });
});
