import type { ResolvedSyncableIdSettings, SyncableId, UnmarkedSyncableId } from '../types/SyncableId.ts';
import { abbreviatedSyncableItemTypes, syncableItemType } from '../types/SyncableItemType.ts';

export const extractSyncableIdParts = (id: SyncableId): ResolvedSyncableIdSettings & { unmarkedId: UnmarkedSyncableId } => {
  const encrypted = id[1] === 'y';

  const typeMarker = abbreviatedSyncableItemTypes.checked(id[3]);
  /* node:coverage disable */
  if (typeMarker === undefined) {
    throw new Error(`Expected type marker to be one of: ${abbreviatedSyncableItemTypes.join(', ')}`);
  }
  /* node:coverage enable */
  const type = syncableItemType[typeMarker];

  const unmarkedId = id.slice(4) as UnmarkedSyncableId;

  return { encrypted, type, unmarkedId };
};
