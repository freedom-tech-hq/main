import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Paginated, PaginationOptions } from 'freedom-paginated-data';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { type MailId } from '../types/MailId.ts';
import { getMailPaths } from './getMailPaths.ts';
import { listTimeOrganizedMailIds } from './listTimeOrganizedMailIds.ts';

/** Items are in reverse order by time */
export const listOutboundMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, options: PaginationOptions = {}): PR<Paginated<MailId>> => {
    const paths = await getMailPaths(syncableStore);

    return await listTimeOrganizedMailIds(trace, syncableStore, { ...options, timeOrganizedPaths: paths.out });
  }
);
