import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { ConflictFreeDocumentEvaluator } from 'freedom-syncable-store-types';

export const MAIL_COLLECTION_DOCUMENT_PREFIX = 'MAILCOLLECTION';
export type MailCollectionDocumentPrefix = typeof MAIL_COLLECTION_DOCUMENT_PREFIX;

type DocEval = ConflictFreeDocumentEvaluator<MailCollectionDocumentPrefix, MailCollectionDocument>;

export class MailCollectionDocument extends ConflictFreeDocument<MailCollectionDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionDocumentPrefix> }) {
    super(MAIL_COLLECTION_DOCUMENT_PREFIX, snapshot);
  }

  public static newDocument = () => new MailCollectionDocument();

  // Overridden Public Methods

  public override clone(out?: MailCollectionDocument): MailCollectionDocument {
    return super.clone(out ?? new MailCollectionDocument()) as MailCollectionDocument;
  }

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new MailCollectionDocument(snapshot);

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

  public get mailIds() {
    return this.generic.getArrayField<MailId>('mailIds', mailIdInfo.schema);
  }
}
