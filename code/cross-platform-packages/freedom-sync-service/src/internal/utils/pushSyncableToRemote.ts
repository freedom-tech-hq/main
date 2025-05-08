import type { PR } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { InternalStateError } from 'freedom-common-errors';
import type { OutOfSyncBundle, OutOfSyncFile, OutOfSyncFolder, RemoteId, SyncablePath } from 'freedom-sync-types';
import {
  getBundleAtPathForSync,
  getFileAtPathForSync,
  getFolderAtPathForSync,
  getMetadataAtPath,
  getSyncableItemTypeAtPathForSync
} from 'freedom-syncable-store';
import { ACCESS_CONTROL_BUNDLE_ID, type SyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';

export const pushSyncableToRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pullFromRemote = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemote === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const metadata = await getMetadataAtPath(trace, store, path);

    // Not logging this pull since we're really just using this as a status check
    const pulled = await pullFromRemote(trace, {
      path,
      hash: metadata.ok ? metadata.value.hash : undefined,
      sendData: false,
      strategy: 'default'
    });
    if (!pulled.ok) {
      if (pulled.value.errorCode === 'not-found') {
        DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: nothing found on remote.  Will try to push everything`));
        return await pushEverything(trace, { store, syncService }, { remoteId, path });
      }

      return excludeFailureResult(pulled, 'not-found');
    } else if (!pulled.value.outOfSync) {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local and remote are in sync`));
      return makeSuccess(undefined); // Nothing to do, already in sync
    }

    DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local and remote are out of sync`));

    return await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: pulled.value }, { remoteId, path });
  },
  { deepDisableLam: 'not-found' }
);

export const pushMissingSyncableContentToRemote = makeAsyncResultFunc(
  [import.meta.filename, 'pushMissing'],
  async (
    trace,
    {
      store,
      syncService,
      pulled
    }: {
      store: SyncableStore;
      syncService: SyncService;
      pulled: OutOfSyncFolder | OutOfSyncFile | OutOfSyncBundle;
    },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    switch (pulled.type) {
      case 'folder':
        return await pushFolder(trace, { remoteId, store, syncService, path, pulledHashesById: pulled.hashesById });

      case 'file':
        return await pushFile(trace, { remoteId, store, syncService, path });

      case 'bundle':
        return await pushBundle(trace, { remoteId, store, syncService, path, pulledHashesById: pulled.hashesById });
    }
  },
  { deepDisableLam: 'not-found' }
);

// Helpers

const pushEverything = makeAsyncResultFunc(
  [import.meta.filename, 'pushEverything'],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const localItemType = await getSyncableItemTypeAtPathForSync(trace, store, path);
    if (!localItemType.ok) {
      return localItemType;
    }

    switch (localItemType.value) {
      case 'folder':
        return await pushFolder(trace, { remoteId, store, syncService, path });

      case 'file':
        return await pushFile(trace, { remoteId, store, syncService, path });

      case 'bundle': {
        return await pushBundle(trace, { remoteId, store, syncService, path });
      }
    }
  },
  { deepDisableLam: 'not-found' }
);

const pushBundle = makeAsyncResultFunc(
  [import.meta.filename, 'pushBundle'],
  async (
    trace,
    {
      remoteId,
      store,
      syncService,
      path,
      pulledHashesById
    }: {
      remoteId: RemoteId;
      store: SyncableStore;
      syncService: SyncService;
      path: SyncablePath;
      pulledHashesById?: Partial<Record<string, Sha256Hash>>;
    }
  ): PR<undefined, 'not-found'> => {
    const strategy = await syncService.getSyncStrategyForPath('push', path);
    const localBundle = await getBundleAtPathForSync(trace, store, path, { strategy });
    if (!localBundle.ok) {
      return localBundle;
    }

    if (pulledHashesById === undefined) {
      const pushToRemote = syncService.remoteAccessors[remoteId]?.pusher;
      if (pushToRemote === undefined) {
        return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
      }

      const pushed = await pushToRemote(trace, {
        type: 'bundle',
        path,
        metadata: localBundle.value.metadata,
        batchContents: localBundle.value.batchContents
      });
      if (!pushed.ok) {
        return pushed;
      }
      DEV: syncService.devLogging.appendLogEntry?.({ type: 'push', remoteId, itemType: 'bundle', pathString: path.toString() });
    }

    const localMetadataById = localBundle.value.metadataById;

    const outOfSyncEntries = objectEntries(localMetadataById).filter(
      ([id, localMetadata]) => localMetadata !== undefined && pulledHashesById?.[id] !== localMetadata.hash
    );

    if (outOfSyncEntries.length > 0) {
      DEV: debugTopic('SYNC', (log) =>
        log(
          `Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to push ${outOfSyncEntries.length} items: ${outOfSyncEntries
            .slice(0, 3)
            .map(([id, _localMetadata]) => id)
            .join(',')}${outOfSyncEntries.length > 3 ? '…' : ''}`
        )
      );

      for (const [id, localMetadata] of outOfSyncEntries) {
        syncService.pushToRemotes({ remoteId, path: path.append(id), hash: localMetadata!.hash });
      }
    } else {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: remote has all local content`));
    }

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);

