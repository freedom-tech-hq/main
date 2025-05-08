import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { encName } from 'freedom-sync-types';
import { createBundleAtPath, createConflictFreeDocumentBundleAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { MailDraftDocument } from '../types/MailDraftDocument.ts';
import { type MailDraftId, mailDraftIdInfo } from '../types/MailDraftId.ts';
import { getMailSummaryById } from './getMailSummaryById.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const addMailDraft = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, { inReplyToMailId }: { inReplyToMailId?: MailId }): PR<{ draftId: MailDraftId }> => {
    const paths = await getUserMailPaths(syncableStore);

    const draftId = mailDraftIdInfo.make();
    const draftIdPath = await paths.drafts.draftId(draftId);
    const draftBundle = await createBundleAtPath(trace, syncableStore, draftIdPath.value, { name: encName(draftId) });
    if (!draftBundle.ok) {
      return generalizeFailureResult(trace, draftBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // If this is in reply to another email, we should determine the subject from the original email
    let subject: string | undefined;
    if (inReplyToMailId !== undefined) {
      const mailSummary = await getMailSummaryById(trace, syncableStore, inReplyToMailId);
      if (!mailSummary.ok) {
        return generalizeFailureResult(trace, mailSummary, 'not-found');
      }

      subject = mailSummary.value.subject;
    }

    const created = await createConflictFreeDocumentBundleAtPath(trace, syncableStore, draftIdPath.draft, {
      name: encName('draft'),
      newDocument: () => MailDraftDocument.newDocument({ inReplyToMailId, subject })
    });
    if (!created.ok) {
      return generalizeFailureResult(trace, created, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ draftId });
  }
);
