import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DynamicSyncableId, SyncableId, SyncablePath } from 'freedom-sync-types';

export type GenerateNewSyncableItemIdFunc = PRFunc<
  SyncableId,
  never,
  [{ id: DynamicSyncableId; parentPath: SyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }]
>;
