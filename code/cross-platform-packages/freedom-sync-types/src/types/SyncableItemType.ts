import { makeStringSubtypeArray, schema } from 'yaschema';

export const syncableItemTypes = makeStringSubtypeArray('folder', 'flatFile', 'bundleFile');
export const syncableItemTypeSchema = schema.string(...syncableItemTypes);
export type SyncableItemType = (typeof syncableItemTypes)[0];
