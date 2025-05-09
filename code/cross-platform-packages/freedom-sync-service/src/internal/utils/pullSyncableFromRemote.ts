import type { PR } from 'freedom-async';
import { allResultsMapped, debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries, objectWithSortedKeys } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type {
  OutOfSyncBundle,
  OutOfSyncFile,
  OutOfSyncFolder,
  RemoteId,
  StructHashes,
  SyncableId,
  SyncablePath,
  SyncPullArgs
} from 'freedom-sync-types';
import { syncableIdComparator, SyncablePathPattern } from 'freedom-sync-types';
import { findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore, SyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';
import type { SyncStrategy } from '../../types/SyncStrategy.ts';
import { pushMissingSyncableContentToRemote } from './pushSyncableToRemote.ts';

// TODO: MOVE
const getPathPatternsForStrategy = (strategy: SyncStrategy): { include: SyncablePathPattern[]; exclude?: SyncablePathPattern[] } => {
  switch (strategy) {
    case 'item':
      return { include: [new SyncablePathPattern()] };
    case 'level':
      return { include: [new SyncablePathPattern(), new SyncablePathPattern('*')] };
    case 'stack':
      return { include: [new SyncablePathPattern(), new SyncablePathPattern('**')] };
  }
};

// TODO: MOVE
const getHashesRelativeToBasePathWithPatterns = makeAsyncResultFunc(
  [import.meta.filename, 'getHashesRelativeToBasePathWithPatterns'],
  async (
    trace,
    store: SyncableStore,
    { basePath, include, exclude }: { basePath: SyncablePath; include: SyncablePathPattern[]; exclude?: SyncablePathPattern[] }
  ): PR<StructHashes> => {
    const found = await findSyncables(trace, store, { basePath, include, exclude });
    if (!found.ok) {
      return generalizeFailureResult(trace, found, 'not-found');
    }

    const hashes: StructHashes = {};

    const insertIntoStructHashesWithRelativeIds = (
      hashes: StructHashes,
      relativeIds: SyncableId[],
      relativeIdsOffset: number,
      hash: Sha256Hash
    ) => {
      if (relativeIdsOffset === relativeIds.length - 1) {
        hashes.hash = hash;
        return;
      }

      const id = relativeIds[relativeIdsOffset];
      if (hashes.contents === undefined) {
        hashes.contents = {};
      }
      if (hashes.contents[id] === undefined) {
        hashes.contents[id] = {};
      }

      insertIntoStructHashesWithRelativeIds(hashes.contents[id], relativeIds, relativeIdsOffset + 1, hash);
    };

    const insertIntoStructHashes = (hashes: StructHashes, basePath: SyncablePath, itemPath: SyncablePath, hash: Sha256Hash) => {
      const relativeIds = itemPath.relativeTo(basePath);
      if (relativeIds !== undefined) {
        insertIntoStructHashesWithRelativeIds(hashes, relativeIds, 0, hash);
      }
    };

    const inserted = await allResultsMapped(trace, found.value, {}, async (trace, item) => {
      const metadata = await getMetadataAtPath(trace, store, item.path);
      if (metadata.ok) {
        insertIntoStructHashes(hashes, basePath, item.path, metadata.value.hash);
      }

      return makeSuccess(undefined);
    });
    if (!inserted.ok) {
      return inserted;
    }

    return makeSuccess(hashes);
  }
);

// TODO: MOVE
const getSyncPullArgsForStrategy = makeAsyncResultFunc(
  [import.meta.filename, 'getSyncPullArgsForStrategy'],
  async (
    trace,
    store: SyncableStore,
    { path, strategy }: { path: SyncablePath; strategy: SyncStrategy }
  ): PR<SyncPullArgs, 'not-found'> => {
    const patterns = getPathPatternsForStrategy(strategy);
    const localHashesRelativeToBasePath = await getHashesRelativeToBasePathWithPatterns(trace, store, { basePath: path, ...patterns });
    if (!localHashesRelativeToBasePath.ok) {
      return localHashesRelativeToBasePath;
    }

    return makeSuccess({
      basePath: path,
      localHashesRelativeToBasePath: localHashesRelativeToBasePath.value,
      sendData: true,
      ...patterns
    });
  }
);

export const pullSyncableFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: SyncService },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pullFromRemote = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemote === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const strategy = await syncService.getSyncStrategyForPath('pull', path);

    const requestArgs = await getSyncPullArgsForStrategy(trace, store, { path, strategy });
    if (!requestArgs.ok) {
      return requestArgs;
    }

    // TODO: everything pulled needs to be validated -- approved content: just validate the approval itself; not-yet approved content:
    // validate the change against the access control document
    const pulled = await pullFromRemote(trace, requestArgs.value);
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
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local and remote are out of sync`));

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
          const handled = await onBundlePulled(trace, { store, syncService, bundle: pulled.value }, { remoteId, path });
          if (!handled.ok) {
            return handled;
          }

          break;
        }
      }
    } else {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local and remote are in sync`));
    }

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);

