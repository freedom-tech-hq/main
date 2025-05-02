import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { getMutableConflictFreeDocumentFromBundleAtPath } from 'freedom-syncable-store';
import type { SaveableDocument } from 'freedom-syncable-store-types';

import { MailDraftDocument } from '../types/MailDraftDocument.ts';
import type { MailDraftId } from '../types/MailDraftId.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const getMailDraftById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, draftId: MailDraftId): PR<SaveableDocument<MailDraftDocument>, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const draftDocPath = (await paths.drafts.draftId(draftId)).draft;

    const doc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, userFs, draftDocPath, MailDraftDocument);
    if (!doc.ok) {
      return generalizeFailureResult(trace, doc, ['format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(doc.value);
  }
);
