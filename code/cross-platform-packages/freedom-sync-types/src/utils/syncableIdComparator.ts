import type { SyncableId } from '../types/SyncableId.ts';
import { extractSyncableItemTypeFromId } from './extractSyncableItemTypeFromId.ts';
import { extractUnmarkedSyncableId } from './extractUnmarkedSyncableId.ts';
import { getComparableValuePartsForUnmarkedSyncableId } from './internal/getComparableValuePartsForUnmarkedSyncableId.ts';

/**
 * Times are sorted in ascending order, other numeric values are in descending order, and strings are in ascending order.
 *
 * other numeric values &lt; strings &lt; times
 *
 * bundles &lt; files &lt; folders
 */
export const syncableIdComparator = (aParts: SyncableId | [SyncableId, any], bParts: SyncableId | [SyncableId, any]): number => {
  const aKey = Array.isArray(aParts) ? aParts[0] : aParts;
  const bKey = Array.isArray(bParts) ? bParts[0] : bParts;

  const aType = extractSyncableItemTypeFromId(aKey);
  const bType = extractSyncableItemTypeFromId(bKey);

  if (aType !== bType) {
    // b, f, F
    return aType.localeCompare(bType);
  }

  const aId = extractUnmarkedSyncableId(aKey);
  const bId = extractUnmarkedSyncableId(bKey);

  const a = getComparableValuePartsForUnmarkedSyncableId(aId);
  const b = getComparableValuePartsForUnmarkedSyncableId(bId);

  if (a.timeMSec !== b.timeMSec) {
    return a.timeMSec - b.timeMSec;
  } else if (a.numeric !== b.numeric) {
    return b.numeric - a.numeric;
  } else {
    return a.string.localeCompare(b.string);
  }
};
