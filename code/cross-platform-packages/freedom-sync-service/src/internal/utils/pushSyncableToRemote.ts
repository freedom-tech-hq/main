import type { PR } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OutOfSyncBundle, OutOfSyncFile, OutOfSyncFolder, RemoteId, SyncablePath } from 'freedom-sync-types';
import { ACCESS_CONTROL_BUNDLE_ID, getSyncableAtPath, STORE_CHANGES_BUNDLE_ID, type SyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { SyncService } from '../../types/SyncService.ts';
import type { InternalSyncService } from '../types/InternalSyncService.ts';

export const pushSyncableToRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    args: {
      remoteId: RemoteId;
      path: SyncablePath;
      hash: Sha256Hash;
    }
  ): PR<undefined> => {
    const pullFromRemote = (syncService as InternalSyncService).puller;

    // Not logging this pull since we're really just using this as a status check
    const pulled = await disableLam(trace, 'not-found', (trace) => pullFromRemote(trace, { ...args, sendData: false }));
    if (!pulled.ok) {
      if (pulled.value.errorCode === 'not-found') {
        DEV: debugTopic('SYNC', (log) => log(`Pulled ${args.path.toString()}: nothing found on remote.  Will try to push everything`));
        return await pushEverything(trace, { store, syncService }, args);
      }

      return excludeFailureResult(pulled, 'not-found');
    } else if (!pulled.value.outOfSync) {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${args.path.toString()}: local and remote are in sync`));
      return makeSuccess(undefined); // Nothing to do, already in sync
    }

    DEV: debugTopic('SYNC', (log) =>
      log(`Pulled ${args.path.toString()}: local and remote are out of sync.  Will try to push missing content`)
    );
    return await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: pulled.value }, args);
  }
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
  ): PR<undefined> => {
    switch (pulled.type) {
      case 'folder':
        return await pushFolder(trace, {
          store,
          syncService,
          path,
          pulledHashesById: pulled.hashesById
        });

      case 'file':
        return await pushFile(trace, { remoteId, store, syncService, path });

      case 'bundle':
        return await pushBundle(trace, { store, syncService, path, pulledHashesById: pulled.hashesById });
    }
  }
);

// Helpers

const pushEverything = makeAsyncResultFunc(
  [import.meta.filename, 'pushEverything'],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const pushToRemote = (syncService as InternalSyncService).pusher;

    const localItemAccessor = await getSyncableAtPath(trace, store, path);
    if (!localItemAccessor.ok) {
      return generalizeFailureResult(trace, localItemAccessor, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    switch (localItemAccessor.value.type) {
      case 'folder': {
        const metadata = await localItemAccessor.value.getMetadata(trace);
        if (!metadata.ok) {
          return metadata;
        }

        const pushed = await pushToRemote(trace, { remoteId, type: 'folder', path, metadata: metadata.value });
        if (!pushed.ok) {
          return pushed;
        }
        syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'folder', pathString: path.toString() });

        return await pushFolder(trace, { store, syncService, path });
      }

      case 'file':
        return await pushFile(trace, { remoteId, store, syncService, path });

      case 'bundle': {
        const metadata = await localItemAccessor.value.getMetadata(trace);
        if (!metadata.ok) {
          return metadata;
        }

        const pushed = await pushToRemote(trace, { remoteId, type: 'bundle', path, metadata: metadata.value });
        if (!pushed.ok) {
          return pushed;
        }
        syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'bundle', pathString: path.toString() });

        return await pushBundle(trace, { store, syncService, path });
      }
    }
  }
);

const pushBundle = makeAsyncResultFunc(
  [import.meta.filename, 'pushBundle'],
  async (
    trace,
    {
      store,
      syncService,
      path,
      pulledHashesById = {}
    }: {
      store: SyncableStore;
      syncService: SyncService;
      path: SyncablePath;
      pulledHashesById?: Partial<Record<string, Sha256Hash>>;
    }
  ): PR<undefined> => {
    const localBundle = await getSyncableAtPath(trace, store, path, 'bundle');
    if (!localBundle.ok) {
      return generalizeFailureResult(trace, localBundle, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const localMetadataById = await localBundle.value.getMetadataById(trace);
    if (!localMetadataById.ok) {
      return localMetadataById;
    }

    for (const [id, localMetadata] of objectEntries(localMetadataById.value)) {
      if (localMetadata?.hash === undefined || pulledHashesById[id] === localMetadata.hash) {
        continue;
      }

      syncService.pushToRemotes({ path: path.append(id), hash: localMetadata.hash });
    }

    return makeSuccess(undefined);
  }
);

const pushFolder = makeAsyncResultFunc(
  [import.meta.filename, 'pushFolder'],
  async (
    trace,
    {
      store,
      syncService,
      path,
      pulledHashesById = {}
    }: {
      store: SyncableStore;
      syncService: SyncService;
      path: SyncablePath;
      pulledHashesById?: Partial<Record<string, Sha256Hash>>;
    }
  ): PR<undefined> => {
    const localFolder = await getSyncableAtPath(trace, store, path, 'folder');
    if (!localFolder.ok) {
      return generalizeFailureResult(trace, localFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const canPushToRemotes = await localFolder.value.canPushToRemotes(trace);
    if (!canPushToRemotes.ok) {
      return canPushToRemotes;
    } else if (!canPushToRemotes.value) {
      return makeSuccess(undefined); // Not ready yet
    }

    const localMetadataById = await localFolder.value.getMetadataById(trace);
    if (!localMetadataById.ok) {
      return localMetadataById;
    }

    if (localMetadataById.value[ACCESS_CONTROL_BUNDLE_ID]?.hash !== pulledHashesById[ACCESS_CONTROL_BUNDLE_ID]) {
      // If the remote doesn't have the access control bundle, we need to push that first
      syncService.pushToRemotes({
        path: path.append(ACCESS_CONTROL_BUNDLE_ID),
        hash: localMetadataById.value[ACCESS_CONTROL_BUNDLE_ID]!.hash!
      });
    } else if (localMetadataById.value[STORE_CHANGES_BUNDLE_ID]?.hash !== pulledHashesById[STORE_CHANGES_BUNDLE_ID]) {
      // If the remote doesn't have the syncable store changes bundle, we need to push that second
      syncService.pushToRemotes({
        path: path.append(STORE_CHANGES_BUNDLE_ID),
        hash: localMetadataById.value[STORE_CHANGES_BUNDLE_ID]!.hash!
      });
    } else {
      for (const [id, localMetadata] of objectEntries(localMetadataById.value)) {
        if (localMetadata?.hash === undefined || pulledHashesById[id] === localMetadata.hash) {
          continue;
        }

        syncService.pushToRemotes({ path: path.append(id), hash: localMetadata.hash });
      }
    }

    return makeSuccess(undefined);
  }
);

const pushFile = makeAsyncResultFunc(
  [import.meta.filename, 'pushFile'],
  async (
    trace,
    { remoteId, store, syncService, path }: { remoteId: RemoteId; store: SyncableStore; syncService: SyncService; path: SyncablePath }
  ): PR<undefined> => {
    const pushToRemote = (syncService as InternalSyncService).pusher;

    const localFile = await getSyncableAtPath(trace, store, path, 'file');
    if (!localFile.ok) {
      return generalizeFailureResult(trace, localFile, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const data = await localFile.value.getEncodedBinary(trace);
    if (!data.ok) {
      return data;
    }

    const metadata = await localFile.value.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const pushed = await pushToRemote(trace, { remoteId, type: 'file', path, metadata: metadata.value, data: data.value });
    if (!pushed.ok) {
      return pushed;
    }
    syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'file', pathString: path.toString() });

    return makeSuccess(undefined);
  }
);
