import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue, isSignedValueValid } from 'freedom-crypto';

import type { SyncableFileAccessor } from '../../types/SyncableFileAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getNearestFolder } from '../get/getNearestFolder.ts';
import { getOwningAccessControlDocument } from '../get/getOwningAccessControlDocument.ts';

/** Access control snapshots can only be created by the store creator or the folder creator */
export const isAccessControlSnapshotProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableFileAccessor): PR<boolean> => {
    if (store.localTrustMarks.isTrusted(item.path, 'provenance')) {
      return makeSuccess(true);
    }

    const metadata = await item.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const signedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: metadata.value.provenance.origin });
    if (!signedByKeyId.ok) {
      return generalizeFailureResult(trace, signedByKeyId, 'not-found');
    }

    if (signedByKeyId.value === store.creatorPublicKeys.id) {
      // If this was signed by the store creator, then it's always valid

      const isValid = await isSignedValueValid(
        trace,
        metadata.value.provenance.origin,
        { name: metadata.value.name, path: item.path, type: 'file' },
        { verifyingKeys: store.creatorPublicKeys }
      );
      if (!isValid.ok) {
        return isValid;
      } else if (!isValid.value) {
        return makeSuccess(false);
      }

      store.localTrustMarks.markTrusted(item.path, 'provenance');
      return makeSuccess(true);
    } else {
      // Otherwise, we'll check if this was signed by the folder creator using the keys from the folder's parent folder (since that's the
      // folder that would have granted access to create this folder)

      const folder = await getNearestFolder(trace, store, item.path);
      if (!folder.ok) {
        return generalizeFailureResult(trace, folder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      const folderMetadata = await folder.value.getMetadata(trace);
      if (!folderMetadata.ok) {
        return folderMetadata;
      }

      const folderSignedByKeyId = extractKeyIdFromSignedValue(trace, { signedValue: folderMetadata.value.provenance.origin });
      if (!folderSignedByKeyId.ok) {
        return generalizeFailureResult(trace, folderSignedByKeyId, 'not-found');
      }

      const folderParentPath = folder.value.path.parentPath;
      if (folderParentPath === undefined) {
        return makeSuccess(false);
      }

      const foldersParentFolderAccessControlDoc = await getOwningAccessControlDocument(trace, store, folderParentPath);
      if (!foldersParentFolderAccessControlDoc.ok) {
        return generalizeFailureResult(trace, foldersParentFolderAccessControlDoc, 'not-found');
      }

      const folderSignedByPublicKey = await foldersParentFolderAccessControlDoc.value.getPublicKeysById(trace, folderSignedByKeyId.value);
      if (!folderSignedByPublicKey.ok) {
        return generalizeFailureResult(trace, folderSignedByPublicKey, 'not-found');
      }

      const isValid = await isSignedValueValid(
        trace,
        metadata.value.provenance.origin,
        { name: metadata.value.name, path: item.path, type: 'file' },
        { verifyingKeys: folderSignedByPublicKey.value }
      );
      if (!isValid.ok) {
        return isValid;
      } else if (!isValid.value) {
        return makeSuccess(false);
      }

      store.localTrustMarks.markTrusted(item.path, 'provenance');
      return makeSuccess(true);
    }
  }
);
