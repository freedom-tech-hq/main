import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess, MailId } from 'freedom-email-sync';
import { createBundleAtPath, createConflictFreeDocumentBundleAtPath } from 'freedom-syncable-store-types';

import { makeNewMailDraftDocument } from '../types/MailDraftDocument.ts';
import { type MailDraftId, mailDraftIdInfo } from '../types/MailDraftId.ts';
import { getMailSummaryById } from './getMailSummaryById.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const addMailDraft = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, { inReplyToMailId }: { inReplyToMailId?: MailId }): PR<{ draftId: MailDraftId }> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const draftId = mailDraftIdInfo.make();
    const draftIdPath = await paths.drafts.draftId(draftId);
    const draftBundle = await createBundleAtPath(trace, userFs, draftIdPath.value);
    if (!draftBundle.ok) {
      return generalizeFailureResult(trace, draftBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // If this is in reply to another email, we should determine the subject from the original email
    let subject: string | undefined;
    if (inReplyToMailId !== undefined) {
      const mailSummary = await getMailSummaryById(trace, access, inReplyToMailId);
      if (!mailSummary.ok) {
        return generalizeFailureResult(trace, mailSummary, 'not-found');
      }

      subject = mailSummary.value.subject;
    }

    const created = await createConflictFreeDocumentBundleAtPath(trace, userFs, draftIdPath.draft, {
      newDocument: () => makeNewMailDraftDocument({ inReplyToMailId, subject })
    });
    if (!created.ok) {
      return generalizeFailureResult(trace, created, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ draftId });
  }
);
