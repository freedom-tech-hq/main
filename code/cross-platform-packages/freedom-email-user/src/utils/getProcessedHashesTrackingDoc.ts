import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import type { HourOrLessPrecisionValue, HourValue } from 'freedom-email-sync/lib/utils/HourPrecisionTimeUnitValue';
import type { SyncablePath } from 'freedom-sync-types';
import { getOrCreateBundlesAtPaths, getOrCreateConflictFreeDocumentBundleAtPath } from 'freedom-syncable-store';
import type { SaveableDocument } from 'freedom-syncable-store-types';
import { DateTime } from 'luxon';

import type { ProcessedHashesTrackingDocumentPrefix } from '../types/ProcessedHashesTrackingDocument.ts';
import { ProcessedHashesTrackingDocument } from '../types/ProcessedHashesTrackingDocument.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const getProcessedHashesTrackingDoc = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    level: Exclude<HourOrLessPrecisionValue, HourValue>
  ): PR<SaveableDocument<ProcessedHashesTrackingDocument>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const date = DateTime.fromObject(level.value, { zone: 'UTC' }).toJSDate();

    const yearPath = paths.routeProcessing.year(date);

    const bundlePaths: SyncablePath[] = [yearPath.value];
    let docPath: SyncablePath;
    switch (level.type) {
      case 'day':
        bundlePaths.push(yearPath.month.value, yearPath.month.day.value);
        docPath = await yearPath.month.day.processedHashesTrackingDoc();
        break;
      case 'month':
        bundlePaths.push(yearPath.month.value);
        docPath = await yearPath.month.processedHashesTrackingDoc();
        break;
      case 'year':
        docPath = await yearPath.processedHashesTrackingDoc();
        break;
    }

    const mailBundle = await getOrCreateBundlesAtPaths(trace, userFs, paths.routeProcessing.value, ...bundlePaths);
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return await getOrCreateConflictFreeDocumentBundleAtPath<ProcessedHashesTrackingDocumentPrefix, ProcessedHashesTrackingDocument>(
      trace,
      userFs,
      docPath,
      ProcessedHashesTrackingDocument,
      { newDocument: () => ProcessedHashesTrackingDocument.newDocument() }
    );
  }
);
