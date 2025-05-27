import type { StorageRootId, SyncableId, SyncablePath } from 'freedom-sync-types';

export type GsPathType = 'item' | 'scan-direct' | 'scan-recursive';

// TODO: Consider Brian's concerns for performance.
//  Extract this and replace other usages of encodeURIComponent for this purpose.
// Keep the purpose in the name of the function, not the implementation. I.e. not getBase64UrlFromBase64()
function makeSafeNamePart(block: SyncableId | StorageRootId): string {
  // TODO: Revise all the ids. Cannot convert to base64url because the ids are mixed
  //  for now: tick is one of the unlikely characters to meet in plain names. Using it
  return block.replaceAll('/', '`');
}

/**
 * Converts a SyncablePath to a Google Cloud Storage path
 *
 * @param prefix - The prefix to add to the path, if you want it to be a subdirectory add trailing slash explicitly
 * @param path - The SyncablePath to convert
 * @param type - The type of path to generate:
 *   - 'item': For a specific item path
 *   - 'scan-direct': For direct scanning of a directory
 *   - 'scan-recursive': For recursive scanning of a directory
 * @returns The Google Cloud Storage path as a string
 */
export const getGsPathFromSyncablePath = (prefix: string, path: SyncablePath, type: GsPathType): string => {
  const parts: string[] = [path.storageRootId, ...path.ids].map(makeSafeNamePart);

  // Handle path generation based on type
  switch (type) {
    case 'item':
      // Complete path with underscore before last component
      parts.splice(-1, 0, '_');
      break;
    case 'scan-direct':
      // Add underscore at the end for direct scanning
      parts.push('_');
      break;
    case 'scan-recursive':
      // No underscore injection for recursive scanning
      break;
  }

  return prefix + parts.join('/');
};
