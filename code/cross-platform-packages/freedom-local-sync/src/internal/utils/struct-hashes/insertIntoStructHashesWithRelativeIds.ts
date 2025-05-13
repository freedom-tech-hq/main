import type { Sha256Hash } from 'freedom-basic-data';
import type { StructHashes, SyncableId } from 'freedom-sync-types';

export const insertIntoStructHashesWithRelativeIds = (
  outHashes: StructHashes,
  relativeIds: SyncableId[],
  relativeIdsOffset: number,
  hash: Sha256Hash
) => {
  if (relativeIdsOffset === relativeIds.length) {
    outHashes.hash = hash;
    return;
  }

  const id = relativeIds[relativeIdsOffset];
  if (outHashes.contents === undefined) {
    outHashes.contents = {};
  }
  if (outHashes.contents[id] === undefined) {
    outHashes.contents[id] = {};
  }

  insertIntoStructHashesWithRelativeIds(outHashes.contents[id], relativeIds, relativeIdsOffset + 1, hash);
};
