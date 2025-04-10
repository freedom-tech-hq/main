import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { attachmentInfoSchema, type MailId } from 'freedom-email-sync';
import { schema } from 'yaschema';

export const MAIL_DRAFT_DOCUMENT_PREFIX = 'MAILDRAFT';
export type MailDraftDocumentPrefix = typeof MAIL_DRAFT_DOCUMENT_PREFIX;

export class MailDraftDocument extends ConflictFreeDocument<MailDraftDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<MailDraftDocumentPrefix> }) {
    super(MAIL_DRAFT_DOCUMENT_PREFIX, snapshot);
  }

  // Overridden Public Methods

  public override clone(out?: MailDraftDocument): MailDraftDocument {
    return super.clone(out ?? new MailDraftDocument()) as MailDraftDocument;
  }

  // Field Access Methods

  public get inReplyToMailId() {
    return this.generic.getRestrictedTextField<MailId | ''>('inReplyToMailId', '');
  }

  public get to() {
    return this.generic.getArrayField('to', schema.string());
  }

  public get cc() {
    return this.generic.getArrayField('cc', schema.string());
  }

  public get bcc() {
    return this.generic.getArrayField('bcc', schema.string());
  }

  public get replyTo() {
    return this.generic.getTextField('replyTo');
  }

  public get subject() {
    return this.generic.getTextField('subject');
  }

  // TODO: add support for rich text
  public get body() {
    return this.generic.getTextField('body');
  }

  public get attachmentInfo() {
    return this.generic.getMapField('attachmentInfo', attachmentInfoSchema);
  }
}

export const makeNewMailDraftDocument = ({ inReplyToMailId, subject }: { inReplyToMailId?: MailId; subject?: string }) => {
  const doc = new MailDraftDocument();
  if (inReplyToMailId !== undefined) {
    doc.inReplyToMailId.set(inReplyToMailId);
  }
  if (subject !== undefined) {
    doc.subject.replace(0, subject);
  }
  return doc;
};

export const makeMailDraftDocumentFromSnapshot = (snapshot: {
  id: string;
  encoded: EncodedConflictFreeDocumentSnapshot<MailDraftDocumentPrefix>;
}) => new MailDraftDocument(snapshot);
