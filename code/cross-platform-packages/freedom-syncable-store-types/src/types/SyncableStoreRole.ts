import { makeStringSubtypeArray, schema } from 'yaschema';

export const syncableStoreRoles = makeStringSubtypeArray('viewer', 'editor', 'admin', 'owner', 'creator');
export const syncableStoreRoleSchema = schema.string(...syncableStoreRoles);
export type SyncableStoreRole = typeof syncableStoreRoleSchema.valueType;

export const creatorAndAboveRoles = new Set<SyncableStoreRole>(['creator']);
export const ownerAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner']);
export const adminAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin']);
export const editorAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor']);
export const viewerAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor', 'viewer']);

export const creatorAndBelowRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor', 'viewer']);
export const ownerAndBelowRoles = new Set<SyncableStoreRole>(['owner', 'admin', 'editor', 'viewer']);
export const adminAndBelowRoles = new Set<SyncableStoreRole>(['admin', 'editor', 'viewer']);
export const editorAndBelowRoles = new Set<SyncableStoreRole>(['editor', 'viewer']);
export const viewerAndBelowRoles = new Set<SyncableStoreRole>(['viewer']);

export const roleComparator = (a: SyncableStoreRole, b: SyncableStoreRole) => syncableStoreRoles.indexOf(a) - syncableStoreRoles.indexOf(b);
