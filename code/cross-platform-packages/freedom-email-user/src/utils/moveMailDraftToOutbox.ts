import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { MailDraftId } from '../types/MailDraftId.ts';
import { addMailToOutbox } from './addMailToOutbox.ts';
import { deleteMailDraftById } from './deleteMailDraftById.ts';
import { getMailDraftById } from './getMailDraftById.ts';
import { makeMailFromDraft } from './makeMailFromDraft.ts';

export const moveMailDraftToOutbox = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, draftId: MailDraftId): PR<undefined, 'not-found'> => {
    const draft = await getMailDraftById(trace, syncableStore, draftId);
    if (!draft.ok) {
      return draft;
    }

    const mail = makeMailFromDraft(draft.value.document);

    const addedToOutbox = await addMailToOutbox(trace, syncableStore, mail);
    if (!addedToOutbox.ok) {
      return addedToOutbox;
    }

    const deleted = await deleteMailDraftById(trace, syncableStore, draftId);
    if (!deleted.ok) {
      return deleted;
    }

    return makeSuccess(undefined);
  }
);
