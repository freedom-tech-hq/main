import type { PR, PRFunc } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type {
  BottomUpMailStorageTraversalResult,
  HourTimeObject,
  MailId,
  TimeOrganizedMailStorageTraverserAccessor
} from 'freedom-email-sync';
import { listTimeOrganizedMailIdsForHour, mailIdInfo, traverseTimeOrganizedMailStorageFromTheBottomUp } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { getUserMailPaths } from 'freedom-email-user';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncTrackerItemAddedEvent } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { createMailIdMarkerFile } from '../../utils/createMailIdMarkerFile.ts';
import { getOrCreateEmailSyncableStore } from '../user/getOrCreateEmailSyncableStore.ts';

/** Looks for mail that hasn't been processed yet.  For each unprocessed mail in the storage folder, this determines which collections the
 * mail belongs to: ex. inbox, spam, and then adds it to the appropriate collection.  Every unprocessed mail should end up in at least one
 * collection. */
export const routeMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<{ stop: PRFunc<undefined> }> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const paths = await getUserMailPaths(syncableStore);

    // Used for mail that comes in while the app is already launched
    const highPriorityQueue = new TaskQueue('route-mail-high-priority', trace);
    highPriorityQueue.start();

    const removeItemAddedListener = syncableStore.addListener('itemAdded', async (event: SyncTrackerItemAddedEvent) => {
      const { path } = event;
      if (!path.startsWith(paths.storage.value)) {
        return;
      }

      const mailId = path.ids.map(extractUnmarkedSyncableId).find(mailIdInfo.is);
      if (mailId === undefined) {
        // Not a MailID, ignore
        return;
      }

      highPriorityQueue.add(mailId, (trace) => routeSingleMailIdNeeded(trace, credential, mailId));
    });

    // Used for historical mail
    const lowPriorityQueue = new TaskQueue('route-mail-low-priority', trace);
    lowPriorityQueue.start({ maxConcurrency: 1 });

    // Detecting previously-received emails that haven't been routed yet
    let wasStopped = false;
    // Not waiting
    traverseTimeOrganizedMailStorageFromTheBottomUp(
      trace,
      syncableStore,
      { timeOrganizedPaths: paths.storage },
      async (trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
        if (wasStopped) {
          return makeSuccess('stop' as const);
        }

        const alreadyProcessed = await isEverythingProcessedForRoutingAtLevel(trace, credential, cursor);
        if (!alreadyProcessed.ok) {
          // If there's an error, just skip -- this should be retried when routeMail is retriggered (e.g. on the next app launch)
          return makeSuccess('skip' as const);
        } else if (alreadyProcessed.value) {
          return makeSuccess('skip' as const);
        }

        if (cursor.type === 'hour') {
          const routed = await routeMailForHourAsNeeded(trace, credential, { taskQueue: lowPriorityQueue, hour: cursor.value });
          if (!routed.ok) {
            // If there's an error, just skip -- this should be retried when routeMail is retriggered (e.g. on the next app launch)
            return makeSuccess('skip' as const);
          }

          return makeSuccess('skip' as const);
        } else {
          return makeSuccess('inspect' as const);
        }
      }
    );

    const stop = makeAsyncResultFunc([import.meta.filename, 'stop'], async (_trace): PR<undefined> => {
      highPriorityQueue.stop();
      lowPriorityQueue.stop();
      wasStopped = true;
      removeItemAddedListener();

      await highPriorityQueue.wait();
      await lowPriorityQueue.wait();

      return makeSuccess(undefined);
    });

    return makeSuccess({ stop });
  }
);

// TODO: move
const hasMailBeenProcessedForRoutingAlready = makeAsyncResultFunc(
  [import.meta.filename, 'hasMailBeenProcessedForRoutingAlready'],
  async (trace, credential: EmailCredential, mailId: MailId): PR<boolean> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    // TODO: handle routing into spam or custom collections as well
    const timeMSec = mailIdInfo.extractTimeMSec(mailId);
    const mailDate = new Date(timeMSec);

    const paths = await getUserMailPaths(syncableStore);

    const routeProcessedMarkerFilePath = paths.routeProcessing.year(mailDate).month.day.hour.mailId(mailId);
    const syncableItem = await disableLam('not-found', getSyncableAtPath)(trace, syncableStore, routeProcessedMarkerFilePath, 'file');
    if (!syncableItem.ok) {
      if (syncableItem.value.errorCode === 'not-found') {
        return makeSuccess(false);
      }
      return generalizeFailureResult(trace, excludeFailureResult(syncableItem, 'not-found'), ['untrusted', 'wrong-type']);
    }

    return makeSuccess(true);
  }
);

// TODO: move
const isEverythingProcessedForRoutingAtLevel = makeAsyncResultFunc(
  [import.meta.filename, 'isEverythingProcessedForRoutingAtLevel'],
  async (_trace, _credential: EmailCredential, _level: TimeOrganizedMailStorageTraverserAccessor): PR<boolean> => {
    // TODO: TEMP
    return makeSuccess(false);
  }
);

const routeMailForHourAsNeeded = makeAsyncResultFunc(
  [import.meta.filename, 'routeMailForHourAsNeeded'],
  async (trace, credential: EmailCredential, { taskQueue, hour }: { taskQueue: TaskQueue; hour: HourTimeObject }): PR<undefined> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const paths = await getUserMailPaths(syncableStore);

    const mailIdsForHour = await listTimeOrganizedMailIdsForHour(trace, syncableStore, { timeOrganizedMailStorage: paths.storage, hour });
    if (!mailIdsForHour.ok) {
      return mailIdsForHour;
    }

    for (const mailId of mailIdsForHour.value) {
      taskQueue.add(mailId, (trace) => routeSingleMailIdNeeded(trace, credential, mailId));
    }

    return makeSuccess(undefined);
  }
);

const routeSingleMail = makeAsyncResultFunc(
  [import.meta.filename, 'routeSingleMail'],
  async (trace, credential: EmailCredential, mailId: MailId): PR<undefined> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const paths = await getUserMailPaths(syncableStore);

    // TODO: handle routing into spam or custom collections as well

    const createdCollectionMembershipMarker = await createMailIdMarkerFile(trace, syncableStore, paths.collections.inbox, mailId);
    if (!createdCollectionMembershipMarker.ok) {
      return createdCollectionMembershipMarker;
    }

    const createdRouteProcessedMarker = await createMailIdMarkerFile(trace, syncableStore, paths.routeProcessing, mailId);
    if (!createdRouteProcessedMarker.ok) {
      return createdRouteProcessedMarker;
    }

    // TODO: we need to detect if we think we've processed everything for routing and update the hashes docs

    return makeSuccess(undefined);
  }
);

const routeSingleMailIdNeeded = makeAsyncResultFunc(
  [import.meta.filename, 'routeSingleMailIdNeeded'],
  async (trace, credential: EmailCredential, mailId: MailId): PR<undefined> => {
    const alreadyProcessed = await hasMailBeenProcessedForRoutingAlready(trace, credential, mailId);
    if (!alreadyProcessed.ok) {
      return alreadyProcessed;
    } else if (alreadyProcessed.value) {
      return makeSuccess(undefined); // Nothing to do, already processed
    }

    const routed = await routeSingleMail(trace, credential, mailId);
    if (!routed.ok) {
      return routed;
    }

    return makeSuccess(undefined);
  }
);
