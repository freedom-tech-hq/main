import type { PRFunc } from 'freedom-async';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { SyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { SyncableStore } from './immutable/SyncableStore.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';

export interface IsConflictFreeDocumentSnapshotValidArgs<PrefixT extends string> {
  store: SyncableStore;
  path: SyncablePath;
  validatedProvenance: SyncableProvenance;
  originRole: SyncableStoreRole;
  snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> };
}

export type IsConflictFreeDocumentSnapshotValidFunc<PrefixT extends string> = PRFunc<
  boolean,
  never,
  [IsConflictFreeDocumentSnapshotValidArgs<PrefixT>]
>;
