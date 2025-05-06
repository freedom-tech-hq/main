import type { DynamicSyncableItemName, SyncableId, SyncableItemMetadata } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';

export type LsFormatterArgs = { format?: LsFormatter };

export type LsFormatter = (args: {
  itemId: SyncableId;
  metadata: SyncableItemMetadata & LocalItemMetadata;
  dynamicName: DynamicSyncableItemName | undefined;
}) => string;
