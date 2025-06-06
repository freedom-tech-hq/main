import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

import type { MailThreadsDataSetId } from '../../types/mail/MailThreadsDataSetId.ts';

export const loadMoreThreadsByDataSetId = new Map<MailThreadsDataSetId, (upToAtLeast: number) => Promise<void>>();

export const loadMoreMailThreadIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, dataSetId: MailThreadsDataSetId, upToAtLeast: number): PR<undefined, 'not-found'> => {
    const loadMore = loadMoreThreadsByDataSetId.get(dataSetId);
    if (loadMore === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `Data set with ID: ${dataSetId} was disconnected`, errorCode: 'not-found' }));
    }

    await loadMore(upToAtLeast);

    return makeSuccess(undefined);
  }
);
