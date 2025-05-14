import { afterEach, beforeEach, describe, it } from 'node:test';

import { makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { makeUserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, plainId, storageRootIdInfo } from 'freedom-sync-types';
import {
  createBundleAtPath,
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  generateProvenanceForNewSyncableStore,
  initializeRoot
} from 'freedom-syncable-store';
import { makeUserKeysForTesting } from 'freedom-syncable-store/tests';
import { ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID } from 'freedom-syncable-store-types';
import type { ExpectEventuallyOptions } from 'freedom-testing-tools';
import { expectDeepStrictEqual, expectEventually, expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { makeSyncServiceForTesting as makeSyncServiceForTestingWithAllDetails } from '../__test_dependency__/makeSyncServiceForTesting.ts';
import { expectDidPullPath } from '../tests/expectDidPullPath.ts';
import { expectDidPushPath } from '../tests/expectDidPushPath.ts';
import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { ShouldPullFromRemoteFunc } from '../types/ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToRemoteFunc } from '../types/ShouldPushToRemoteFunc.ts';

describe('syncing', () => {
  let localTrace!: Trace;
  let localPrivateKeys!: PrivateCombinationCryptoKeySet;
  let localUserKeys!: UserKeys;
  let localStoreBacking!: InMemorySyncableStoreBacking;
  let localStore!: DefaultSyncableStore;

  let remoteTrace!: Trace;
  let remoteUserKeys!: UserKeys;
  let remoteStoreBacking!: InMemorySyncableStoreBacking;
  let remoteStore!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(invalidateAllInMemoryCaches);

  beforeEach(async () => {
    localTrace = makeTrace('test:local');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(localTrace);
    expectOk(internalCryptoKeys);
    localPrivateKeys = internalCryptoKeys.value;

    localUserKeys = makeUserKeysForTesting({ privateKeys: localPrivateKeys });

    const provenance = await generateProvenanceForNewSyncableStore(localTrace, {
      storageRootId,
      userKeys: localUserKeys,
      trustedTimeSignature: undefined
    });
    expectOk(provenance);

    const creatorPublicKeys = localPrivateKeys.publicOnly();
    const defaultSalt = makeUuid();

    localStoreBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    localStore = new DefaultSyncableStore({
      storageRootId,
      backing: localStoreBacking,
      userKeys: localUserKeys,
      creatorPublicKeys,
      saltsById: { [DEFAULT_SALT_ID]: defaultSalt }
    });
    expectOk(await initializeRoot(localTrace, localStore));

    remoteTrace = makeTrace('test:remote');
    remoteUserKeys = makeUserKeys({
      getMostRecentPrivateCryptoKeys: async () =>
        makeFailure(new InternalStateError(remoteTrace, { message: 'No private keys setup for remote test user' })),
      getPrivateCryptoKeysById: async () =>
        makeFailure(new NotFoundError(remoteTrace, { message: 'No private keys setup for remote test user', errorCode: 'not-found' })),
      getPrivateCryptoKeySetIds: async () => makeSuccess([])
    });

    remoteStoreBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    remoteStore = new DefaultSyncableStore({
      storageRootId,
      backing: remoteStoreBacking,
      userKeys: remoteUserKeys,
      creatorPublicKeys,
      saltsById: { [DEFAULT_SALT_ID]: defaultSalt }
    });
  });

  const makeSyncServiceForTesting = (fwd: {
    getSyncStrategyForPath: GetSyncStrategyForPathFunc;
    shouldPullFromRemote: ShouldPullFromRemoteFunc;
    shouldPushToRemote: ShouldPushToRemoteFunc;
  }) => {
    const newSyncService = makeSyncServiceForTestingWithAllDetails({ ...fwd, localTrace, localStore, remoteTrace, remoteStore });
    expectOk(newSyncService);

    return newSyncService.value;
  };

  // access control bundle + access control snapshots bundle + access control snapshot file + access control deltas bundle
  const numBaseFiles = 4;

  describe('empty store (other than access control bundle)', () => {
    it('full item-by-item syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'item',
        shouldPullFromRemote: () => ({ strategy: 'item' }),
        shouldPushToRemote: () => ({ strategy: 'item' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      // - pull: root
      // - push: access control bundle
      // - push: access control snapshots bundle
      // - push: access control snapshot file
      // - push: access control deltas bundle
      expectStrictEqual(logs.length, 1 + numBaseFiles);
      await expectDidPullPath(logs, localStore.path);
      await expectDidPushPath(logs, localStore.path.append(ACCESS_CONTROL_BUNDLE_ID));
      await expectDidPushPath(logs, localStore.path.append(ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID({ encrypted: false })));
      // Not explicitly checking the names of the snapshot file or deltas bundle for simplicity
    });

    it('full level syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'level',
        shouldPullFromRemote: () => ({ strategy: 'level' }),
        shouldPushToRemote: () => ({ strategy: 'level' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      // - pull: root
      // - push: root (including access control bundle)
      // - pull: root access control bundle
      // - push: access control bundle (including snapshots and deltas bundles)
      // - pull: access control snapshots bundle
      // - push: access control snapshots bundle (including snapshot file)
      expectStrictEqual(logs.length, 6);
      await expectDidPullPath(logs, localStore.path);
      await expectDidPushPath(logs, localStore.path.append(ACCESS_CONTROL_BUNDLE_ID));
      await expectDidPullPath(logs, localStore.path.append(ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID({ encrypted: false })));
    });

    it('full stack syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'stack',
        shouldPullFromRemote: () => ({ strategy: 'stack' }),
        shouldPushToRemote: () => ({ strategy: 'stack' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      expectStrictEqual(logs.length, 2); // 1 pull and 1 push
      await expectDidPullPath(logs, localStore.path);
      await expectDidPushPath(logs, localStore.path);
    });
  });

  describe('populated store', () => {
    let extraItemsAdded = 0;
    beforeEach(async () => {
      expectOk(await createFolderAtPath(localTrace, localStore, localStore.path.append(plainId('folder', 'test-folder'))));
      extraItemsAdded += 5; // 1 folder, 1 access control bundle, 1 snapshots bundle, 1 snapshots file, and 1 deltas bundle

      expectOk(
        await createBundleAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'))
        )
      );
      extraItemsAdded += 1;

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing1.txt')),
          { value: 'Hello World!' }
        )
      );
      extraItemsAdded += 1;

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing2.txt')),
          { value: 'Goodbye World!' }
        )
      );
      extraItemsAdded += 1;

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing3.txt')),
          { value: 'A' }
        )
      );
      extraItemsAdded += 1;

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing4.txt')),
          { value: 'B' }
        )
      );
      extraItemsAdded += 1;

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing5.txt')),
          { value: 'C' }
        )
      );
      extraItemsAdded += 1;
    });

    it('full item-by-item syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'item',
        shouldPullFromRemote: () => ({ strategy: 'item' }),
        shouldPushToRemote: () => ({ strategy: 'item' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      // same as empty case above + 1 push per extra item added
      expectStrictEqual(logs.length, 1 + numBaseFiles + extraItemsAdded);
    });

    it('full level syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'level',
        shouldPullFromRemote: () => ({ strategy: 'level' }),
        shouldPushToRemote: () => ({ strategy: 'level' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      // - pull: root
      // - push: root (including access control bundle and test-folder)
      // - pull: root access control bundle
      // - push: root access control bundle (including snapshots and deltas bundles)
      // - pull: root access control snapshots bundle
      // - push: root access control snapshot file
      // - pull: test-folder
      // - push: test-folder (including access control bundle and test-bundle)
      // - pull: test-folder access control bundle
      // - push: test-folder access control bundle (including snapshots and deltas bundles)
      // - pull: test-folder access control snapshots bundle
      // - pull: test-folder access control snapshot file
      // - pull: test-bundle
      // - push: test-bundle (including all testing*.txt files)
      // depending on the exact timing of things, test-folder may be requested twice
      expectStrictEqual(logs.length <= 15, true);
    });

    it('full stack syncing should work', async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'stack',
        shouldPullFromRemote: () => ({ strategy: 'stack' }),
        shouldPushToRemote: () => ({ strategy: 'stack' })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(remoteTrace, async (remoteTrace) => {
          expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
        });
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      const logs = syncService.devLogging.getLogEntries();
      // pull: root
      // push: root
      // depending on the exact timing of things, a pull: test-folder may or may not be present
      expectStrictEqual(logs.length <= 3, true);
    });
  });
});

// Helpers

const noLoggingExpectEventually = (trace: Trace, callback: (trace: Trace) => Promise<void>, options?: ExpectEventuallyOptions) =>
  disableLam(true, (trace) => expectEventually(() => callback(trace), options))(trace);
