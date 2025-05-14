import type { SuiteContext, TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { sha256HashInfo } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, plainId, storageRootIdInfo, SyncablePathPattern } from 'freedom-sync-types';
import {
  createBundleAtPath,
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  generateProvenanceForNewSyncableStore,
  getMetadataAtPath,
  initializeRoot
} from 'freedom-syncable-store';
import { makeUserKeysForTesting } from 'freedom-syncable-store/tests';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import {
  ANY_OBJECT,
  ANY_OBJECT_WITH,
  expectDeepStrictEqual,
  expectEqualsStructPattern,
  expectOk,
  expectStrictEqual,
  StringTestPattern
} from 'freedom-testing-tools';

import { getLocalHashesRelativeToBasePathWithGlob } from '../getLocalHashesRelativeToBasePathWithPatterns.ts';

describe('getLocalHashesRelativeToBasePathWithPatterns', () => {
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

  it('getting the root should work', async () => {
    const hashes = await getLocalHashesRelativeToBasePathWithGlob(trace, store, {
      basePath: store.path,
      glob: {
        include: [new SyncablePathPattern()]
      }
    });
    expectOk(hashes);

    const rootMetadata = await getMetadataAtPath(trace, store, store.path);
    expectOk(rootMetadata);

    expectStrictEqual(hashes.value.hash, rootMetadata.value.hash);
    expectDeepStrictEqual(hashes.value.contents ?? {}, {});
  });

  it('getting the root and all contents should work', async () => {
    const hashes = await getLocalHashesRelativeToBasePathWithGlob(trace, store, {
      basePath: store.path,
      glob: {
        include: [new SyncablePathPattern('**')]
      }
    });
    expectOk(hashes);

    const rootMetadata = await getMetadataAtPath(trace, store, store.path);
    expectOk(rootMetadata);

    expectStrictEqual(hashes.value.hash, rootMetadata.value.hash);
    expectEqualsStructPattern(hashes.value.contents ?? {}, {
      'EyTF._test-folder': {
        hash: ANY_SHA256_HASH,
        contents: {
          'EnTb._access-control': {
            hash: ANY_SHA256_HASH,
            contents: ANY_OBJECT_WITH({
              'EnTb._snapshots': { hash: ANY_SHA256_HASH, contents: ANY_OBJECT }
            })
          },
          'EyTb._test-bundle': {
            hash: ANY_SHA256_HASH,
            contents: {
              'EyTf._testing1.txt': { hash: ANY_SHA256_HASH },
              'EyTf._testing2.txt': { hash: ANY_SHA256_HASH },
              'EyTf._testing3.txt': { hash: ANY_SHA256_HASH },
              'EyTf._testing4.txt': { hash: ANY_SHA256_HASH },
              'EyTf._testing5.txt': { hash: ANY_SHA256_HASH }
            }
          }
        }
      },
      'EnTb._access-control': {
        hash: ANY_SHA256_HASH,
        contents: ANY_OBJECT_WITH({
          'EnTb._snapshots': { hash: ANY_SHA256_HASH, contents: ANY_OBJECT }
        })
      }
    });
  });

  it('getting the test folder and everything in its access control bundle should work', async () => {
    const hashes = await getLocalHashesRelativeToBasePathWithGlob(trace, store, {
      basePath: store.path.append(plainId('folder', 'test-folder')),
      glob: {
        include: [new SyncablePathPattern(), new SyncablePathPattern(ACCESS_CONTROL_BUNDLE_ID, '**')]
      }
    });
    expectOk(hashes);

    const testFolderMetadata = await getMetadataAtPath(trace, store, store.path.append(plainId('folder', 'test-folder')));
    expectOk(testFolderMetadata);

    expectStrictEqual(hashes.value.hash, testFolderMetadata.value.hash);
    expectEqualsStructPattern(hashes.value.contents ?? {}, {
      'EnTb._access-control': {
        hash: ANY_SHA256_HASH,
        contents: ANY_OBJECT_WITH({
          'EnTb._snapshots': { hash: ANY_SHA256_HASH, contents: ANY_OBJECT }
        })
      }
    });
  });
});

// Helpers

const ANY_SHA256_HASH = new StringTestPattern(sha256HashInfo.schema.regex);
