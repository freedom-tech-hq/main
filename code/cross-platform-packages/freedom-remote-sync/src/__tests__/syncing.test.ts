import { afterEach, beforeEach, describe, it } from 'node:test';

import { makeFailure, makeSuccess } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { CombinationCryptoKeySet, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { makeUserKeys } from 'freedom-crypto-service';
import { makeUserKeysForTesting } from 'freedom-crypto-service/tests';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import type { SyncableProvenance } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, plainId, storageRootIdInfo } from 'freedom-sync-types';
import {
  createBundleAtPath,
  createFolderAtPath,
  createStringFileAtPath,
  DefaultSyncableStore,
  generateProvenanceForNewSyncableStore,
  initializeRoot
} from 'freedom-syncable-store';
import type { ExpectEventuallyOptions } from 'freedom-testing-tools';
import { expectDeepStrictEqual, expectEventually, expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { makeSyncServiceForTesting as makeSyncServiceForTestingWithAllDetails } from '../__test_dependency__/makeSyncServiceForTesting.ts';
import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { ShouldPullFromRemoteFunc } from '../types/ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToRemoteFunc } from '../types/ShouldPushToRemoteFunc.ts';
import type { SyncStrategy } from '../types/SyncStrategy.ts';

const maxSyncTimeMSec = 5 * ONE_SEC_MSEC;

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

  let provenance!: SyncableProvenance;
  let creatorPublicKeys!: CombinationCryptoKeySet;
  let defaultSalt!: string;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(invalidateAllInMemoryCaches);

  beforeEach(async () => {
    localTrace = makeTrace('test:local');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(localTrace);
    expectOk(internalCryptoKeys);
    localPrivateKeys = internalCryptoKeys.value;

    localUserKeys = makeUserKeysForTesting({ privateKeys: localPrivateKeys });

    const newProvenance = await generateProvenanceForNewSyncableStore(localTrace, {
      storageRootId,
      userKeys: localUserKeys,
      trustedTimeSignature: undefined
    });
    expectOk(newProvenance);
    provenance = newProvenance.value;

    creatorPublicKeys = localPrivateKeys.publicOnly();
    defaultSalt = makeUuid();

    localStoreBacking = new InMemorySyncableStoreBacking({ provenance });
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

    remoteStoreBacking = new InMemorySyncableStoreBacking({ provenance });
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

  const makeSyncTest = (name: string, { strategy }: { strategy: SyncStrategy }) => {
    it(name, async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => strategy,
        shouldPullFromRemote: () => ({ strategy }),
        shouldPushToRemote: () => ({ strategy })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(
          remoteTrace,
          async (remoteTrace) => {
            expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
          },
          { timeoutMSec: maxSyncTimeMSec }
        );

        const pulledRoot = await syncService.pullFromRemotes(localTrace, { basePath: localStore.path, strategy: 'item' });
        expectOk(pulledRoot);
        expectStrictEqual(pulledRoot.value, 'in-sync');
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      console.log(`${name} log entries: ${syncService.devLogging.getLogEntries().length}`);
    });
  };

  const makeRestoringTest = (name: string, { strategy }: { strategy: SyncStrategy }) => {
    it(name, async () => {
      const syncService = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => strategy,
        shouldPullFromRemote: () => ({ strategy }),
        shouldPushToRemote: () => ({ strategy })
      });

      expectOk(await syncService.start(localTrace));

      try {
        await noLoggingExpectEventually(
          remoteTrace,
          async (remoteTrace) => {
            expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
          },
          { timeoutMSec: maxSyncTimeMSec }
        );

        const pulledRoot = await syncService.pullFromRemotes(localTrace, { basePath: localStore.path, strategy: 'item' });
        expectOk(pulledRoot);
        expectStrictEqual(pulledRoot.value, 'in-sync');
      } finally {
        expectOk(await syncService.stop(localTrace));
      }

      // Creating a new empty local store
      localStoreBacking = new InMemorySyncableStoreBacking({ provenance });
      localStore = new DefaultSyncableStore({
        storageRootId,
        backing: localStoreBacking,
        userKeys: localUserKeys,
        creatorPublicKeys,
        saltsById: { [DEFAULT_SALT_ID]: defaultSalt }
      });

      const syncService2 = makeSyncServiceForTesting({
        getSyncStrategyForPath: () => 'item',
        shouldPullFromRemote: () => ({ strategy: 'item' }),
        shouldPushToRemote: () => ({ strategy: 'item' })
      });

      expectOk(await syncService2.start(localTrace));

      try {
        await noLoggingExpectEventually(
          remoteTrace,
          async (remoteTrace) => {
            expectDeepStrictEqual(await localStore.ls(localTrace), await remoteStore.ls(remoteTrace));
          },
          { timeoutMSec: maxSyncTimeMSec }
        );

        const pulledRoot = await syncService2.pullFromRemotes(localTrace, { basePath: localStore.path, strategy: 'item' });
        expectOk(pulledRoot);
        expectStrictEqual(pulledRoot.value, 'in-sync');
      } finally {
        expectOk(await syncService2.stop(localTrace));
      }

      console.log(`${name} log entries: ${syncService.devLogging.getLogEntries().length}`);
    });
  };

  describe('empty store (other than access control bundle)', () => {
    makeSyncTest('full item-by-item syncing should work', { strategy: 'item' });
    makeSyncTest('full level syncing should work', { strategy: 'level' });
    makeSyncTest('full stack syncing should work', { strategy: 'stack' });
  });

  describe('populated store', () => {
    beforeEach(async () => {
      expectOk(await createFolderAtPath(localTrace, localStore, localStore.path.append(plainId('folder', 'test-folder'))));

      expectOk(
        await createBundleAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'))
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing1.txt')),
          { value: 'Hello World!' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing2.txt')),
          { value: 'Goodbye World!' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing3.txt')),
          { value: 'A' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing4.txt')),
          { value: 'B' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing5.txt')),
          { value: 'C' }
        )
      );
    });

    makeSyncTest('full item-by-item syncing should work', { strategy: 'item' });
    makeSyncTest('full level syncing should work', { strategy: 'level' });
    makeSyncTest('full stack syncing should work', { strategy: 'stack' });
  });

  describe('restoring', () => {
    beforeEach(async () => {
      expectOk(await createFolderAtPath(localTrace, localStore, localStore.path.append(plainId('folder', 'test-folder'))));

      expectOk(
        await createBundleAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'))
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing1.txt')),
          { value: 'Hello World!' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing2.txt')),
          { value: 'Goodbye World!' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing3.txt')),
          { value: 'A' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing4.txt')),
          { value: 'B' }
        )
      );

      expectOk(
        await createStringFileAtPath(
          localTrace,
          localStore,
          localStore.path.append(plainId('folder', 'test-folder'), plainId('bundle', 'test-bundle'), plainId('file', 'testing5.txt')),
          { value: 'C' }
        )
      );
    });

    makeRestoringTest('full item-by-item syncing should work', { strategy: 'item' });
    makeRestoringTest('full level syncing should work', { strategy: 'level' });
    makeRestoringTest('full stack syncing should work', { strategy: 'stack' });
  });
});

// Helpers

const noLoggingExpectEventually = (trace: Trace, callback: (trace: Trace) => Promise<void>, options?: ExpectEventuallyOptions) =>
  disableLam(true, (trace) => expectEventually(() => callback(trace), options))(trace);
