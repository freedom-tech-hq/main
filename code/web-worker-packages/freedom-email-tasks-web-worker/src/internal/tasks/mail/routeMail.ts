import type { PR, PRFunc } from 'freedom-async';
import { bestEffort, log, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { BottomUpMailStorageTraversalResult, MailId, TimeOrganizedMailStorageTraverserAccessor } from 'freedom-email-sync';
import { listTimeOrganizedMailIdsForHour, mailIdInfo, traverseTimeOrganizedMailStorageFromTheBottomUp } from 'freedom-email-sync';
import type { HourTimeObject } from 'freedom-email-sync/lib/utils/HourPrecisionTimeUnitValue';
import type { EmailCredential } from 'freedom-email-user';
import { getCollectionDoc, getProcessedHashesTrackingDoc, getProcessedMailIdsTrackingDoc, getUserMailPaths } from 'freedom-email-user';
import type { SyncablePath } from 'freedom-sync-types';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath } from 'freedom-syncable-store';
import type { SyncTrackerItemAddedEvent } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { DateTime } from 'luxon';

import { getOrCreateEmailAccessForUser } from '../user/getOrCreateEmailAccessForUser.ts';

/** Looks for mail that hasn't been processed yet.  For each unprocessed mail in the storage folder, this determines which collections the
 * mail belongs to: ex. inbox, spam, and then adds it to the appropriate collection.  Every unprocessed mail should end up in at least one
 * collection. */
export const routeMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<{ stop: PRFunc<undefined> }> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    // Used for mail that comes in while the app is already launched
    const highPriorityQueue = new TaskQueue(trace);
    highPriorityQueue.start();

    const removeItemAddedListener = userFs.addListener('itemAdded', async (event: SyncTrackerItemAddedEvent) => {
      const { type, path } = event;
      if (type !== 'file' || !path.startsWith(paths.storage.value)) {
        return;
      }

      const mailId = path.ids.map(extractUnmarkedSyncableId).find(mailIdInfo.is);
      if (mailId === undefined) {
        // Couldn't determine mail ID
        log().debug?.(trace, `Failed to determine mail ID for path: ${path.toString()}`);
        return;
      }

      highPriorityQueue.add(mailId, (trace) => routeSingleMailIdNeeded(trace, credential, mailId));
    });

    // Used for historical mail
    const lowPriorityQueue = new TaskQueue(trace);
    lowPriorityQueue.start();

    // Detecting previously-received emails that haven't been routed yet
    let stopTraversal = false;
    // Not waiting
    traverseTimeOrganizedMailStorageFromTheBottomUp(
      trace,
      access,
      { timeOrganizedMailStorage: paths.storage },
      async (trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
        if (stopTraversal) {
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
      stopTraversal = true;
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
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    // TODO: handle routing into spam or custom collections as well
    const timeMSec = mailIdInfo.extractTimeMSec(mailId);
    const mailDate = new Date(timeMSec);

    const trackingDoc = await getProcessedMailIdsTrackingDoc(trace, access, mailDate);
    if (!trackingDoc.ok) {
      return generalizeFailureResult(trace, trackingDoc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(trackingDoc.value.document.mailIds.has(mailId));
  }
);

// TODO: move
const isEverythingProcessedForRoutingAtLevel = makeAsyncResultFunc(
  [import.meta.filename, 'isEverythingProcessedForRoutingAtLevel'],
  async (trace, credential: EmailCredential, level: TimeOrganizedMailStorageTraverserAccessor): PR<boolean> => {
    if (level.type === 'hour') {
      return makeSuccess(false);
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const trackingDoc = await getProcessedHashesTrackingDoc(trace, access, level);
    if (!trackingDoc.ok) {
      return generalizeFailureResult(trace, trackingDoc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const date = DateTime.fromObject(level.value, { zone: 'UTC' }).toJSDate();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);
    const yearPath = paths.storage.year(date);

    let bundlePath: SyncablePath;
    switch (level.type) {
      case 'day':
        bundlePath = yearPath.month.day.value;
        break;
      case 'month':
        bundlePath = yearPath.month.value;
        break;
      case 'year':
        bundlePath = yearPath.value;
        break;
    }

    const bundle = await getBundleAtPath(trace, userFs, bundlePath);
    if (!bundle.ok) {
      // If there's an error, just assume we haven't processed everything
      return makeSuccess(false);
    }

    const bundleHash = await bundle.value.getHash(trace);
    if (!bundleHash.ok) {
      // If there's an error, just assume we haven't processed everything
      return makeSuccess(false);
    }

    return makeSuccess(trackingDoc.value.document.hashes.has(bundleHash.value));
  }
);

const routeMailForHourAsNeeded = makeAsyncResultFunc(
  [import.meta.filename, 'routeMailForHourAsNeeded'],
  async (trace, credential: EmailCredential, { taskQueue, hour }: { taskQueue: TaskQueue; hour: HourTimeObject }): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const mailIdsForHour = await listTimeOrganizedMailIdsForHour(trace, access, { timeOrganizedMailStorage: paths.storage, hour });
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
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    // TODO: handle routing into spam or custom collections as well
    const timeMSec = mailIdInfo.extractTimeMSec(mailId);
    const mailDate = new Date(timeMSec);
    const collectionDoc = await getCollectionDoc(trace, access, { collectionType: 'inbox', date: mailDate });
    if (!collectionDoc.ok) {
      return generalizeFailureResult(trace, collectionDoc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const trackingDoc = await getProcessedMailIdsTrackingDoc(trace, access, mailDate);
    if (!trackingDoc.ok) {
      return generalizeFailureResult(trace, trackingDoc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    if (!collectionDoc.value.document.mailIds.has(mailId)) {
      collectionDoc.value.document.mailIds.add(mailId);

      // Not waiting
      bestEffort(trace, collectionDoc.value.saveSoon(trace));
    }

    if (!trackingDoc.value.document.mailIds.has(mailId)) {
      trackingDoc.value.document.mailIds.add(mailId);

      // Not waiting
      bestEffort(trace, trackingDoc.value.saveSoon(trace));
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
