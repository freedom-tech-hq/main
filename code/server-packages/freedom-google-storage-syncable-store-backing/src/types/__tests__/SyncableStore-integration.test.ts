import { makeTestsForSyncableStoreBacking } from 'freedom-syncable-store/tests';
import { expectOk } from 'freedom-testing-tools';

import { createGoogleStorageBucketForTests } from '../../tests/createGoogleStorageBucketForTests.ts';
import { GoogleStorageSyncableStoreBacking } from '../GoogleStorageSyncableStoreBacking.ts';

// Uncomment to enable temporarily
// createGoogleStorageBucketForTests.enableRealConnection();

makeTestsForSyncableStoreBacking('GoogleStorageSyncableStoreBacking', async (trace, { storageRootId, metadata }) => {
  const { bucket, prefix } = createGoogleStorageBucketForTests();
  const backing = new GoogleStorageSyncableStoreBacking(bucket, prefix);

  // TODO: revise how we initialize
  expectOk(await backing.initialize(trace, storageRootId, metadata));

  const teardown = async (): Promise<void> => {
    // TODO: Delete everything under storage storageRootId
  };

  return [backing, teardown];
});
