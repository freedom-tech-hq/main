import type { DynamicSyncableItemName, SyncableId, SyncableItemMetadata, SyncableItemType } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';

export type LsFormatterArgs = { formatter?: LsFormatter };

export type LsFormatter = (args: {
  itemType: SyncableItemType;
  itemId: SyncableId;
  metadata: SyncableItemMetadata & LocalItemMetadata;
  dynamicName: DynamicSyncableItemName | undefined;
}) => string;
