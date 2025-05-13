import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { extractNumberFromPlainSyncableId } from 'freedom-email-sync';
import type { EmailCredential, UserMailPaths } from 'freedom-email-user';
import { getUserMailPaths, mailCollectionTypes } from 'freedom-email-user';
import type { MakeSyncServiceArgs, RemoteSyncService, SyncStrategy } from 'freedom-remote-sync';
import { makeSyncService } from 'freedom-remote-sync';
import type { SyncablePath } from 'freedom-sync-types';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getSyncableAtPath } from 'freedom-syncable-store';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { DateTime } from 'luxon';

import { getOrCreateEmailSyncableStore } from '../user/getOrCreateEmailSyncableStore.ts';

export const makeSyncServiceForUserSyncables = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      credential,
      ...fwdArgs
    }: Omit<MakeSyncServiceArgs, 'getSyncStrategyForPath' | 'shouldPullFromRemote' | 'shouldPushToRemote' | 'store'> & {
      credential: EmailCredential;
    }
  ): PR<RemoteSyncService> => {
    const syncableStoreResult = await getOrCreateEmailSyncableStore(trace, credential);
    if (!syncableStoreResult.ok) {
      return syncableStoreResult;
    }

    const userFs = syncableStoreResult.value;
    const paths = await getUserMailPaths(userFs);

    // TODO: should maybe be LRU / time based
    // TODO: across refreshes?
    // TODO: need to be able to have content expire and fall away
    /** Strings are relative to root */
    // const interestedInPaths = new Set<string>();

    // let removeItemAccessedListener: (() => void) | undefined;
    // let removeItemNotFoundListener: (() => void) | undefined;

    return makeSyncService(trace, {
      ...fwdArgs,
      shouldPullFromRemote: () => ({ strategy: 'stack' }),
      // shouldPullFromRemote: ({ path }) => {
      //   const parentPath = path.parentPath;
      //   return (
      //     interestedInPaths.has(path.toRelativePathString(userFs.path)) ||
      //     (parentPath !== undefined && interestedInPaths.has(parentPath.toRelativePathString(userFs.path)))
      //   );
      // },
      shouldPushToRemote: () => ({ strategy: 'stack' }),
      getSyncStrategyForPath: async (direction, path): Promise<SyncStrategy> => {
        if (Math.random() < 1) {
          return 'stack';
        }

        switch (direction) {
          case 'pull': {
            const found = await disableLam('not-found', getSyncableAtPath)(trace, userFs, path);
            if (!found.ok) {
              if (found.value.errorCode === 'not-found') {
                return 'stack';
              }
            }
            break;
          }
          case 'push':
            break;
        }

        if (getNonCustomCollectionHourPaths(paths, path) !== undefined || getRouteProcessingHourPath(paths, path) !== undefined) {
          return 'stack';
        }

        return 'item';
      },
      // onStart: ({ syncService }) => {
      //   removeItemAccessedListener = userFs.addListener('itemAccessed', ({ path }) => {
      //     interestedInPaths.add(path.toRelativePathString(userFs.path));
      //   });
      //   removeItemNotFoundListener = userFs.addListener('itemNotFound', ({ path }) =>
      //     syncService.enqueuePullFromRemotes(trace, { path })
      //   );
      // },
      // onStop: () => {
      //   removeItemAccessedListener?.();
      //   removeItemAccessedListener = undefined;

      //   removeItemNotFoundListener?.();
      //   removeItemNotFoundListener = undefined;
      // },
      store: userFs
    });
  }
);

/** Returns the paths object only if the specified path is exactly a collections (excluding custom) hour path */
const getNonCustomCollectionHourPaths = (paths: UserMailPaths, path: SyncablePath) => {
  if (!path.startsWith(paths.collections.value)) {
    return undefined;
  }

  const restIds = path.ids.slice(paths.collections.value.ids.length);
  if (restIds.length !== 5) {
    return undefined;
  }

  const collectionType = mailCollectionTypes.exclude('custom').checked(extractUnmarkedSyncableId(restIds[0]));
  if (collectionType === undefined) {
    return undefined;
  }

  const year = extractNumberFromPlainSyncableId(restIds[1]);
  if (year === undefined) {
    return undefined;
  }

  const month = extractNumberFromPlainSyncableId(restIds[2]);
  if (month === undefined) {
    return undefined;
  }

  const day = extractNumberFromPlainSyncableId(restIds[3]);
  if (day === undefined) {
    return undefined;
  }

  const hour = extractNumberFromPlainSyncableId(restIds[4]);
  if (hour === undefined) {
    return undefined;
  }

  const date = DateTime.fromObject({ year, month, day, hour }, { zone: 'UTC' }).toJSDate();

  return paths.collections[collectionType].year(date).month.day.hour;
};

/** Returns the paths object only if the specified path is exactly a route processing hour path */
const getRouteProcessingHourPath = (paths: UserMailPaths, path: SyncablePath) => {
  if (!path.startsWith(paths.routeProcessing.value)) {
    return undefined;
  }

  const restIds = path.ids.slice(paths.routeProcessing.value.ids.length);
  if (restIds.length !== 4) {
    return undefined;
  }

  const year = extractNumberFromPlainSyncableId(restIds[0]);
  if (year === undefined) {
    return undefined;
  }

  const month = extractNumberFromPlainSyncableId(restIds[1]);
  if (month === undefined) {
    return undefined;
  }

  const day = extractNumberFromPlainSyncableId(restIds[2]);
  if (day === undefined) {
    return undefined;
  }

  const hour = extractNumberFromPlainSyncableId(restIds[3]);
  if (hour === undefined) {
    return undefined;
  }

  const date = DateTime.fromObject({ year, month, day, hour }, { zone: 'UTC' }).toJSDate();

  return paths.routeProcessing.year(date).month.day.hour;
};
