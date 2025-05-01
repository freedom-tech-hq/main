import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { EmailAccess, MailId } from 'freedom-email-sync';
import { getMailPaths, listTimeOrganizedMailIds } from 'freedom-email-sync';
import type { Paginated, PaginationOptions } from 'freedom-paginated-data';

/** Items are in reverse order by time */
export const listMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, options: PaginationOptions = {}): PR<Paginated<MailId>> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    return await listTimeOrganizedMailIds(trace, access, { ...options, timeOrganizedPaths: paths.storage });
  }
);
