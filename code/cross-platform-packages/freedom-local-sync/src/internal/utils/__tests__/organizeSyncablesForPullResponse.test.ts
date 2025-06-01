import type { SuiteContext, TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'expect';
import { sha256HashInfo } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { makeUserKeysForTesting } from 'freedom-crypto-service/tests';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import type { SyncGlob } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, plainId, storageRootIdInfo, SyncablePathPattern } from 'freedom-sync-types';
import {
  createBundleAtPath,
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  findSyncables,
  generateProvenanceForNewSyncableStore,
  initializeRoot
} from 'freedom-syncable-store';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import { expectDeepStrictEqual, expectOk } from 'freedom-testing-tools';

import { getLocalHashesRelativeToBasePathWithGlob } from '../../../utils/getLocalHashesRelativeToBasePathWithPatterns.ts';
import { organizeSyncablesForPullResponse } from '../organizeSyncablesForPullResponse.ts';

describe('organizeSyncablesForPullResponse', () => {
  let trace!: Trace;
  let privateKeys!: PrivateCombinationCryptoKeySet;
  let userKeys!: UserKeys;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(invalidateAllInMemoryCaches);

  beforeEach(async (_t: TestContext | SuiteContext) => {
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

  beforeEach(async () => {
    expectOk(await createFolderAtPath(trace, store, store.path.append(plainId('folder', 'test-folder'))));

    expectOk(await createBundleAtPath(trace, store, store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'))));

    expectOk(
      await createStringFileAtPath(
        trace,
        store,
        store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing1.txt')),
        { value: 'Hello World!' }
      )
    );

    expectOk(
      await createStringFileAtPath(
        trace,
        store,
        store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing2.txt')),
        { value: 'Goodbye World!' }
      )
    );

    expectOk(
      await createStringFileAtPath(
        trace,
        store,
        store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing3.txt')),
        { value: 'A' }
      )
    );

    expectOk(
      await createStringFileAtPath(
        trace,
        store,
        store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing4.txt')),
        { value: 'B' }
      )
    );

    expectOk(
      await createStringFileAtPath(
        trace,
        store,
        store.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing5.txt')),
        { value: 'C' }
      )
    );
  });

  it('organizing the root should return in-sync for all its items when using all the local hashes (which are guaranteed to be in sync) for localHashesRelativeToBasePath', async () => {
    const found = await findSyncables(trace, store, { basePath: store.path, glob: { include: [new SyncablePathPattern()] } });
    expectOk(found);

    const hashes = await getLocalHashesRelativeToBasePathWithGlob(trace, store, {
      basePath: store.path,
      glob: { include: [new SyncablePathPattern('**')] }
    });
    expectOk(hashes);

    const organized = await organizeSyncablesForPullResponse(trace, store, {
      basePath: store.path,
      items: found.value,
      localHashesRelativeToBasePath: hashes.value,
      sendData: true
    });
    expectOk(organized);

    expectDeepStrictEqual(organized.value, {
      itemsById: {
        'EyTF._test-folder': 'in-sync',
        'EnTb._access-control': 'in-sync'
      }
    });
  });

  it('organizing the root should return hashes for all its items when using empty localHashesRelativeToBasePath', async () => {
    const glob: SyncGlob = { include: [new SyncablePathPattern()] };

    const found = await findSyncables(trace, store, { basePath: store.path, glob });
    expectOk(found);

    const organized = await organizeSyncablesForPullResponse(trace, store, {
      basePath: store.path,
      items: found.value,
      localHashesRelativeToBasePath: {},
      sendData: true
    });
    expectOk(organized);

    expect(organized.value).toEqual({
      itemsById: {
        'EyTF._test-folder': ANY_SHA256_HASH,
        'EnTb._access-control': ANY_SHA256_HASH
      }
    });
  });

  it('organizing the root and all contents should return everything when using empty localHashesRelativeToBasePath', async () => {
    const glob: SyncGlob = { include: [new SyncablePathPattern('**')] };

    const found = await findSyncables(trace, store, { basePath: store.path, glob });
    expectOk(found);

    const organized = await organizeSyncablesForPullResponse(trace, store, {
      basePath: store.path,
      items: found.value,
      localHashesRelativeToBasePath: {},
      sendData: true
    });
    expectOk(organized);

    expect(organized.value).toEqual({
      itemsById: {
        'EyTF._test-folder': {
          metadata: ANY_METADATA,
          itemsById: {
            'EnTb._access-control': {
              metadata: ANY_METADATA,
              itemsById: expect.objectContaining({
                'EnTb._snapshots': { metadata: ANY_METADATA, itemsById: ANY_OBJECT }
              })
            },
            'EyTb._test-bundle': {
              metadata: ANY_METADATA,
              itemsById: {
                'EyTf._testing1.txt': ANY_FILE_ITEM,
                'EyTf._testing2.txt': ANY_FILE_ITEM,
                'EyTf._testing3.txt': ANY_FILE_ITEM,
                'EyTf._testing4.txt': ANY_FILE_ITEM,
                'EyTf._testing5.txt': ANY_FILE_ITEM
              }
            }
          }
        },
        'EnTb._access-control': {
          metadata: ANY_METADATA,
          itemsById: expect.objectContaining({
            'EnTb._snapshots': { metadata: ANY_METADATA, itemsById: ANY_OBJECT }
          })
        }
      }
    });
  });

  it('organizing the test folder and everything in its access control bundle should work', async () => {
    const glob: SyncGlob = { include: [new SyncablePathPattern(), new SyncablePathPattern(ACCESS_CONTROL_BUNDLE_ID, '**')] };

    const found = await findSyncables(trace, store, { basePath: store.path.append(plainId('folder', 'test-folder')), glob });
    expectOk(found);

    const organized = await organizeSyncablesForPullResponse(trace, store, {
      basePath: store.path.append(plainId('folder', 'test-folder')),
      items: found.value,
      localHashesRelativeToBasePath: {},
      sendData: true
    });
    expectOk(organized);

    expect(organized.value).toEqual({
      itemsById: {
        'EnTb._access-control': {
          metadata: ANY_METADATA,
          itemsById: expect.objectContaining({
            'EnTb._snapshots': { metadata: ANY_METADATA, itemsById: ANY_OBJECT }
          })
        },
        'EyTb._test-bundle': ANY_SHA256_HASH
      }
    });
  });
});

// Helpers

const ANY_OBJECT = expect.objectContaining({});
const ANY_STRING = expect.stringContaining('');
const ANY_NUMBER = expect.any(Number);
const ANY_UINT8_ARRAY = expect.any(Uint8Array);
const ANY_SHA256_HASH = expect.stringMatching(sha256HashInfo.schema.regex);

const ANY_METADATA = expect.objectContaining({
  name: ANY_STRING,
  provenance: ANY_OBJECT
});

const ANY_FILE_ITEM = expect.objectContaining({
  metadata: ANY_METADATA,
  data: ANY_UINT8_ARRAY,
  sizeBytes: ANY_NUMBER
});
