import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { getOrCreateBundlesAtPaths, getOrCreateConflictFreeDocumentBundleAtPath } from 'freedom-syncable-store';
import type { SaveableDocument } from 'freedom-syncable-store-types';

import type { ProcessedMailIdsTrackingDocumentPrefix } from '../types/ProcessedMailIdsTrackingDocument.ts';
import { ProcessedMailIdsTrackingDocument } from '../types/ProcessedMailIdsTrackingDocument.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const getProcessedMailIdsTrackingDoc = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    date: Date
  ): PR<SaveableDocument<ProcessedMailIdsTrackingDocument>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const yearPath = paths.routeProcessing.year(date);
    const docPath = await yearPath.month.day.hour.processedMailIdsTrackingDoc();

    const mailBundle = await getOrCreateBundlesAtPaths(
      trace,
      userFs,
      paths.routeProcessing.value,
      yearPath.value,
      yearPath.month.value,
      yearPath.month.day.value,
      yearPath.month.day.hour.value
    );
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return await getOrCreateConflictFreeDocumentBundleAtPath<ProcessedMailIdsTrackingDocumentPrefix, ProcessedMailIdsTrackingDocument>(
      trace,
      userFs,
      docPath,
      ProcessedMailIdsTrackingDocument,
      { newDocument: () => ProcessedMailIdsTrackingDocument.newDocument() }
    );
  }
);
