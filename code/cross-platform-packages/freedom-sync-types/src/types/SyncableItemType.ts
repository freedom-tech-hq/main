import { makeStringSubtypeArray } from 'yaschema';

export const syncableItemTypes = makeStringSubtypeArray('folder', 'flatFile', 'bundleFile');
export type SyncableItemType = (typeof syncableItemTypes)[0];
