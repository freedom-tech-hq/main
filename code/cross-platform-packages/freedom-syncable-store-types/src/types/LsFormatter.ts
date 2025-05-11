import type { DynamicSyncableItemName, LocalItemMetadata, SyncableId, SyncableItemMetadata, SyncableItemType } from 'freedom-sync-types';

export type LsFormatterArgs = { formatter?: LsFormatter };

export type LsFormatter = (args: {
  itemType: SyncableItemType;
  itemId: SyncableId;
  metadata: SyncableItemMetadata & LocalItemMetadata;
  dynamicName: DynamicSyncableItemName | undefined;
}) => string;
