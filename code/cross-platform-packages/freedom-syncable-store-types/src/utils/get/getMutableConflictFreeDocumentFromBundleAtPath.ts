import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import { makeUuid, type Trace } from 'freedom-contexts';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';
import { extractSyncableIdParts, timeName, uuidId } from 'freedom-sync-types';

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
    path: SyncablePath,
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

        // Deltas are encrypted if their parent bundle is encrypted
        const areDeltaEncrypted = extractSyncableIdParts(path.lastId!).encrypted;
        const deltasPath = path.append(makeDeltasBundleId({ encrypted: areDeltaEncrypted }, document.value.snapshotId));
        const deltas = await getBundleAtPath(trace, store, deltasPath);
        if (!deltas.ok) {
          return generalizeFailureResult(trace, deltas, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
        }

        const encodedDelta = document.value.encodeDelta();

        const deltaId = uuidId({ encrypted: areDeltaEncrypted, type: 'file' });
        const deltaName = await deltas.value.generateNewSyncableItemName(trace, {
          name: timeName(makeUuid()),
          path: deltasPath.append(deltaId),
          getSha256ForItemProvenance: (trace) => generateSha256HashFromString(trace, encodedDelta)
        });
        if (!deltaName.ok) {
          return deltaName;
        }

        const savedDelta = await createStringFileAtPath(trace, store, deltasPath.append(deltaId), {
          name: deltaName.value,
          value: encodedDelta
        });
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
