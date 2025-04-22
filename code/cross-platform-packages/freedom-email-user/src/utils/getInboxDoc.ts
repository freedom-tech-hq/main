import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { getOrCreateBundleAtPath, getOrCreateConflictFreeDocumentBundleAtPath } from 'freedom-syncable-store';
import type { SaveableDocument } from 'freedom-syncable-store-types';

import type { MailCollectionDocumentPrefix } from '../types/MailCollectionDocument.ts';
import { MailCollectionDocument } from '../types/MailCollectionDocument.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const getInboxDoc = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess
  ): PR<SaveableDocument<MailCollectionDocument>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const nowDate = new Date();

    const currentYearBundle = await getOrCreateBundleAtPath(trace, userFs, paths.collections.inbox.year(nowDate).value);
    if (!currentYearBundle.ok) {
      return generalizeFailureResult(trace, currentYearBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return await getOrCreateConflictFreeDocumentBundleAtPath<MailCollectionDocumentPrefix, MailCollectionDocument>(
      trace,
      userFs,
      paths.collections.inbox.year(nowDate).month,
      MailCollectionDocument,
      { newDocument: () => MailCollectionDocument.newDocument() }
    );
  }
);
