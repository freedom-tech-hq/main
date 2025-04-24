import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { MailId } from 'freedom-email-sync';
import type { ConflictFreeDocumentEvaluator } from 'freedom-syncable-store-types';

export const PROCESSED_MAIL_IDS_TRACKING_DOCUMENT_PREFIX = 'PROCESSEDMAILIDSTRACKING';
export type ProcessedMailIdsTrackingDocumentPrefix = typeof PROCESSED_MAIL_IDS_TRACKING_DOCUMENT_PREFIX;

type DocEval = ConflictFreeDocumentEvaluator<ProcessedMailIdsTrackingDocumentPrefix, ProcessedMailIdsTrackingDocument>;

export class ProcessedMailIdsTrackingDocument extends ConflictFreeDocument<ProcessedMailIdsTrackingDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<ProcessedMailIdsTrackingDocumentPrefix> }) {
    super(PROCESSED_MAIL_IDS_TRACKING_DOCUMENT_PREFIX, snapshot);
  }

  public static newDocument = () => new ProcessedMailIdsTrackingDocument();

  // Overridden Public Methods

  public override clone(out?: ProcessedMailIdsTrackingDocument): ProcessedMailIdsTrackingDocument {
    return super.clone(out ?? new ProcessedMailIdsTrackingDocument()) as ProcessedMailIdsTrackingDocument;
  }

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new ProcessedMailIdsTrackingDocument(snapshot);

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

  /** The IDs of the mail items that have already been processed */
  public get mailIds() {
    return this.generic.getSetField<MailId>('mailIds');
  }
}
