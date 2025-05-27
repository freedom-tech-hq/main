import type { SyncableId } from 'freedom-sync-types';

export function restoreNamePartFromSafe(namePart: string): SyncableId {
  // Hope this is temporary logic, and we will simply make SyncableIds URL and FS safe. See getGsPathFromSyncablePath()
  return namePart.replaceAll('`', '/') as SyncableId;
}