const pushFolder = makeAsyncResultFunc(
  [import.meta.filename, 'pushFolder'],
  async (
    trace,
    {
      remoteId,
      store,
      syncService,
      path,
      pulledHashesById
    }: {
      remoteId: RemoteId;
      store: SyncableStore;
      syncService: SyncService;
      path: SyncablePath;
      pulledHashesById?: Partial<Record<string, Sha256Hash>>;
    }
  ): PR<undefined, 'not-found'> => {
    const strategy = await syncService.getSyncStrategyForPath('push', path);
    const localFolder = await getFolderAtPathForSync(trace, store, path, { strategy });
    if (!localFolder.ok) {
      return localFolder;
    }

    if (pulledHashesById === undefined) {
      const pushToRemote = syncService.remoteAccessors[remoteId]?.pusher;
      if (pushToRemote === undefined) {
        return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
      }

      const pushedFolder = await pushToRemote(trace, {
        type: 'folder',
        path,
        metadata: localFolder.value.metadata,
        batchContents: localFolder.value.batchContents
      });
      if (!pushedFolder.ok) {
        return pushedFolder;
      }
      DEV: syncService.devLogging.appendLogEntry?.({ type: 'push', remoteId, itemType: 'folder', pathString: path.toString() });
    }

    const localMetadataById = localFolder.value.metadataById;

    if (
      localMetadataById[ACCESS_CONTROL_BUNDLE_ID] !== undefined &&
      localMetadataById[ACCESS_CONTROL_BUNDLE_ID]!.hash !== pulledHashesById?.[ACCESS_CONTROL_BUNDLE_ID]
    ) {
      DEV: debugTopic('SYNC', (log) =>
        log(`Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to push missing access control bundle`)
      );

      // If the remote doesn't have the access control bundle, we need to push that first
      syncService.pushToRemotes({
        remoteId,
        path: path.append(ACCESS_CONTROL_BUNDLE_ID),
        hash: localMetadataById[ACCESS_CONTROL_BUNDLE_ID]!.hash!
      });
    } else {
      const outOfSyncEntries = objectEntries(localMetadataById).filter(
        ([id, localMetadata]) => localMetadata !== undefined && pulledHashesById?.[id] !== localMetadata.hash
      );

      if (outOfSyncEntries.length > 0) {
        DEV: debugTopic('SYNC', (log) =>
          log(
            `Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to push ${outOfSyncEntries.length} items: ${outOfSyncEntries
              .slice(0, 3)
              .map(([id, _localMetadata]) => id)
              .join(',')}${outOfSyncEntries.length > 3 ? '…' : ''}`
          )
        );

        for (const [id, localMetadata] of outOfSyncEntries) {
          syncService.pushToRemotes({ remoteId, path: path.append(id), hash: localMetadata!.hash });
        }
      } else {
        DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: remote has all local content`));
      }
    }

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);

const pushFile = makeAsyncResultFunc(
  [import.meta.filename, 'pushFile'],
  async (
    trace,
    { remoteId, store, syncService, path }: { remoteId: RemoteId; store: SyncableStore; syncService: SyncService; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pushToRemote = syncService.remoteAccessors[remoteId]?.pusher;
    if (pushToRemote === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const localFile = await getFileAtPathForSync(trace, store, path, { strategy: 'default' });
    if (!localFile.ok) {
      return localFile;
    }

    DEV: debugTopic('SYNC', (log) =>
      log(`Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to push missing file`)
    );

    const pushed = await pushToRemote(trace, { type: 'file', path, metadata: localFile.value.metadata, data: localFile.value.data });
    if (!pushed.ok) {
      return pushed;
    }
    DEV: syncService.devLogging.appendLogEntry?.({ type: 'push', remoteId, itemType: 'file', pathString: path.toString() });

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);
