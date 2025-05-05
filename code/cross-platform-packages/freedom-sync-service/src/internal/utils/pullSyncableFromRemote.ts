import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries, objectWithSortedKeys } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { OutOfSyncBundle, OutOfSyncFile, OutOfSyncFolder, RemoteId, SyncablePath, SyncStrategy } from 'freedom-sync-types';
import { getBundleAtPathForSync, getFolderAtPathForSync, pushBundle, pushFile, pushFolder } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';
import { pushMissingSyncableContentToRemote } from './pushSyncableToRemote.ts';

export const pullSyncableFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: SyncService },
    args: { remoteId: RemoteId; path: SyncablePath; hash?: Sha256Hash; strategy: SyncStrategy }
  ): PR<undefined, 'not-found'> => {
    const pullFromRemote = syncService.getRemotesAccessors()[args.remoteId]?.puller;
    if (pullFromRemote === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${args.remoteId}` }));
    }

    const { remoteId, path } = args;

    // TODO: everything pulled needs to be validated -- approved content: just validate the approval itself; not-yet approved content:
    // validate the change against the access control document
    const pulled = await pullFromRemote(trace, { ...args, sendData: true });
    if (!pulled.ok) {
      return pulled;
    }
    DEV: syncService.devLogging.appendLogEntry?.({
      type: 'pull',
      remoteId,
      itemType: pulled.value.type,
      pathString: path.toString(),
      outOfSync: pulled.value.outOfSync
    });

    if (pulled.value.outOfSync) {
      switch (pulled.value.type) {
        case 'folder': {
          const handled = await onFolderPulled(trace, { store, syncService, folder: pulled.value }, { remoteId, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
        case 'file': {
          const handled = await onFilePulled(trace, { store, syncService, file: pulled.value, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
        case 'bundle': {
          const handled = await onBundlePulled(trace, { store, syncService, file: pulled.value }, { remoteId, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
      }
    }

    return makeSuccess(undefined);
  },
  { disableLam: 'not-found' }
);

// Helpers

const onBundlePulled = makeAsyncResultFunc(
  [import.meta.filename, 'onBundlePulled'],
  async (
    trace: Trace,
    { store, syncService, file }: { store: MutableSyncableStore; syncService: SyncService; file: OutOfSyncBundle },
    fwd: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const path = fwd.path;

    const pushedLocally = await pushBundle(trace, store, { path, metadata: file.metadata, batchContents: file.batchContents });
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    const localBundle = await getBundleAtPathForSync(trace, store, path, { strategy: 'default' });
    if (!localBundle.ok) {
      return localBundle;
    }

    const localMetadataById = localBundle.value.metadataById;

    // Trying to pull in sorted key order for better determinism
    for (const [id, remoteHash] of objectEntries(objectWithSortedKeys(file.hashesById))) {
      const localMetadata = localMetadataById[id];
      if (remoteHash === undefined || localMetadata?.hash === remoteHash) {
        continue;
      }

      syncService.pullFromRemotes({ path: path.append(id), hash: localMetadata?.hash });
    }

    // Pushing any missing content to the remote
    const pushed = await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: file }, fwd);
    if (!pushed.ok) {
      return generalizeFailureResult(trace, pushed, 'not-found');
    }

    return makeSuccess(undefined);
  }
);

const onFolderPulled = makeAsyncResultFunc(
  [import.meta.filename, 'onFolderPulled'],
  async (
    trace: Trace,
    { store, syncService, folder }: { store: MutableSyncableStore; syncService: SyncService; folder: OutOfSyncFolder },
    fwd: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const path = fwd.path;

    const pushedLocally = await pushFolder(trace, store, { path, metadata: folder.metadata, batchContents: folder.batchContents });
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    const localFolder = await getFolderAtPathForSync(trace, store, path, { strategy: 'default' });
    if (!localFolder.ok) {
      return localFolder;
    }

    const localMetadataById = localFolder.value.metadataById;

    // Trying to pull in sorted key order for better determinism
    for (const [id, remoteHash] of objectEntries(objectWithSortedKeys(folder.hashesById))) {
      const localMetadata = localMetadataById[id];
      if (remoteHash !== undefined && localMetadata?.hash !== remoteHash) {
        syncService.pullFromRemotes({ path: path.append(id), hash: localMetadata?.hash });
      }
    }

    // Pushing any missing content to the remote
    const pushed = await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: folder }, fwd);
    if (!pushed.ok) {
      return generalizeFailureResult(trace, pushed, 'not-found');
    }

    return makeSuccess(undefined);
  }
);

const onFilePulled = makeAsyncResultFunc(
  [import.meta.filename, 'onFilePulled'],
  async (
    trace: Trace,
    { store, file, path }: { store: MutableSyncableStore; syncService: SyncService; file: OutOfSyncFile; path: SyncablePath }
  ): PR<undefined> => {
    const fileData = file.data;
    if (fileData === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'File data is missing' }));
    }

    const pushedLocally = await pushFile(trace, store, { path, metadata: file.metadata, data: fileData });
    // (trace, store, path, fileData, file.metadata);
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    return makeSuccess(undefined);
  }
);
