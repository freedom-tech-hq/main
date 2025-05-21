import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { MailId } from '../types/MailId.ts';
import { addMail } from './addMail.ts';
import { getOutboundMailById } from './getOutboundMailById.ts';

export const moveOutboundMailToStorage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mailId: MailId): PR<undefined, 'not-found'> => {
    // console.log('moveOutboundMailToStorage: before getOutboundMailById');
    const outboundMail = await getOutboundMailById(trace, syncableStore, mailId);
    if (!outboundMail.ok) {
      return outboundMail;
    }

    // console.log('moveOutboundMailToStorage: before addMail');
    const addedToStorage = await addMail(trace, syncableStore, outboundMail.value);
    if (!addedToStorage.ok) {
      return addedToStorage;
    }

    // Does not work
    // console.log('moveOutboundMailToStorage: before deleteOutboundMailById');
    // const deleteOutbound = await deleteOutboundMailById(trace, syncableStore, mailId);
    // if (!deleteOutbound.ok) {
    //   return deleteOutbound;
    // }

    // console.log('moveOutboundMailToStorage: done');

    return makeSuccess(undefined);
  }
);
