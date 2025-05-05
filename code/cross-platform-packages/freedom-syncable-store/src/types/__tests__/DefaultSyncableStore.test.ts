import type { TestContext } from 'node:test';
import { afterEach, describe, it } from 'node:test';

import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { encName, uuidId } from 'freedom-sync-types';
import { expectErrorCode, expectIncludes, expectOk, expectStrictEqual } from 'freedom-testing-tools';

import { createStoreTestStack } from '../../tests/createStoreTestStack.ts';
import { createFolderAtPath } from '../../utils/create/createFolderAtPath.ts';
import { createStringFileAtPath } from '../../utils/create/createStringFileAtPath.ts';
import { deleteSyncableItemAtPath } from '../../utils/deleteSyncableItemAtPath.ts';
import { getFolderAtPath } from '../../utils/get/getFolderAtPath.ts';
import { getMutableFolderAtPath } from '../../utils/get/getMutableFolderAtPath.ts';
import { getStringFromFile } from '../../utils/get/getStringFromFile.ts';
import { getSyncableAtPath } from '../../utils/get/getSyncableAtPath.ts';
import { isSyncableDeleted } from '../../utils/isSyncableDeleted.ts';

describe('DefaultSyncableStore', () => {
  afterEach(invalidateAllInMemoryCaches);

  it('deleting files and folders should work', async (t: TestContext) => {
    const { trace, store } = await createStoreTestStack();

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

    const helloWorldTxtItem = await getSyncableAtPath(trace, store, helloWorldTxtPath);
    expectOk(helloWorldTxtItem);

    expectStrictEqual((await isSyncableDeleted(trace, store, helloWorldTxtPath, { recursive: false })).value, true);

    expectErrorCode(await getStringFromFile(trace, store, helloWorldTxtPath), 'deleted');

    // Deleting folder
    expectOk(await deleteSyncableItemAtPath(trace, store, testingPath));

    expectStrictEqual((await isSyncableDeleted(trace, store, testingPath, { recursive: false })).value, true);
  });

  it('getIds should work', async (_t: TestContext) => {
    const { trace, store } = await createStoreTestStack();

    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);

    const folderIds = await store.getIds(trace, { type: 'folder' });
    expectOk(folderIds);
    expectIncludes(folderIds.value, testingFolder.value.path.lastId);
  });

  it('getFolderAtPath should work', async (_t: TestContext) => {
    const { trace, store } = await createStoreTestStack();

    // TODO: TEMP
    store.devLogging.setShouldRecordLogs(true);

    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getFolderAtPath(trace, store, testingPath);
    expectOk(folder);

    // TODO: TEMP
    // console.log('NUM ENTRIES', store.devLogging.getLogEntries().length);
    // for (const entry of store.devLogging.getLogEntries()) {
    //   console.log('FOO', JSON.stringify(entry));
    // }
  });

  it('getMutableFolderAtPath should work', async (_t: TestContext) => {
    const { trace, store } = await createStoreTestStack();

    // Creating folder
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const folder = await getMutableFolderAtPath(trace, store, testingPath);
    expectOk(folder);
  });
});
