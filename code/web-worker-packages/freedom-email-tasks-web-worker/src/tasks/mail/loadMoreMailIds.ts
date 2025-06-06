import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

import type { MailMessagesDataSetId } from '../../types/mail/MailMessagesDataSetId.ts';

export const loadMoreMessagesByDataSetId = new Map<MailMessagesDataSetId, (upToAtLeast: number) => Promise<void>>();

export const loadMoreMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, dataSetId: MailMessagesDataSetId, upToAtLeast: number): PR<undefined, 'not-found'> => {
    const loadMore = loadMoreMessagesByDataSetId.get(dataSetId);
    if (loadMore === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `Data set with ID: ${dataSetId} was disconnected`, errorCode: 'not-found' }));
    }

    await loadMore(upToAtLeast);

    return makeSuccess(undefined);
  }
);
