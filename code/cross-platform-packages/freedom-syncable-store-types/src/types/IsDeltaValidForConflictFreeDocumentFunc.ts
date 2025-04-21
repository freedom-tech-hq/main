import type { PRFunc } from 'freedom-async';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta } from 'freedom-conflict-free-document-data';
import type { SyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { SyncableStore } from './SyncableStore.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';

export interface IsDeltaValidForConflictFreeDocumentArgs<PrefixT extends string> {
  store: SyncableStore;
  path: SyncablePath;
  validatedProvenance: SyncableProvenance;
  originRole: SyncableStoreRole;
  encodedDelta: EncodedConflictFreeDocumentDelta<PrefixT>;
}

export type IsDeltaValidForConflictFreeDocumentFunc<PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>> = PRFunc<
  boolean,
  never,
  [document: DocumentT, IsDeltaValidForConflictFreeDocumentArgs<PrefixT>]
>;
