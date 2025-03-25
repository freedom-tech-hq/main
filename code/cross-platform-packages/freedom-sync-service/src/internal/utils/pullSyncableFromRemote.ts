import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries, objectWithSortedKeys } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { OutOfSyncBundleFile, OutOfSyncFlatFile, OutOfSyncFolder, RemoteId, StaticSyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import {
  createViaSyncPreEncodedBinaryFileAtPath,
  getOrCreateViaSyncBundleFileAtPath,
  getOrCreateViaSyncFolderAtPath
} from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';
import type { InternalSyncService } from '../types/InternalSyncService.ts';
import { pushMissingSyncableContentToRemote } from './pushSyncableToRemote.ts';

export const pullSyncableFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: SyncService },
    args: { remoteId: RemoteId; path: StaticSyncablePath; hash?: Sha256Hash }
  ): PR<undefined, 'not-found'> => {
    const pullFromRemote = (syncService as InternalSyncService).puller;

    const { remoteId, path } = args;

    // TODO: everything pulled needs to be validated -- approved content: just validate the approval itself; not-yet approved content:
    // validate the change against the access control document
    const pulled = await pullFromRemote(trace, { ...args, sendData: true });
    if (!pulled.ok) {
      return pulled;
    }
    syncService.appendLogEntry?.({
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
        case 'flatFile': {
          const handled = await onFlatFilePulled(trace, { store, syncService, file: pulled.value, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
        case 'bundleFile': {
          const handled = await onBundleFilePulled(trace, { store, syncService, file: pulled.value }, { remoteId, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
      }
    }

    return makeSuccess(undefined);
  }
);

// Helpers

const onBundleFilePulled = makeAsyncResultFunc(
  [import.meta.filename, 'onBundleFilePulled'],
  async (
    trace: Trace,
    { store, syncService, file }: { store: MutableSyncableStore; syncService: SyncService; file: OutOfSyncBundleFile },
    fwd: { remoteId: RemoteId; path: StaticSyncablePath }
  ): PR<undefined> => {
    const path = fwd.path;

    const localBundle = await getOrCreateViaSyncBundleFileAtPath(trace, store, path, file.metadata);
    if (!localBundle.ok) {
      if (localBundle.value.errorCode === 'deleted') {
        // Was locally deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(trace, excludeFailureResult(localBundle, 'deleted'), [
        'format-error',
        'not-found',
        'untrusted',
        'wrong-type'
      ]);
    }

    const localHashesById = await localBundle.value.bundle.getHashesById(trace);
    if (!localHashesById.ok) {
      return localHashesById;
    }

    // Trying to pull in sorted key order for better determinism
    for (const [id, remoteHash] of objectEntries(objectWithSortedKeys(file.hashesById))) {
      const localHash = localHashesById.value[id];
      if (remoteHash === undefined || localHash === remoteHash) {
        continue;
      }

      syncService.pullFromRemotes({ path: path.append(id), hash: localHash });
    }

    // Pushing any missing content to the remote
    return await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: file }, fwd);
  }
);

const onFolderPulled = makeAsyncResultFunc(
  [import.meta.filename, 'onFolderPulled'],
  async (
    trace: Trace,
    { store, syncService, folder }: { store: MutableSyncableStore; syncService: SyncService; folder: OutOfSyncFolder },
    fwd: { remoteId: RemoteId; path: StaticSyncablePath }
  ): PR<undefined> => {
    const path = fwd.path;

    const localFolder = await getOrCreateViaSyncFolderAtPath(trace, store, path, folder.metadata);
    if (!localFolder.ok) {
      if (localFolder.value.errorCode === 'deleted') {
        // Was locally deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(trace, excludeFailureResult(localFolder, 'deleted'), ['not-found', 'untrusted', 'wrong-type']);
    }

    const localHashesById = await localFolder.value.folder.getHashesById(trace);
    if (!localHashesById.ok) {
      return localHashesById;
    }

    // Trying to pull in sorted key order for better determinism
    for (const [id, remoteHash] of objectEntries(objectWithSortedKeys(folder.hashesById))) {
      const localHash = localHashesById.value[id];
      if (remoteHash !== undefined && localHash !== remoteHash) {
        syncService.pullFromRemotes({ path: path.append(id), hash: localHash });
      }
    }

    // Pushing any missing content to the remote
    return await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: folder }, fwd);
  }
);

const onFlatFilePulled = makeAsyncResultFunc(
  [import.meta.filename, 'onFlatFilePulled'],
  async (
    trace: Trace,
    { store, file, path }: { store: MutableSyncableStore; syncService: SyncService; file: OutOfSyncFlatFile; path: StaticSyncablePath }
  ): PR<undefined> => {
    if (file.data === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'File data is missing' }));
    }

    const localFile = await createViaSyncPreEncodedBinaryFileAtPath(trace, store, path, file.data, file.metadata);
    if (!localFile.ok) {
      if (localFile.value.errorCode === 'deleted') {
        // Was locally deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(trace, excludeFailureResult(localFile, 'deleted'), [
        'conflict',
        'not-found',
        'untrusted',
        'wrong-type'
      ]);
    }

    return makeSuccess(undefined);
  }
);
