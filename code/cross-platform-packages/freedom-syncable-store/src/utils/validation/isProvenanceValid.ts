import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableFileAccessor, SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { useAccessControlDocument } from '../../internal/context/accessControlDocument.ts';
import { getOwningAccessControlDocument } from '../get/getOwningAccessControlDocument.ts';
import { isAcceptanceValid } from './internal/isAcceptanceValid.ts';
import { isOriginValid } from './internal/isOriginValid.ts';
import { isAccessControlDocumentSnapshotFilePath, isSpecialAutomaticallyTrustedPath } from './internal/special-path-checks.ts';
import { isAccessControlSnapshotProvenanceValid } from './isAccessControlSnapshotProvenanceValid.ts';
import { isRootProvenanceValid } from './isRootProvenanceValid.ts';

export const isProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<boolean> => {
    if (store.localTrustMarks.isTrusted(item.path, 'provenance')) {
      return makeSuccess(true);
    }

    if (item.path.ids.length === 0) {
      return await isRootProvenanceValid(trace, store);
    }

    if (isSpecialAutomaticallyTrustedPath(item.path)) {
      store.localTrustMarks.markTrusted(item.path, 'provenance');
      return makeSuccess(true);
    }

    // Access control snapshots are special, since they can only be created by the store creator or the folder creator
    if (isAccessControlDocumentSnapshotFilePath(item.path)) {
      return await isAccessControlSnapshotProvenanceValid(trace, store, item as SyncableFileAccessor);
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

    // If the acceptance is set, that's all we'll consider
    if (provenance.acceptance !== undefined) {
      const acceptanceValid = await isAcceptanceValid(trace, store, item, {
        acceptance: provenance.acceptance,
        accessControlDoc: accessControlDoc.value
      });
      if (!acceptanceValid.ok) {
        return acceptanceValid;
      } else if (!acceptanceValid.value) {
        return makeSuccess(false);
      }

      store.localTrustMarks.markTrusted(item.path, 'provenance');
      return makeSuccess(true);
    }

    const originValid = await isOriginValid(trace, store, item, { origin: provenance.origin, accessControlDoc: accessControlDoc.value });
    if (!originValid.ok) {
      return originValid;
    } else if (!originValid.value) {
      return makeSuccess(false);
    }

    store.localTrustMarks.markTrusted(item.path, 'provenance');
    return makeSuccess(true);
  }
);
