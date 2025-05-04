import type { TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, encName, storageRootIdInfo, uuidId } from 'freedom-sync-types';
import type { ConflictFreeDocumentEvaluator } from 'freedom-syncable-store-types';
import { expectOk } from 'freedom-testing-tools';

import { makeUserKeysForTesting } from '../../tests/makeUserKeysForTesting.ts';
import { DefaultSyncableStore } from '../../types/DefaultSyncableStore.ts';
import { createConflictFreeDocumentBundleAtPath } from '../create/createConflictFreeDocumentBundleAtPath.ts';
import { createFolderAtPath } from '../create/createFolderAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../generateProvenanceForNewSyncableStore.ts';
import { getConflictFreeDocumentFromBundleAtPath } from '../get/getConflictFreeDocumentFromBundleAtPath.ts';
import { getMutableConflictFreeDocumentFromBundleAtPath } from '../get/getMutableConflictFreeDocumentFromBundleAtPath.ts';
import { initializeRoot } from '../initializeRoot.ts';

describe('createConflictFreeDocumentBundleAtPath', () => {
  let trace!: Trace;
  let privateKeys!: PrivateCombinationCryptoKeySet;
  let userKeys!: UserKeys;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(invalidateAllInMemoryCaches);

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    privateKeys = internalCryptoKeys.value;

    userKeys = makeUserKeysForTesting({ privateKeys: privateKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      userKeys,
      trustedTimeSignature: undefined
    });
    expectOk(provenance);

    storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      userKeys,
      creatorPublicKeys: privateKeys.publicOnly(),
      saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  it('should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), { name: encName('testing') });
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const documentEvaluator: ConflictFreeDocumentEvaluator<'TEST_', ConflictFreeDocument<'TEST_'>> = {
      loadDocument: (snapshot) => new ConflictFreeDocument('TEST_', snapshot),
      isSnapshotValid: async () => makeSuccess(true),
      isDeltaValidForDocument: async () => makeSuccess(true)
    };

    const docPath = testingPath.append(uuidId('bundle'));
    const createdDoc = await createConflictFreeDocumentBundleAtPath(trace, store, docPath, {
      newDocument: () => new ConflictFreeDocument('TEST_'),
      name: encName('doc')
    });
    expectOk(createdDoc);

    const doc2 = await getMutableConflictFreeDocumentFromBundleAtPath(trace, store, docPath, documentEvaluator);
    expectOk(doc2);

    const nameField = doc2.value.document.generic.getRestrictedTextField('name', '');
    nameField.set('test user');

    const saved = await doc2.value.save(trace);
    expectOk(saved);

    const loadedDoc = await getConflictFreeDocumentFromBundleAtPath(trace, store, docPath, documentEvaluator);
    expectOk(loadedDoc);

    const loadedNameField = loadedDoc.value.document.generic.getRestrictedTextField('name', '');
    t.assert.strictEqual(loadedNameField.get(), 'test user');
  });
});
