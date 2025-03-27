import { makeStringSubtypeArray, schema } from 'yaschema';

export const syncableItemTypes = makeStringSubtypeArray('folder', 'file', 'bundle');
export const syncableItemTypeSchema = schema.string(...syncableItemTypes);
export type SyncableItemType = (typeof syncableItemTypes)[0];
