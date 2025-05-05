import type { SyncableId } from 'freedom-sync-types';
import { extractUnmarkedSyncableId, unmarkedSyncablePlainIdInfo } from 'freedom-sync-types';

export const extractNumberFromPlainSyncableId = (syncableId: SyncableId): number | undefined => {
  const unmarkedId = extractUnmarkedSyncableId(syncableId);

  const unmarkedPlainId = unmarkedSyncablePlainIdInfo.checked(unmarkedId);
  if (unmarkedPlainId === undefined) {
    return undefined;
  }

  const plainIdWithoutPrefix = unmarkedSyncablePlainIdInfo.removePrefix(unmarkedPlainId);

  const numeric = Number(plainIdWithoutPrefix);
  return Number.isInteger(numeric) ? numeric : undefined;
};
