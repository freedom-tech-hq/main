import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DynamicSyncableItemName, SyncableItemName, SyncablePath } from 'freedom-sync-types';

export type GenerateNewSyncableItemNameFunc = PRFunc<
  SyncableItemName,
  never,
  [{ name: DynamicSyncableItemName; path: SyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }]
>;
