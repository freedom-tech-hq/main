import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { TimeOrganizedMarkerPaths } from 'freedom-email-user';
import type { Nested } from 'freedom-nest';
import type { SyncablePath } from 'freedom-sync-types';
import { createBinaryFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

const MARKER = Buffer.from('', 'utf-8');

export const createMailIdMarkerFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userFs: MutableSyncableStore, paths: Nested<SyncablePath, TimeOrganizedMarkerPaths>, mailId: MailId): PR<undefined> => {
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const yearPath = paths.year(mailDate);
    const createdStructure = await getOrCreateBundlesAtPaths(
      trace,
      userFs,
      paths.value,
      yearPath.value,
      yearPath.month.value,
      yearPath.month.day.value,
      yearPath.month.day.hour.value
    );
    if (!createdStructure.ok) {
      return generalizeFailureResult(trace, createdStructure, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const markerPath = yearPath.month.day.hour.mailId(mailId);

    const created = await disableLam(trace, 'conflict', (trace) => createBinaryFileAtPath(trace, userFs, markerPath, { value: MARKER }));
    if (!created.ok) {
      // Treating conflict as success, since it means the file already exists
      if (created.value.errorCode !== 'conflict') {
        return generalizeFailureResult(trace, excludeFailureResult(created, 'conflict'), ['not-found', 'untrusted', 'wrong-type']);
      }
    }

    return makeSuccess(undefined);
  }
);
