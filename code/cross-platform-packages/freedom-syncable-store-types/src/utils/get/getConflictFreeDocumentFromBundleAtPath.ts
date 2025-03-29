import type { PR, PRFunc } from 'freedom-async';
import {
  allResultsMappedSkipFailures,
  allResultsNamed,
  debugTopic,
  inline,
  makeAsyncResultFunc,
  makeFailure,
  makeSuccess
} from 'freedom-async';
import { Cast, objectEntries } from 'freedom-cast';
import { ForbiddenError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import {
  extractSyncableIdParts,
  type SyncableId,
  type SyncableItemName,
  type SyncablePath,
  type SyncableProvenance
} from 'freedom-sync-types';
import { once } from 'lodash-es';

import { makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../../types/SyncableStoreRole.ts';
import { getRoleForOriginWithPath } from '../validation/getRoleForOriginWithPath.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import { getProvenanceOfSyncableAtPath } from './getProvenanceOfSyncableAtPath.ts';
import { getStringFromFileAtPath } from './getStringFromFileAtPath.ts';

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

export interface GetConflictFreeDocumentFromBundleAtPathArgs<PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>> {
  newDocument: (snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT;
  isSnapshotValid: IsConflictFreeDocumentSnapshotValidFunc<PrefixT>;
  isDeltaValidForDocument: IsDeltaValidForConflictFreeDocumentFunc<PrefixT, DocumentT>;
}

export const getConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    { newDocument, isSnapshotValid, isDeltaValidForDocument }: GetConflictFreeDocumentFromBundleAtPathArgs<PrefixT, DocumentT>
  ): PR<DocumentT, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const docBundle = await getBundleAtPath(trace, store, path);
    /* node:coverage disable */
    if (!docBundle.ok) {
      return docBundle;
    }
    /* node:coverage enable */

    // Snapshots are encrypted if their parent bundle is encrypted
    const isSnapshotEncrypted = extractSyncableIdParts(path.lastId!).encrypted;
    const snapshotsPath = path.append(SNAPSHOTS_BUNDLE_ID({ encrypted: isSnapshotEncrypted }));
    const snapshots = await getBundleAtPath(trace, store, snapshotsPath);
    /* node:coverage disable */
    if (!snapshots.ok) {
      return snapshots;
    }
    /* node:coverage enable */

    const snapshotIds = await snapshots.value.getIds(trace, { type: 'file' });
    /* node:coverage disable */
    if (!snapshotIds.ok) {
      return snapshotIds;
    } else if (snapshotIds.value.length === 0) {
      /* node:coverage enable */
      return makeFailure(new NotFoundError(trace, { message: `No snapshots found for: ${path.toString()}`, errorCode: 'not-found' }));
    }

    const metadataById = await snapshots.value.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    const namesById = objectEntries(metadataById.value).reduce(
      (out, [id, metadata]) => {
        if (metadata === undefined) {
          return out;
        }

        out[id] = metadata.name;

        return out;
      },
      {} as Partial<Record<SyncableId, SyncableItemName>>
    );

    // TODO: should really try to load approved snapshots first and then not-yet-approved ones
    // Snapshot names are prefixed by ISO timestamps, so sorting them will give us the most recent one last
    snapshotIds.value.sort((a, b) => (namesById[a] ?? '').localeCompare(namesById[b] ?? ''));

    let snapshotIndex = snapshotIds.value.length - 1;
    while (snapshotIndex >= 0) {
      const snapshotId = snapshotIds.value[snapshotIndex];
      snapshotIndex -= 1;

      const snapshotPath = snapshotsPath.append(snapshotId);
      const encodedSnapshot = await getStringFromFileAtPath(trace, store, snapshotPath);
      /* node:coverage disable */
      if (!encodedSnapshot.ok) {
        return encodedSnapshot;
      }
      /* node:coverage enable */

      const snapshotProvenance = await getProvenanceOfSyncableAtPath(trace, store, snapshotPath);
      if (!snapshotProvenance.ok) {
        return snapshotProvenance;
      }

      const getOriginRole = once(() => getRoleForOriginWithPath(trace, store, { path, origin: snapshotProvenance.value.origin }));

      // For not-yet-accepted values, performing additional checks
      if (snapshotProvenance.value.acceptance === undefined) {
        const originRole = await getOriginRole();
        if (!originRole.ok) {
          return generalizeFailureResult(trace, originRole, 'not-found');
        } else if (originRole.value === undefined) {
          // This shouldn't happen
          return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
        }

        const snapshotValid = await isSnapshotValid(trace, {
          store,
          path: snapshotPath,
          validatedProvenance: snapshotProvenance.value,
          originRole: originRole.value,
          snapshot: { id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<PrefixT> }
        });
        if (!snapshotValid.ok) {
          return snapshotValid;
        } else if (!snapshotValid.value) {
          DEV: debugTopic('VALIDATION', (log) => log(`Snapshot invalid for ${snapshotPath.toString()}`));
          continue;
        }
      }

      const document = newDocument({ id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<PrefixT> });

      // Deltas are encrypted if their parent bundle is encrypted
      const areDeltaEncrypted = extractSyncableIdParts(path.lastId!).encrypted;
      const dynamicDeltasPath = path.append(makeDeltasBundleId({ encrypted: areDeltaEncrypted }, snapshotId));
      const deltas = await getBundleAtPath(trace, store, dynamicDeltasPath);
      /* node:coverage disable */
      if (!deltas.ok) {
        return deltas;
      }
      /* node:coverage enable */
      const deltasPath = deltas.value.path;

      const deltaIds = await deltas.value.getIds(trace, { type: 'file' });
      /* node:coverage disable */
      if (!deltaIds.ok) {
        return deltaIds;
      }
      /* node:coverage enable */

      const metadataById = await deltas.value.getMetadataById(trace);
      if (!metadataById.ok) {
        return metadataById;
      }

      const namesById = objectEntries(metadataById.value).reduce(
        (out, [id, metadata]) => {
          if (metadata === undefined) {
            return out;
          }

          out[id] = metadata.name;

          return out;
        },
        {} as Partial<Record<SyncableId, SyncableItemName>>
      );

      // TODO: should really try to load approved deltas first and then not-yet-approved ones
      // Delta names are prefixed by ISO timestamps, so sorting them will give us the most recent one last
      deltaIds.value.sort((a, b) => (namesById[a] ?? '').localeCompare(namesById[b] ?? ''));

      const encodedDeltasAndProvenances = await allResultsMappedSkipFailures(
        trace,
        deltaIds.value,
        {
          _errorCodeType: Cast<'format-error' | 'not-found' | 'untrusted'>(),
          skipErrorCodes: ['format-error', 'not-found', 'untrusted']
        },
        async (
          trace,
          deltaId
        ): PR<
          { deltaPath: SyncablePath; provenance: SyncableProvenance; encodedDelta: string },
          'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'
        > => {
          const deltaPath = deltasPath.append(deltaId);

          return await allResultsNamed(
            trace,
            { _errorCodeType: Cast<'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>() },
            {
              deltaPath: inline(async () => makeSuccess(deltaPath)),
              provenance: getProvenanceOfSyncableAtPath(trace, store, deltaPath),
              encodedDelta: getStringFromFileAtPath(trace, store, deltaPath)
            }
          );
        }
      );
      /* node:coverage disable */
      if (!encodedDeltasAndProvenances.ok) {
        return encodedDeltasAndProvenances;
      }
      /* node:coverage enable */

      for (const deltaAndProvenance of encodedDeltasAndProvenances.value) {
        if (deltaAndProvenance === undefined) {
          // Skipping deltas that were invalid due to 'format-error' | 'not-found' | 'untrusted'
          // Other, more general, errors would still stop processing above however
          continue;
        }

        const { deltaPath, provenance, encodedDelta } = deltaAndProvenance;

        // For not-yet-accepted values, performing additional checks
        if (provenance.acceptance === undefined) {
          const originRole = await getOriginRole();
          if (!originRole.ok) {
            return generalizeFailureResult(trace, originRole, 'not-found');
          } else if (originRole.value === undefined) {
            // This shouldn't happen
            return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
          }

          const deltaValid = await isDeltaValidForDocument(trace, document.clone() as DocumentT, {
            store,
            path: deltaPath,
            validatedProvenance: provenance,
            originRole: originRole.value,
            encodedDelta: encodedDelta as EncodedConflictFreeDocumentDelta<PrefixT>
          });
          if (!deltaValid.ok) {
            return deltaValid;
          } else if (!deltaValid.value) {
            DEV: debugTopic('VALIDATION', (log) => log(`Delta invalid for ${deltaPath.toString()}`));
            continue;
          }
        }

        document.applyDeltas([encodedDelta as EncodedConflictFreeDocumentDelta<PrefixT>]);
      }

      return makeSuccess(document);
    }

    return makeFailure(new NotFoundError(trace, { message: `No valid snapshots found for: ${path.toString()}`, errorCode: 'not-found' }));
  }
);
