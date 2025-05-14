import type { Sha256Hash } from 'freedom-basic-data';
import type { StructHashes, SyncableId } from 'freedom-sync-types';

export const insertIntoStructHashesWithRelativeIds = (
  relativeIds: SyncableId[],
  relativeIdsOffset: number,
  hash: Sha256Hash,
  outHashes: StructHashes
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

  insertIntoStructHashesWithRelativeIds(relativeIds, relativeIdsOffset + 1, hash, outHashes.contents[id]);
};
