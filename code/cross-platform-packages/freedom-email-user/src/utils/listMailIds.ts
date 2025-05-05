import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { MailId } from 'freedom-email-sync';
import { getMailPaths, listTimeOrganizedMailIds } from 'freedom-email-sync';
import type { Paginated, PaginationOptions } from 'freedom-paginated-data';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

/** Items are in reverse order by time */
export const listMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, options: PaginationOptions = {}): PR<Paginated<MailId>> => {
    const paths = await getMailPaths(syncableStore);

    return await listTimeOrganizedMailIds(trace, syncableStore, { ...options, timeOrganizedPaths: paths.storage });
  }
);
