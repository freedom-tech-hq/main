import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getMutableBundleAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { MailDraftId } from '../types/MailDraftId.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const deleteMailDraftById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, draftId: MailDraftId): PR<undefined, 'not-found'> => {
    const paths = await getUserMailPaths(syncableStore);
    const draftsPath = paths.drafts.value;

    const draftBundlePath = await paths.drafts.draftId(draftId);

    const draftsBundle = await getMutableBundleAtPath(trace, syncableStore, draftsPath);
    if (!draftsBundle.ok) {
      return generalizeFailureResult(trace, draftsBundle, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    const deleted = await draftsBundle.value.delete(trace, draftBundlePath.value.lastId!);
    if (!deleted.ok) {
      return deleted;
    }

    return makeSuccess(undefined);
  }
);
