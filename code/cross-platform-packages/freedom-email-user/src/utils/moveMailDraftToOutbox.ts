import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailAccess } from 'freedom-email-sync';

import type { MailDraftId } from '../types/MailDraftId.ts';
import { addMailToOutbox } from './addMailToOutbox.ts';
import { deleteMailDraftById } from './deleteMailDraftById.ts';
import { getMailDraftById } from './getMailDraftById.ts';
import { makeMailFromDraft } from './makeMailFromDraft.ts';

export const moveMailDraftToOutbox = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, draftId: MailDraftId): PR<undefined, 'not-found'> => {
    const draft = await getMailDraftById(trace, access, draftId);
    if (!draft.ok) {
      return draft;
    }

    const mail = makeMailFromDraft(draft.value.document);

    const addedToOutbox = await addMailToOutbox(trace, access, mail);
    if (!addedToOutbox.ok) {
      return addedToOutbox;
    }

    const deleted = await deleteMailDraftById(trace, access, draftId);
    if (!deleted.ok) {
      return deleted;
    }

    return makeSuccess(undefined);
  }
);
