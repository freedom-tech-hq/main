import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DynamicSyncableId, OldSyncablePath, SyncableId } from 'freedom-sync-types';

export type GenerateNewSyncableItemIdFunc = PRFunc<
  SyncableId,
  never,
  [{ id: DynamicSyncableId; parentPath: OldSyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }]
>;
