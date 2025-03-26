import type { PR } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OutOfSyncBundleFile, OutOfSyncFlatFile, OutOfSyncFolder, RemoteId, StaticSyncablePath } from 'freedom-sync-types';
import {
  ACCESS_CONTROL_BUNDLE_FILE_ID,
  getSyncableAtPath,
  STORE_CHANGES_BUNDLE_FILE_ID,
  type SyncableStore
} from 'freedom-syncable-store-types';
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
      path: StaticSyncablePath;
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
      pulled: OutOfSyncFolder | OutOfSyncFlatFile | OutOfSyncBundleFile;
    },
    { remoteId, path }: { remoteId: RemoteId; path: StaticSyncablePath }
  ): PR<undefined> => {
    switch (pulled.type) {
      case 'folder':
        return await pushFolder(trace, {
          store,
          syncService,
          path,
          pulledHashesById: pulled.hashesById
        });

      case 'flatFile':
        return await pushFlatFile(trace, { remoteId, store, syncService, path });

      case 'bundleFile':
        return await pushBundleFile(trace, { store, syncService, path, pulledHashesById: pulled.hashesById });
    }
  }
);

// Helpers

const pushEverything = makeAsyncResultFunc(
  [import.meta.filename, 'pushEverything'],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId: RemoteId; path: StaticSyncablePath }
  ): PR<undefined> => {
    const pushToRemote = (syncService as InternalSyncService).pusher;

    const localItemAccessor = await getSyncableAtPath(trace, store, path);
    if (!localItemAccessor.ok) {
      return generalizeFailureResult(trace, localItemAccessor, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    switch (localItemAccessor.value.type) {
      case 'folder': {
        const provenance = await localItemAccessor.value.getProvenance(trace);
        if (!provenance.ok) {
          return provenance;
        }

        const pushed = await pushToRemote(trace, { remoteId, type: 'folder', path, provenance: provenance.value });
        if (!pushed.ok) {
          return pushed;
        }
        syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'folder', pathString: path.toString() });

        return await pushFolder(trace, { store, syncService, path });
      }

      case 'flatFile':
        return await pushFlatFile(trace, { remoteId, store, syncService, path });

      case 'bundleFile': {
        const provenance = await localItemAccessor.value.getProvenance(trace);
        if (!provenance.ok) {
          return provenance;
        }

        const pushed = await pushToRemote(trace, { remoteId, type: 'bundleFile', path, provenance: provenance.value });
        if (!pushed.ok) {
          return pushed;
        }
        syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'bundleFile', pathString: path.toString() });

        return await pushBundleFile(trace, { store, syncService, path });
      }
    }
  }
);

const pushBundleFile = makeAsyncResultFunc(
  [import.meta.filename, 'pushBundleFile'],
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
      path: StaticSyncablePath;
      pulledHashesById?: Partial<Record<string, Sha256Hash>>;
    }
  ): PR<undefined> => {
    const localBundle = await getSyncableAtPath(trace, store, path, 'bundleFile');
    if (!localBundle.ok) {
      return generalizeFailureResult(trace, localBundle, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const localHashesById = await localBundle.value.getHashesById(trace);
    if (!localHashesById.ok) {
      return localHashesById;
    }

    for (const [id, localHash] of objectEntries(localHashesById.value)) {
      if (localHash === undefined || pulledHashesById[id] === localHash) {
        continue;
      }

      syncService.pushToRemotes({ path: path.append(id), hash: localHash });
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
      path: StaticSyncablePath;
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

    const localHashesById = await localFolder.value.getHashesById(trace);
    if (!localHashesById.ok) {
      return localHashesById;
    }

    if (localHashesById.value[ACCESS_CONTROL_BUNDLE_FILE_ID] !== pulledHashesById[ACCESS_CONTROL_BUNDLE_FILE_ID]) {
      // If the remote doesn't have the access control bundle, we need to push that first
      syncService.pushToRemotes({
        path: path.append(ACCESS_CONTROL_BUNDLE_FILE_ID),
        hash: localHashesById.value[ACCESS_CONTROL_BUNDLE_FILE_ID]!
      });
    } else if (localHashesById.value[STORE_CHANGES_BUNDLE_FILE_ID] !== pulledHashesById[STORE_CHANGES_BUNDLE_FILE_ID]) {
      // If the remote doesn't have the syncable store changes bundle, we need to push that second
      syncService.pushToRemotes({
        path: path.append(STORE_CHANGES_BUNDLE_FILE_ID),
        hash: localHashesById.value[STORE_CHANGES_BUNDLE_FILE_ID]!
      });
    } else {
      for (const [id, localHash] of objectEntries(localHashesById.value)) {
        if (localHash === undefined || pulledHashesById[id] === localHash) {
          continue;
        }

        syncService.pushToRemotes({ path: path.append(id), hash: localHash });
      }
    }

    return makeSuccess(undefined);
  }
);

const pushFlatFile = makeAsyncResultFunc(
  [import.meta.filename, 'pushFlatFile'],
  async (
    trace,
    { remoteId, store, syncService, path }: { remoteId: RemoteId; store: SyncableStore; syncService: SyncService; path: StaticSyncablePath }
  ): PR<undefined> => {
    const pushToRemote = (syncService as InternalSyncService).pusher;

    const localFile = await getSyncableAtPath(trace, store, path, 'flatFile');
    if (!localFile.ok) {
      return generalizeFailureResult(trace, localFile, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const data = await localFile.value.getEncodedBinary(trace);
    if (!data.ok) {
      return data;
    }

    const provenance = await localFile.value.getProvenance(trace);
    if (!provenance.ok) {
      return provenance;
    }

    const pushed = await pushToRemote(trace, { remoteId, type: 'flatFile', path, provenance: provenance.value, data: data.value });
    if (!pushed.ok) {
      return pushed;
    }
    syncService.appendLogEntry?.({ type: 'push', remoteId, itemType: 'flatFile', pathString: path.toString() });

    return makeSuccess(undefined);
  }
);
