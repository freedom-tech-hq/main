import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError, generalizeFailureResult } from 'freedom-common-errors';

import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { editorAndAboveRoles, rolesWithWriteAccess } from '../../types/SyncableStoreRole.ts';
import { getRoleForOriginWithPath } from './getRoleForOriginWithPath.ts';

export const isSyncableItemAcceptedOrWasWriteLegit = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<boolean, 'untrusted'> => {
    if (store.localTrustMarks.isTrusted(item.path, 'accepted-or-legit-write')) {
      return makeSuccess(true);
    }

    const provenance = await item.getProvenance(trace);
    if (!provenance.ok) {
      return provenance;
    }

    // If the acceptance is set, that's all we'll consider.  It's assumed that the validity of the acceptance and provenance as a whole are
    // validated elsewhere
    if (provenance.value.acceptance !== undefined) {
      store.localTrustMarks.markTrusted(item.path, 'accepted-or-legit-write');
      return makeSuccess(true);
    }

    const originRole = await getRoleForOriginWithPath(trace, store, { path: item.path, origin: provenance.value.origin });
    if (!originRole.ok) {
      return generalizeFailureResult(trace, originRole, ['deleted', 'not-found', 'wrong-type']);
    } else if (originRole.value === undefined) {
      // This shouldn't happen
      return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
    }

    // Checking that the user has at least general write access
    if (!rolesWithWriteAccess.has(originRole.value)) {
      // It's also possible that permissions are just temporarily out of sync
      return makeSuccess(false);
    }

    store.localTrustMarks.markTrusted(item.path, 'accepted-or-legit-write');
    return makeSuccess(true);
  }
);
