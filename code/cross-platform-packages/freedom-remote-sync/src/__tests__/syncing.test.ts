import { afterEach, beforeEach, describe, it } from 'node:test';

import type { PR } from 'freedom-async';
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
import { pullFromLocal, pushToLocal } from 'freedom-local-sync';
import type { PullItem } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, remoteIdInfo, storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore, generateProvenanceForNewSyncableStore, getBundleAtPath, initializeRoot } from 'freedom-syncable-store';
import { makeUserKeysForTesting } from 'freedom-syncable-store/tests';
import { ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID } from 'freedom-syncable-store-types';
import { expectEventually, expectOk } from 'freedom-testing-tools';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { RemoteSyncService } from '../types/RemoteSyncService.ts';
import { makeSyncService } from '../utils/makeSyncService.ts';

describe('syncing', () => {
  let localTrace!: Trace;
  let localPrivateKeys!: PrivateCombinationCryptoKeySet;
  let localUserKeys!: UserKeys;
  let localStoreBacking!: InMemorySyncableStoreBacking;
  let localStore!: DefaultSyncableStore;
  let localSyncService!: RemoteSyncService;

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

    const newSyncService = makeSyncService(localTrace, {
      getSyncStrategyForPath: () => 'item',
      remoteConnections: [
        {
          accessor: {
            remoteId: remoteIdInfo.make('test'),
            puller: async (trace, { basePath, localHashesRelativeToBasePath, glob, sendData = false }): PR<PullItem, 'not-found'> =>
              await pullFromLocal(trace, remoteStore, { basePath, localHashesRelativeToBasePath, glob, sendData }),
            pusher: async (trace, { basePath, item }): PR<undefined, 'not-found'> =>
              await pushToLocal(trace, remoteStore, { basePath, item })
          },
          changeNotificationClient: { addListener: () => () => {} }
        }
      ],
      shouldPullFromRemote: () => ({ strategy: 'item' }),
      shouldPushToRemote: () => ({ strategy: 'item' }),
      store: localStore,
      shouldRecordLogs: true
    });
    expectOk(newSyncService);

    localSyncService = newSyncService.value;
  });

  it('should work', async () => {
    expectOk(await localSyncService.start(localTrace));

    try {
      await disableLam(true, (remoteTrace) =>
        expectEventually(async () => {
          expectOk(await getBundleAtPath(remoteTrace, remoteStore, remoteStore.path.append(ACCESS_CONTROL_BUNDLE_ID)));
          expectOk(
            await getBundleAtPath(
              remoteTrace,
              remoteStore,
              remoteStore.path.append(ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID({ encrypted: false }))
            )
          );
        })
      )(remoteTrace);
    } finally {
      expectOk(await localSyncService.stop(localTrace));
    }

    console.log('FOOBARBLA localSyncService.devLogging.getLogEntries()', localSyncService.devLogging.getLogEntries());
  });
});
