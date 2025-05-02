import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { getMutableBundleAtPath } from 'freedom-syncable-store';

import type { MailDraftId } from '../types/MailDraftId.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const deleteMailDraftById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, draftId: MailDraftId): PR<undefined, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);
    const draftsPath = paths.drafts.value;

    const draftBundlePath = await paths.drafts.draftId(draftId);

    const draftsBundle = await getMutableBundleAtPath(trace, userFs, draftsPath);
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
