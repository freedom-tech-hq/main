import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import type { EmailAccess } from '../types/EmailAccess.ts';
import type { MailId } from '../types/MailId.ts';
import { addMail } from './addMail.ts';
import { deleteOutboundMailById } from './deleteOutboundMailById.ts';
import { getOutboundMailById } from './getOutboundMailById.ts';

export const moveOutboundMailToStorage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mailId: MailId): PR<undefined, 'not-found'> => {
    const outboundMail = await getOutboundMailById(trace, access, mailId);
    if (!outboundMail.ok) {
      return outboundMail;
    }

    const addedToStorage = await addMail(trace, access, outboundMail.value);
    if (!addedToStorage.ok) {
      return addedToStorage;
    }

    const deleteOutbound = await deleteOutboundMailById(trace, access, mailId);
    if (!deleteOutbound.ok) {
      return deleteOutbound;
    }

    return makeSuccess(undefined);
  }
);
