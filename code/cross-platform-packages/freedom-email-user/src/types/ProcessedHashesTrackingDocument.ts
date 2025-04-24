import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { ConflictFreeDocumentEvaluator } from 'freedom-syncable-store-types';

export const PROCESSED_HASHES_TRACKING_DOCUMENT_PREFIX = 'PROCESSEDHASHESTRACKING';
export type ProcessedHashesTrackingDocumentPrefix = typeof PROCESSED_HASHES_TRACKING_DOCUMENT_PREFIX;

type DocEval = ConflictFreeDocumentEvaluator<ProcessedHashesTrackingDocumentPrefix, ProcessedHashesTrackingDocument>;

export class ProcessedHashesTrackingDocument extends ConflictFreeDocument<ProcessedHashesTrackingDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<ProcessedHashesTrackingDocumentPrefix> }) {
    super(PROCESSED_HASHES_TRACKING_DOCUMENT_PREFIX, snapshot);
  }

  public static newDocument = () => new ProcessedHashesTrackingDocument();

  // Overridden Public Methods

  public override clone(out?: ProcessedHashesTrackingDocument): ProcessedHashesTrackingDocument {
    return super.clone(out ?? new ProcessedHashesTrackingDocument()) as ProcessedHashesTrackingDocument;
  }

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new ProcessedHashesTrackingDocument(snapshot);

  // TODO: TEMP
  public static isSnapshotValid: DocEval['isSnapshotValid'] = makeAsyncResultFunc(
    [import.meta.filename, 'isSnapshotValid'],
    async (_trace, _args): PR<boolean> => makeSuccess(true)
  );

  // TODO: TEMP
  public static isDeltaValidForDocument: DocEval['isDeltaValidForDocument'] = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForDocument'],
    async (_trace, _doc, _args): PR<boolean> => makeSuccess(true)
  );

  // Field Access Methods

  /** The hashes of the collections that have already been processed */
  public get hashes() {
    return this.generic.getSetField<Sha256Hash>('hashes');
  }
}
