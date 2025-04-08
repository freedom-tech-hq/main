import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';

export const MAIL_COLLECTION_DOCUMENT_PREFIX = 'MAILCOLLECTION';
export type MailCollectionDocumentPrefix = typeof MAIL_COLLECTION_DOCUMENT_PREFIX;

export class MailCollectionDocument extends ConflictFreeDocument<MailCollectionDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionDocumentPrefix> }) {
    super(MAIL_COLLECTION_DOCUMENT_PREFIX, snapshot);
  }

  // Overridden Public Methods

  public override clone(out?: MailCollectionDocument): MailCollectionDocument {
    return super.clone(out ?? new MailCollectionDocument()) as MailCollectionDocument;
  }

  // Field Access Methods

  public get mailIds() {
    return this.generic.getArrayField<MailId>('mailIds', mailIdInfo.schema);
  }
}

export const makeNewMailCollectionDocument = () => {
  return new MailCollectionDocument();
};

export const makeMailCollectionDocumentFromSnapshot = (snapshot: {
  id: string;
  encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionDocumentPrefix>;
}) => new MailCollectionDocument(snapshot);
