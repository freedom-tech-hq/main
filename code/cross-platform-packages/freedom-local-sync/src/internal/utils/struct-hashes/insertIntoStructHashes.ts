import type { Sha256Hash } from 'freedom-basic-data';
import type { StructHashes, SyncablePath } from 'freedom-sync-types';

import { insertIntoStructHashesWithRelativeIds } from './insertIntoStructHashesWithRelativeIds.ts';

export const insertIntoStructHashes = (outHashes: StructHashes, basePath: SyncablePath, itemPath: SyncablePath, hash: Sha256Hash) => {
  const relativeIds = itemPath.relativeTo(basePath);
  if (relativeIds !== undefined) {
    insertIntoStructHashesWithRelativeIds(outHashes, relativeIds, 0, hash);
  }
};
