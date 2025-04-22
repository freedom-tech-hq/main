import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError, generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import { rolesWithWriteAccess } from 'freedom-syncable-store-types';

import { useAccessControlDocument } from '../../internal/context/accessControlDocument.ts';
import { getOwningAccessControlDocument } from '../get/getOwningAccessControlDocument.ts';
import { getRoleForOrigin } from './getRoleForOrigin.ts';
import { isAccessControlDocumentSnapshotFilePath, isSpecialAutomaticallyTrustedPath } from './internal/special-path-checks.ts';

export const isSyncableItemAcceptedOrWasWriteLegit = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<boolean, 'untrusted'> => {
    if (store.localTrustMarks.isTrusted(item.path, 'accepted-or-legit-write')) {
      return makeSuccess(true);
    }

    if (isSpecialAutomaticallyTrustedPath(item.path)) {
      store.localTrustMarks.markTrusted(item.path, 'accepted-or-legit-write');
      return makeSuccess(true);
    }

    // Access control snapshots are special, since they can only be created by the store creator or the folder creator
    // It's assumed that the provenance is validated elsewhere
    if (isAccessControlDocumentSnapshotFilePath(item.path)) {
      store.localTrustMarks.markTrusted(item.path, 'accepted-or-legit-write');
      return makeSuccess(true);
    }

    const accessControlDocFromContext = useAccessControlDocument(trace).accessControlDoc;

    const accessControlDoc = await (accessControlDocFromContext !== undefined
      ? Promise.resolve(makeSuccess(accessControlDocFromContext))
      : getOwningAccessControlDocument(trace, store, item.path));
    if (!accessControlDoc.ok) {
      return generalizeFailureResult(trace, accessControlDoc, 'not-found');
    }

    const metadata = await item.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const provenance = metadata.value.provenance;

    // If the acceptance is set, that's all we'll consider.  It's assumed that the validity of the acceptance and provenance as a whole are
    // validated elsewhere
    if (provenance.acceptance !== undefined) {
      store.localTrustMarks.markTrusted(item.path, 'accepted-or-legit-write');
      return makeSuccess(true);
    }

    const originRole = await getRoleForOrigin(trace, store, { origin: provenance.origin, accessControlDoc: accessControlDoc.value });
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
