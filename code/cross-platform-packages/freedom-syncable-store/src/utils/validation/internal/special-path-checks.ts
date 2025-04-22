import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableIdParts, extractSyncableItemTypeFromId } from 'freedom-sync-types';
import { ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID, STORE_CHANGES_BUNDLE_ID } from 'freedom-syncable-store-types';

export const isSpecialAutomaticallyTrustedPath = (path: SyncablePath): boolean => {
  // Folders always have access control and store changes bundles inside them, so we can automatically trust that they should exist
  if (isAccessControlDocumentPath(path) || isStoreChangesDocumentPath(path)) {
    return true;
  }

  // Access control document bundles always have snapshots and deltas bundles inside them, so we can automatically trust that they should
  // exist
  if (isAccessControlDocumentSnapshotsBundlePath(path) || isAccessControlDocumentDeltasBundlePath(path)) {
    return true;
  }

  return false;
};

export const isAccessControlDocumentPath = (path: SyncablePath): boolean =>
  path.ids.length > 0 &&
  path.lastId === ACCESS_CONTROL_BUNDLE_ID &&
  extractSyncableItemTypeFromId(path.lastId) === 'bundle' &&
  // Root folder or explicit folder
  (path.ids.length === 1 || extractSyncableItemTypeFromId(path.ids[path.ids.length - 2]) === 'folder');

export const isAccessControlDocumentSnapshotsBundlePath = (path: SyncablePath): boolean =>
  path.ids.length > 1 &&
  path.lastId === SNAPSHOTS_BUNDLE_ID({ encrypted: false }) &&
  extractSyncableItemTypeFromId(path.lastId) === 'bundle' &&
  isAccessControlDocumentPath(path.parentPath!);

export const isAccessControlDocumentDeltasBundlePath = (path: SyncablePath): boolean =>
  path.ids.length > 1 && isDeltasBundleId(path.lastId!) && isAccessControlDocumentPath(path.parentPath!);

export const isAccessControlDocumentSnapshotFilePath = (path: SyncablePath): boolean =>
  path.ids.length > 1 &&
  extractSyncableItemTypeFromId(path.lastId!) === 'file' &&
  isAccessControlDocumentSnapshotsBundlePath(path.parentPath!);

export const isStoreChangesDocumentPath = (path: SyncablePath): boolean =>
  path.ids.length > 0 &&
  path.lastId === STORE_CHANGES_BUNDLE_ID &&
  extractSyncableItemTypeFromId(path.lastId) === 'bundle' &&
  // Root folder or explicit folder
  (path.ids.length === 1 || extractSyncableItemTypeFromId(path.ids[path.ids.length - 2]) === 'folder');

// Helpers

const isDeltasBundleId = (id: SyncableId) => {
  const idParts = extractSyncableIdParts(id);
  return idParts.type === 'bundle' && idParts.unmarkedId.endsWith('-deltas');
};
