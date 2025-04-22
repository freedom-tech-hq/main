import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import type { Paginated, PaginationOptions } from 'freedom-paginated-data';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath } from 'freedom-syncable-store';

import { type MailDraftId, mailDraftIdInfo } from '../types/MailDraftId.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

/** Items are in reverse order by time */
export const listMailDraftIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, _options: PaginationOptions = {}): PR<Paginated<MailDraftId>> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const draftsPath = paths.drafts.value;
    const draftsBundle = await getBundleAtPath(trace, userFs, draftsPath);
    if (!draftsBundle.ok) {
      return generalizeFailureResult(trace, draftsBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const syncableIdsInDrafts = await draftsBundle.value.getIds(trace, { type: 'bundle' });
    if (!syncableIdsInDrafts.ok) {
      return syncableIdsInDrafts;
    }

    const draftIds = syncableIdsInDrafts.value
      .map((syncableId) => mailDraftIdInfo.checked(extractUnmarkedSyncableId(syncableId)))
      .filter((v) => v !== undefined)
      .sort()
      .reverse();

    // While this API is setup for pagination, pagination isn't actually used since everything is in one bundle
    return makeSuccess({ items: draftIds });
  }
);
