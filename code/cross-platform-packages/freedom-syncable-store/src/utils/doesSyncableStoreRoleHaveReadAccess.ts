import type { SyncableStoreRole } from 'freedom-syncable-store-types';

const syncableStoreRolesWithReadAccess: Record<SyncableStoreRole, boolean> = {
  owner: true,
  admin: true,
  creator: true,
  editor: true,
  viewer: true,
  appender: false
};

export const doesSyncableStoreRoleHaveReadAccess = (role: SyncableStoreRole): boolean => syncableStoreRolesWithReadAccess[role];
