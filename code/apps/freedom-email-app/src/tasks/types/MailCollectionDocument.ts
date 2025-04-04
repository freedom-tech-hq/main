import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';

import type { MailCollectionType } from '../../modules/mail-types/MailCollectionType.ts';
import type { MailId } from '../../modules/mail-types/MailId.ts';
import { mailIdInfo } from '../../modules/mail-types/MailId.ts';

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

  public get name() {
    return this.generic.getRestrictedTextField('name', '');
  }

  public get mailIds() {
    return this.generic.getArrayField<MailId>('mailIds', mailIdInfo.schema);
  }

  public get collectionType() {
    return this.generic.getRestrictedTextField<MailCollectionType>('collectionType', 'inbox');
  }
}

export const makeNewMailCollectionDocument = ({ name, collectionType }: { name: string; collectionType: MailCollectionType }) => {
  const doc = new MailCollectionDocument();
  doc.name.set(name);
  doc.collectionType.set(collectionType);
  return doc;
};

export const makeMailCollectionDocumentFromSnapshot = (snapshot: {
  id: string;
  encoded: EncodedConflictFreeDocumentSnapshot<MailCollectionDocumentPrefix>;
}) => new MailCollectionDocument(snapshot);