// Helpers

const onBundlePulled = makeAsyncResultFunc(
  [import.meta.filename, 'onBundlePulled'],
  async (
    trace: Trace,
    { store, syncService, bundle }: { store: MutableSyncableStore; syncService: SyncService; bundle: OutOfSyncBundle },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const pushedLocally = await pushBundle(trace, store, { path, metadata: bundle.metadata, batchContents: bundle.batchContents });
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    const localBundle = await getBundleAtPathForSync(trace, store, path, { strategy: 'default' });
    if (!localBundle.ok) {
      return localBundle;
    }

    const localMetadataById = localBundle.value.metadataById;

    const outOfSyncEntries = objectEntries(objectWithSortedKeys(bundle.hashesById, syncableIdComparator)).filter(
      ([id, remoteHash]) => remoteHash !== undefined && localMetadataById[id]?.hash !== remoteHash
    );

    if (outOfSyncEntries.length > 0) {
      DEV: debugTopic('SYNC', (log) =>
        log(
          `Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to pull ${outOfSyncEntries.length} items: ${outOfSyncEntries
            .slice(0, 3)
            .map(([id, _localMetadata]) => id)
            .join(',')}${outOfSyncEntries.length > 3 ? '…' : ''}`
        )
      );

      const enqueued = await allResultsMapped(trace, outOfSyncEntries, {}, async (_trace, [id, _remoteHash]) => {
        const shouldPullFromRemote = await syncService.shouldPullFromRemote({ store, remoteId, path: path.append(id) });
        if (!shouldPullFromRemote) {
          return makeSuccess(undefined);
        }

        syncService.pullFromRemotes({ remoteId, path: path.append(id), hash: localMetadataById[id]?.hash });

        return makeSuccess(undefined);
      });
      if (!enqueued.ok) {
        return enqueued;
      }
    } else {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local has all remote content`));
    }

    // Pushing any missing content to the remote
    const pushed = await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: bundle }, { remoteId, path });
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
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const pushedLocally = await pushFolder(trace, store, { path, metadata: folder.metadata, batchContents: folder.batchContents });
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    const localFolder = await getFolderAtPathForSync(trace, store, path, { strategy: 'default' });
    if (!localFolder.ok) {
      return localFolder;
    }

    const localMetadataById = localFolder.value.metadataById;

    const outOfSyncEntries = objectEntries(objectWithSortedKeys(folder.hashesById, syncableIdComparator)).filter(
      ([id, remoteHash]) => remoteHash !== undefined && localMetadataById[id]?.hash !== remoteHash
    );

    if (outOfSyncEntries.length > 0) {
      DEV: debugTopic('SYNC', (log) =>
        log(
          `Pulled ${path.toShortString()}: local and remote are out of sync.  Will try to pull ${outOfSyncEntries.length} items: ${outOfSyncEntries
            .slice(0, 3)
            .map(([id, _localMetadata]) => id)
            .join(',')}${outOfSyncEntries.length > 3 ? '…' : ''}`
        )
      );

      const enqueued = await allResultsMapped(trace, outOfSyncEntries, {}, async (_trace, [id, _remoteHash]) => {
        const shouldPullFromRemote = await syncService.shouldPullFromRemote({ store, remoteId, path: path.append(id) });
        if (!shouldPullFromRemote) {
          return makeSuccess(undefined);
        }

        syncService.pullFromRemotes({ remoteId, path: path.append(id), hash: localMetadataById[id]?.hash });

        return makeSuccess(undefined);
      });
      if (!enqueued.ok) {
        return enqueued;
      }
    } else {
      DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}: local has all remote content`));
    }

    // Pushing any missing content to the remote
    const pushed = await pushMissingSyncableContentToRemote(trace, { store, syncService, pulled: folder }, { remoteId, path });
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

    DEV: debugTopic('SYNC', (log) => log(`Pulled ${path.toShortString()}.  Will store`));

    const pushedLocally = await pushFile(trace, store, { path, metadata: file.metadata, data: fileData });
    // (trace, store, path, fileData, file.metadata);
    if (!pushedLocally.ok) {
      return generalizeFailureResult(trace, pushedLocally, 'not-found');
    }

    return makeSuccess(undefined);
  }
);
