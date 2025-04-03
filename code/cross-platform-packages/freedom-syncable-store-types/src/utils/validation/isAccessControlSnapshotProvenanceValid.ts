import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignedValue, isSignedValueValid } from 'freedom-crypto';

import type { SyncableFileAccessor } from '../../types/SyncableFileAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getFolderAtPath } from '../get/getFolderAtPath.ts';
import { getFolderPath } from '../get/getFolderPath.ts';

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

      return await isSignedValueValid(
        trace,
        metadata.value.provenance.origin,
        { name: metadata.value.name, path: item.path, type: 'file' },
        { verifyingKeys: store.creatorPublicKeys }
      );
    } else {
      // Otherwise, we'll check if this was signed by the folder creator using the keys from the folder's parent folder (since that's the
      // folder that would have granted access to create this folder)

      const folderPath = item.path.parentPath?.parentPath;
      if (folderPath === undefined) {
        return makeSuccess(false);
      }

      const folderParentPath = folderPath.parentPath;
      if (folderParentPath === undefined) {
        return makeSuccess(false);
      }

      const folder = await getFolderAtPath(trace, store, folderPath);
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

      const folderParentFolderPath = await getFolderPath(trace, store, folderParentPath);
      if (!folderParentFolderPath.ok) {
        return generalizeFailureResult(trace, folderParentFolderPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      const folderParentFolder = await getFolderAtPath(trace, store, folderParentFolderPath.value);
      if (!folderParentFolder.ok) {
        return generalizeFailureResult(trace, folderParentFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      const folderSignedByPublicKey = await folderParentFolder.value.getPublicKeysById(trace, folderSignedByKeyId.value);
      if (!folderSignedByPublicKey.ok) {
        return generalizeFailureResult(trace, folderSignedByPublicKey, 'not-found');
      }

      return await isSignedValueValid(
        trace,
        metadata.value.provenance.origin,
        { name: metadata.value.name, path: item.path, type: 'file' },
        { verifyingKeys: folderSignedByPublicKey.value }
      );
    }
  }
);
