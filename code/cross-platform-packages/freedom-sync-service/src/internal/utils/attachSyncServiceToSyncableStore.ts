import type { PR } from 'freedom-async';
import { allResultsMapped, debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectValues } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import { addCoordinatedHashSaltChangeListener } from 'freedom-crypto';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import { doPeriodic } from 'freedom-periodic';
import type { SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { getRecursiveFolderPaths, getSyncableHashAtPath } from 'freedom-syncable-store-types';

import { MANUAL_SYNC_INTERVAL_MSEC } from '../../consts/syncing.ts';
import type { SyncService } from '../../types/SyncService.ts';
import { generateStreamIdForPath } from '../../utils/generateStreamIdForPath.ts';
import { makeManualSyncFunc } from './makeManualSyncFunc.ts';

/** @returns a function to detach */
export const attachSyncServiceToSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    syncService: SyncService,
    { store, deviceNotificationClients }: { store: MutableSyncableStore; deviceNotificationClients: DeviceNotificationClient[] }
  ): PR<{ detach: () => void }> => {
    // TODO: probably separate this from the other syncing stuff
    let removeListenersByFolderPath: Partial<Record<string, (() => void)[]>> = {};

    const removeListeners = (removeListenersByFolderPath: Partial<Record<string, (() => void)[]>>) => {
      for (const removeListeners of objectValues(removeListenersByFolderPath)) {
        for (const removeListener of removeListeners ?? []) {
          removeListener();
        }
      }
    };

    const onRemoteContentChange = makeAsyncResultFunc(
      [import.meta.filename, 'onRemoteContentChange'],
      async (trace, { path, hash: remoteHash }: { path: SyncablePath; hash: Sha256Hash }): PR<undefined> => {
        syncService.appendLogEntry?.({ type: 'notified', pathString: path.toString() });

        const localHash = await getSyncableHashAtPath(trace, store, path);
        if (!localHash.ok) {
          // 'not-found' errors are expected in cases where the remote has content that the local doesn't know about yet
          // 'deleted' errors are expected in cases where the local has deleted the content but the deletion hasn't synced with the remote
          if (localHash.value.errorCode === 'deleted') {
            // Was locally deleted, so not interested in this content
            return makeSuccess(undefined);
          } else if (localHash.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(localHash, 'deleted', 'not-found'), ['untrusted', 'wrong-type']);
          }
        } else if (localHash.value === remoteHash) {
          return makeSuccess(undefined);
        }

        syncService.pullFromRemotes({ path, hash: localHash.ok ? localHash.value : undefined });

        return makeSuccess(undefined);
      }
    );

    const onFolderAdded = makeAsyncResultFunc([import.meta.filename, 'onFolderAdded'], async (trace, path: SyncablePath): PR<undefined> => {
      const streamId = await generateStreamIdForPath(trace, { path });
      if (!streamId.ok) {
        return streamId;
      }
      // TODO: there's a race condition here if the folder is removed during the generateStreamIdForPath call

      const pathString = path.toString();

      DEV: debugTopic('SYNC', (log) => log(`Adding contentChange listeners for ${path.toString()}`));
      for (const deviceNotificationClient of deviceNotificationClients) {
        removeListenersByFolderPath[pathString] = removeListenersByFolderPath[pathString] ?? [];
        removeListenersByFolderPath[pathString].push(
          deviceNotificationClient.addListener(`contentChange:${streamId.value}`, ({ hash }) => {
            onRemoteContentChange(trace, { path, hash });
          })
        );
      }

      const localHash = await getSyncableHashAtPath(trace, store, path);
      if (!localHash.ok) {
        return generalizeFailureResult(trace, localHash, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      // Pulling whenever we add a new folder because otherwise there's a race condition where the folder could have been changed on the
      // remote in the meantime
      syncService.pullFromRemotes({ path, hash: localHash.value });

      return makeSuccess(undefined);
    });

    const onFolderRemoved = (folderPath: SyncablePath) => {
      const folderPathString = folderPath.toString();
      const removeListeners = removeListenersByFolderPath[folderPathString];
      delete removeListenersByFolderPath[folderPathString];
      for (const removeListener of removeListeners ?? []) {
        removeListener();
      }

      return makeSuccess(undefined);
    };

    const rotateRemoteFolderContentChangeListeners = makeAsyncResultFunc(
      [import.meta.filename, 'rotateRemoteFolderContentChangeListeners'],
      async (trace): PR<undefined> => {
        const lastRemoveListenersByFolderPath = removeListenersByFolderPath;
        removeListenersByFolderPath = {};

        try {
          const rootAdded = await onFolderAdded(trace, store.path);
          if (!rootAdded.ok) {
            return rootAdded;
          }

          const allFolderPaths = await getRecursiveFolderPaths(trace, store);
          if (!allFolderPaths.ok) {
            return allFolderPaths;
          }

          const foldersAdded = await allResultsMapped(trace, allFolderPaths.value, {}, async (trace, folderPath) => {
            const folderAdded = await onFolderAdded(trace, folderPath);
            if (!folderAdded.ok) {
              return folderAdded;
            }

            return makeSuccess(undefined);
          });
          if (!foldersAdded.ok) {
            return foldersAdded;
          }

          return makeSuccess(undefined);
        } finally {
          removeListeners(lastRemoveListenersByFolderPath);
        }
      }
    );
    await rotateRemoteFolderContentChangeListeners(trace);
    const removeCoordinatedHashSaltChangeListener = addCoordinatedHashSaltChangeListener(() =>
      rotateRemoteFolderContentChangeListeners(trace)
    );

    DEV: debugTopic('SYNC', (log) => log(`Added folderAdded listener for ${store.path.toString()}`));
    const removeLocalFolderAddedListener = store.addListener('folderAdded', ({ path }) => {
      DEV: debugTopic('SYNC', (log) => log(`Received folderAdded for ${path.toString()}`));
      onFolderAdded(trace, path);
    });

    DEV: debugTopic('SYNC', (log) => log(`Added folderRemoved listener for ${store.path.toString()}`));
    const removeLocalFolderRemovedListener = store.addListener('folderRemoved', ({ path }) => {
      DEV: debugTopic('SYNC', (log) => log(`Received folderRemoved for ${path.toString()}`));
      onFolderRemoved(path);
    });

    DEV: debugTopic('SYNC', (log) => log(`Added needsSync listener for ${store.path.toString()}`));
    const removeLocalNeedsSyncListener = store.addListener('needsSync', ({ path, hash }) => {
      DEV: debugTopic('SYNC', (log) => log(`Received needsSync for ${path.toString()}: ${hash}`));
      syncService.pushToRemotes({ path, hash });
    });

    const recursiveManualSyncFunc = makeManualSyncFunc(syncService, store);
    const cancelSchedule = doPeriodic(
      async (trace) => {
        await recursiveManualSyncFunc(trace);
      },
      {
        intervalMSec: MANUAL_SYNC_INTERVAL_MSEC,
        edge: 'leading'
      }
    );

    return makeSuccess({
      detach: () => {
        removeCoordinatedHashSaltChangeListener();
        removeListeners(removeListenersByFolderPath);
        removeListenersByFolderPath = {};
        removeLocalFolderAddedListener();
        removeLocalFolderRemovedListener();
        removeLocalNeedsSyncListener();
        cancelSchedule();
      }
    });
  }
);
