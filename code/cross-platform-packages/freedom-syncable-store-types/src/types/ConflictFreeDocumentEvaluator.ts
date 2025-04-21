import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';

import type { IsConflictFreeDocumentSnapshotValidFunc } from './IsConflictFreeDocumentSnapshotValidFunc.ts';
import type { IsDeltaValidForConflictFreeDocumentFunc } from './IsDeltaValidForConflictFreeDocumentFunc.ts';

export interface ConflictFreeDocumentEvaluator<PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>> {
  loadDocument: (snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT;
  isSnapshotValid: IsConflictFreeDocumentSnapshotValidFunc<PrefixT>;
  isDeltaValidForDocument: IsDeltaValidForConflictFreeDocumentFunc<PrefixT, DocumentT>;
}
