import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import { makeUuid, type Trace } from 'freedom-contexts';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { OldSyncablePath } from 'freedom-sync-types';
import { timeName } from 'freedom-sync-types';

import { makeDeltasBundleId } from '../../consts/special-file-ids.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import { createStringFileAtPath } from '../create/createStringFileAtPath.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import type { GetConflictFreeDocumentFromBundleAtPathArgs } from './getConflictFreeDocumentFromBundleAtPath.ts';
import { getConflictFreeDocumentFromBundleAtPath } from './getConflictFreeDocumentFromBundleAtPath.ts';

export type GetMutableConflictFreeDocumentFromBundleAtPathArgs<
  PrefixT extends string,
  DocumentT extends ConflictFreeDocument<PrefixT>
> = GetConflictFreeDocumentFromBundleAtPathArgs<PrefixT, DocumentT>;

export const getMutableConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    path: OldSyncablePath,
    { newDocument, isSnapshotValid, isDeltaValidForDocument }: GetMutableConflictFreeDocumentFromBundleAtPathArgs<PrefixT, DocumentT>
  ): PR<SaveableDocument<DocumentT>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const document = await getConflictFreeDocumentFromBundleAtPath(trace, store, path, {
      newDocument,
      isSnapshotValid,
      isDeltaValidForDocument
    });
    if (!document.ok) {
      return document;
    }

    return makeSuccess({
      document: document.value,
      save: makeAsyncResultFunc([import.meta.filename, 'save'], async (trace): PR<undefined, 'conflict'> => {
        if (document.value.snapshotId === undefined) {
          return makeFailure(new NotFoundError(trace, { message: 'No snapshot ID is set' }));
        }

        const deltasPath = path.append(makeDeltasBundleId(document.value.snapshotId));
        const deltas = await getBundleAtPath(trace, store, deltasPath);
        if (!deltas.ok) {
          return generalizeFailureResult(trace, deltas, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
        }

        const encodedDelta = document.value.encodeDelta();

        const deltaId = await deltas.value.generateNewSyncableItemId(trace, {
          id: timeName(makeUuid()),
          parentPath: deltasPath,
          getSha256ForItemProvenance: (trace) => generateSha256HashFromString(trace, encodedDelta)
        });
        if (!deltaId.ok) {
          return deltaId;
        }

        const savedDelta = await createStringFileAtPath(trace, store, deltasPath, deltaId.value, encodedDelta);
        /* node:coverage disable */
        if (!savedDelta.ok) {
          // Conflicts shouldn't happen since we're using a UUID for the delta ID
          return generalizeFailureResult(trace, savedDelta, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */

        return makeSuccess(undefined);
      })
    });
  }
);
