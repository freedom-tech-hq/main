import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';

export const MAIL_COLLECTION_META_DOCUMENT_PREFIX = 'MAILCOLLECTIONMETA_';
export type MailCollectionMetaDocumentPrefix = typeof MAIL_COLLECTION_META_DOCUMENT_PREFIX;

export class MailCollectionMetaDocument extends ConflictFreeDocument<MailCollectionMetaDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionMetaDocumentPrefix> }) {
    super(MAIL_COLLECTION_META_DOCUMENT_PREFIX, snapshot);
  }

  // Overridden Public Methods

  public override async clone(out?: MailCollectionMetaDocument): Promise<MailCollectionMetaDocument> {
    return (await super.clone(out ?? new MailCollectionMetaDocument())) as MailCollectionMetaDocument;
  }

  // Field Access Methods

  public get name() {
    return this.generic.getRestrictedTextField('name', '');
  }
}

export const makeNewMailCollectionMetaDocument = ({ name }: { name: string }) => {
  const doc = new MailCollectionMetaDocument();
  doc.name.set(name);

  return doc;
};

export const makeMailCollectionMetaDocumentFromSnapshot = (snapshot: {
  id: string;
  encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionMetaDocumentPrefix>;
}) => new MailCollectionMetaDocument(snapshot);
