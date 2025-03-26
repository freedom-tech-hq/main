import { makeStringSubtypeArray, schema } from 'yaschema';

export const syncableStoreRoles = makeStringSubtypeArray('appender', 'viewer', 'editor', 'admin', 'owner', 'creator');
export const syncableStoreRoleSchema = schema.string(...syncableStoreRoles);
export type SyncableStoreRole = typeof syncableStoreRoleSchema.valueType;

export const creatorAndAboveRoles = new Set<SyncableStoreRole>(['creator']);
export const ownerAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner']);
export const adminAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin']);
export const editorAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor']);
export const viewerAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor', 'viewer']);
export const appenderAndAboveRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor', 'viewer', 'appender']);

export const rolesWithReadAccess = viewerAndAboveRoles;
export const rolesWithWriteAccess = new Set<SyncableStoreRole>([...editorAndAboveRoles, 'appender']);

export const creatorAndBelowRoles = new Set<SyncableStoreRole>(['creator', 'owner', 'admin', 'editor', 'viewer', 'appender']);
export const ownerAndBelowRoles = new Set<SyncableStoreRole>(['owner', 'admin', 'editor', 'viewer', 'appender']);
export const adminAndBelowRoles = new Set<SyncableStoreRole>(['admin', 'editor', 'viewer', 'appender']);
export const editorAndBelowRoles = new Set<SyncableStoreRole>(['editor', 'viewer', 'appender']);
export const viewerAndBelowRoles = new Set<SyncableStoreRole>(['viewer', 'appender']);
export const appenderAndBelowRoles = new Set<SyncableStoreRole>(['appender']);

export const roleComparator = (a: SyncableStoreRole, b: SyncableStoreRole) => syncableStoreRoles.indexOf(a) - syncableStoreRoles.indexOf(b);
