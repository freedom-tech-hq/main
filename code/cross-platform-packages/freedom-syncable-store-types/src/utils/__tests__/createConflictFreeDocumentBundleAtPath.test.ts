import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { encId, storageRootIdInfo } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { InMemorySyncableStoreBacking } from '../../types/in-memory-backing/InMemorySyncableStoreBacking.ts';
import { InMemorySyncableStore } from '../../types/InMemorySyncableStore.ts';
import { createConflictFreeDocumentBundleAtPath } from '../create/createConflictFreeDocumentBundleAtPath.ts';
import { createFolderAtPath } from '../create/createFolderAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../generateProvenanceForNewSyncableStore.ts';
import { getConflictFreeDocumentFromBundleAtPath } from '../get/getConflictFreeDocumentFromBundleAtPath.ts';
import { initializeRoot } from '../initializeRoot.ts';

describe('createConflictFreeDocumentBundleAtPath', () => {
  let trace!: Trace;
  let cryptoKeys!: PrivateCombinationCryptoKeySet;
  let cryptoService!: CryptoService;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: InMemorySyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    cryptoKeys = internalCryptoKeys.value;

    cryptoService = makeCryptoServiceForTesting({ cryptoKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, { storageRootId, cryptoService });
    expectOk(provenance);

    storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    store = new InMemorySyncableStore({ storageRootId, backing: storeBacking, cryptoService, provenance: provenance.value });

    expectOk(await initializeRoot(trace, store));
  });

  it('should work', async (t: TestContext) => {
    const testingFolder = await createFolderAtPath(trace, store, store.path, encId('testing'));
    expectOk(testingFolder);
    const testingPath = testingFolder.value.path;

    const newDocument = (snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<'TEST_'> }) =>
      new ConflictFreeDocument('TEST_', snapshot);

    const doc = await createConflictFreeDocumentBundleAtPath(trace, store, testingPath, encId('doc'), { newDocument });
    expectOk(doc);
    const docPath = doc.value.path;

    const nameField = doc.value.document.generic.getRestrictedTextField('name', '');
    nameField.set('test user');

    const saved = await doc.value.save(trace);
    expectOk(saved);

    const loadedDoc = await getConflictFreeDocumentFromBundleAtPath(trace, store, docPath, {
      newDocument,
      isSnapshotValid: async () => makeSuccess(true),
      isDeltaValidForDocument: async () => makeSuccess(true)
    });
    expectOk(loadedDoc);

    const loadedNameField = loadedDoc.value.generic.getRestrictedTextField('name', '');
    t.assert.strictEqual(loadedNameField.get(), 'test user');
  });
});
