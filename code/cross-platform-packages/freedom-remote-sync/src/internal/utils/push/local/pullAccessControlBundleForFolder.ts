import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { pushToLocal } from 'freedom-local-sync';
import { type PullOutOfSyncBundle, type RemoteId, type SyncablePath, SyncablePathPattern } from 'freedom-sync-types';
import { ACCESS_CONTROL_BUNDLE_ID, type MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { getLocalHashesRelativeToBasePathWithGlob } from '../../getLocalHashesRelativeToBasePathWithPatterns.ts';

export const pullAccessControlBundleForFolder = makeAsyncResultFunc(
  [import.meta.filename, 'pullAccessControlBundleForFolder'],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: RemoteSyncService },
    { remoteId, folderPath }: { remoteId: RemoteId; folderPath: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pullFromRemoteUsingRemoteAccessor = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemoteUsingRemoteAccessor === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const accessControlBundlePath = folderPath.append(ACCESS_CONTROL_BUNDLE_ID);
    const localHashesRelativeToBasePath = await getLocalHashesRelativeToBasePathWithGlob(trace, store, {
      basePath: accessControlBundlePath,
      glob: { include: [new SyncablePathPattern('**')] }
    });
    if (!localHashesRelativeToBasePath.ok) {
      return localHashesRelativeToBasePath;
    }

    const pulledAccessControlBundle = await pullFromRemoteUsingRemoteAccessor(trace, {
      basePath: accessControlBundlePath,
      sendData: true,
      localHashesRelativeToBasePath: localHashesRelativeToBasePath.value,
      glob: { include: [new SyncablePathPattern('**')] }
    });
    if (!pulledAccessControlBundle.ok) {
      return pulledAccessControlBundle;
    }

    // If the access control bundle is already in sync then we definitely don't need to try to create the folder locally
    if (pulledAccessControlBundle.value !== 'in-sync') {
      const bundle = pulledAccessControlBundle.value as PullOutOfSyncBundle;
      const pushedAccessControlBundleToLocal = await pushToLocal(trace, store, {
        basePath: accessControlBundlePath,
        item: { metadata: bundle.metadata, itemsById: bundle.itemsById }
      });
      if (!pushedAccessControlBundleToLocal.ok) {
        return pushedAccessControlBundleToLocal;
      }
    }

    return makeSuccess(undefined);
  }
);
