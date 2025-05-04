import type { TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, encName, storageRootIdInfo, uuidId } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { makeUserKeysForTesting } from '../../tests/makeUserKeysForTesting.ts';
import { DefaultSyncableStore } from '../../types/DefaultSyncableStore.ts';
import { createFolderAtPath } from '../create/createFolderAtPath.ts';
import { createJsonFileAtPath } from '../create/createJsonFileAtPath.ts';
import { generateProvenanceForNewSyncableStore } from '../generateProvenanceForNewSyncableStore.ts';
import { getJsonFromFile } from '../get/getJsonFromFile.ts';
import { initializeRoot } from '../initializeRoot.ts';

const theSchema = schema.object({ one: schema.string(), two: schema.number() });

describe('createJsonFileAtPath', () => {
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

    const helloJsonFile = await createJsonFileAtPath(trace, store, testingPath.append(uuidId('file')), {
      name: encName('hello.json'),
      value: { one: 'hello', two: 3.14 },
      schema: theSchema
    });
    expectOk(helloJsonFile);
    const helloJsonPath = helloJsonFile.value.path;

    const objValue = await getJsonFromFile(trace, store, helloJsonPath, theSchema);
    expectOk(objValue);
    t.assert.deepStrictEqual(objValue.value, { one: 'hello', two: 3.14 });
  });
});
