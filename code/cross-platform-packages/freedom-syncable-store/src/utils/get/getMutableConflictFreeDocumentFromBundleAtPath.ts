import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, Resolvable } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import { type Trace } from 'freedom-contexts';
import { doSoon } from 'freedom-do-soon';
import type { SyncablePath } from 'freedom-sync-types';
import { isSyncableItemEncrypted, timeId } from 'freedom-sync-types';
import type { ConflictFreeDocumentEvaluator, MutableSyncableStore, SaveableDocument } from 'freedom-syncable-store-types';
import { makeDeltasBundleId } from 'freedom-syncable-store-types';
import type { TrustedTime } from 'freedom-trusted-time-source';

import { SAVE_SOON_DEBOUNCE_INTERVAL_MSEC } from '../../internal/consts/timing.ts';
import { createStringFileAtPath } from '../create/createStringFileAtPath.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import type { GetConflictFreeDocumentFromBundleAtPathArgs } from './getConflictFreeDocumentFromBundleAtPath.ts';
import { getConflictFreeDocumentFromBundleAtPath } from './getConflictFreeDocumentFromBundleAtPath.ts';

export type GetMutableConflictFreeDocumentFromBundleAtPathArgs = GetConflictFreeDocumentFromBundleAtPathArgs;

export const getMutableConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    documentEvaluator: ConflictFreeDocumentEvaluator<PrefixT, DocumentT>,
    args?: GetMutableConflictFreeDocumentFromBundleAtPathArgs
  ): PR<SaveableDocument<DocumentT>, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const loaded = await getConflictFreeDocumentFromBundleAtPath(trace, store, path, documentEvaluator, args);
    if (!loaded.ok) {
      return loaded;
    }

    const document = loaded.value.document;

    const save = makeAsyncResultFunc(
      [import.meta.filename, 'save'],
      async (trace, { trustedTime }: { trustedTime?: TrustedTime } = {}): PR<undefined, 'conflict'> => {
        if (document.snapshotId === undefined) {
          return makeFailure(new NotFoundError(trace, { message: 'No snapshot ID is set' }));
        }

        // Deltas are encrypted if their parent bundle is encrypted
        const areDeltasEncrypted = isSyncableItemEncrypted(path.lastId!);
        const deltasPath = path.append(makeDeltasBundleId({ encrypted: areDeltasEncrypted }, document.snapshotId));
        const deltas = await getBundleAtPath(trace, store, deltasPath);
        if (!deltas.ok) {
          return generalizeFailureResult(trace, deltas, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
        }

        const encodedDelta = document.encodeDelta();

        const deltaId = timeId({ encrypted: areDeltasEncrypted, type: 'file' }, trustedTime?.timeId);

        const savedDelta = await createStringFileAtPath(trace, store, deltasPath.append(deltaId), {
          name: deltaId,
          value: encodedDelta,
          trustedTimeSignature: trustedTime?.trustedTimeSignature
        });
        /* node:coverage disable */
        if (!savedDelta.ok) {
          // Conflicts shouldn't happen since we're using a UUID for the delta ID
          return generalizeFailureResult(trace, savedDelta, ['not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */

        return makeSuccess(undefined);
      }
    );

    let lastSaveSoonTimeout: ReturnType<typeof setTimeout> | undefined;
    let lastSaveSoonResolvable: Resolvable<Result<undefined, 'conflict'>> | undefined;
    const saveSoon = makeAsyncResultFunc([import.meta.filename, 'saveSoon'], (trace): PR<undefined, 'conflict'> => {
      if (lastSaveSoonResolvable === undefined) {
        lastSaveSoonResolvable = new Resolvable();
      }

      const resolvable = lastSaveSoonResolvable;

      clearTimeout(lastSaveSoonTimeout);
      lastSaveSoonTimeout = setTimeout(async () => {
        lastSaveSoonTimeout = undefined;
        lastSaveSoonResolvable = undefined;

        doSoon(trace, async (trace) => {
          try {
            const saved = await save(trace);
            resolvable.resolve(saved);
          } catch (e) {
            resolvable.reject(e);
          }
        });
      }, SAVE_SOON_DEBOUNCE_INTERVAL_MSEC);

      return resolvable.promise;
    });

    return makeSuccess({
      ...loaded.value,
      save,
      saveSoon
    });
  }
);
