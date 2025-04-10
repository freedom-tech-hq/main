import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Paginated, PaginationOptions } from 'freedom-paginated-data';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId } from '../types/MailId.ts';
import { getMailPaths } from './getMailPaths.ts';
import { listTimeOrganizedMailIds } from './listTimeOrganizedMailIds.ts';

/** Items are in reverse order by time */
export const listOutboundMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, options: PaginationOptions = {}): PR<Paginated<MailId>> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    return await listTimeOrganizedMailIds(trace, access, { ...options, timeOrganizedMailStorage: paths.out });
  }
);
