import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { type Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';

import type { ConflictFreeDocumentEvaluator } from '../../types/ConflictFreeDocumentEvaluator.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import { createConflictFreeDocumentBundleAtPath } from '../create/createConflictFreeDocumentBundleAtPath.ts';
import type { GetConflictFreeDocumentFromBundleAtPathArgs } from '../get/getConflictFreeDocumentFromBundleAtPath.ts';
import { getMutableConflictFreeDocumentFromBundleAtPath } from '../get/getMutableConflictFreeDocumentFromBundleAtPath.ts';
import { getOrCreate } from './getOrCreate.ts';

export const getOrCreateConflictFreeDocumentBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    documentEvaluator: ConflictFreeDocumentEvaluator<PrefixT, DocumentT>,
    {
      newDocument,
      name,
      trustedTimeSignature,
      ...args
    }: GetConflictFreeDocumentFromBundleAtPathArgs &
      Partial<SyncableOriginOptions> & {
        newDocument: (snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT;
        name?: DynamicSyncableItemName;
      }
  ): PR<SaveableDocument<DocumentT>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getOrCreate<SaveableDocument<DocumentT>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>(trace, {
      get: (trace: Trace) =>
        getMutableConflictFreeDocumentFromBundleAtPath<PrefixT, DocumentT>(trace, store, path, documentEvaluator, args),
      create: (trace: Trace) =>
        createConflictFreeDocumentBundleAtPath<PrefixT, DocumentT>(trace, store, path, {
          ...args,
          name,
          newDocument,
          trustedTimeSignature
        })
    })
);
