import { makeStringSubtypeArray, schema } from 'yaschema';

export const syncableItemTypes = makeStringSubtypeArray('folder', 'file', 'bundle');
export const syncableItemTypeSchema = schema.string(...syncableItemTypes);
export type SyncableItemType = (typeof syncableItemTypes)[0];

export const abbreviatedSyncableItemTypes = makeStringSubtypeArray('F', 'f', 'b');
export const abbreviatedSyncableItemTypeSchema = schema.string(...abbreviatedSyncableItemTypes);
export type AbbreviatedSyncableItemType = (typeof abbreviatedSyncableItemTypes)[0];

export const abbreviatedSyncableItemType: Record<SyncableItemType, AbbreviatedSyncableItemType> = {
  bundle: 'b',
  file: 'f',
  folder: 'F'
};
export const syncableItemType: Record<AbbreviatedSyncableItemType, SyncableItemType> = {
  b: 'bundle',
  f: 'file',
  F: 'folder'
};

export const folderLikeSyncableItemTypes = syncableItemTypes.exclude('file');
