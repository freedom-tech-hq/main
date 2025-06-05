import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { mailAttachmentInfoSchema, type MailId } from 'freedom-email-sync';
import type { ConflictFreeDocumentEvaluator } from 'freedom-syncable-store-types';
import { schema } from 'yaschema';

export const MAIL_DRAFT_DOCUMENT_PREFIX = 'MAILDRAFT';
export type MailDraftDocumentPrefix = typeof MAIL_DRAFT_DOCUMENT_PREFIX;

type DocEval = ConflictFreeDocumentEvaluator<MailDraftDocumentPrefix, MailDraftDocument>;

export class MailDraftDocument extends ConflictFreeDocument<MailDraftDocumentPrefix> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<MailDraftDocumentPrefix> }) {
    super(MAIL_DRAFT_DOCUMENT_PREFIX, snapshot);
  }

  public static newDocument = ({ inReplyToMailId, subject }: { inReplyToMailId?: MailId; subject?: string }) => {
    const doc = new MailDraftDocument();
    if (inReplyToMailId !== undefined) {
      doc.inReplyToMailId.set(inReplyToMailId);
    }
    if (subject !== undefined) {
      doc.subject.replace(0, subject);
    }
    return doc;
  };

  // Overridden Public Methods

  public override async clone(out?: MailDraftDocument): Promise<MailDraftDocument> {
    return (await super.clone(out ?? new MailDraftDocument())) as MailDraftDocument;
  }

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new MailDraftDocument(snapshot);

  // TODO: TEMP
  public static isSnapshotValid: DocEval['isSnapshotValid'] = makeAsyncResultFunc(
    [import.meta.filename, 'isSnapshotValid'],
    async (_trace, _args) => makeSuccess(true)
  );

  // TODO: TEMP
  public static isDeltaValidForDocument: DocEval['isDeltaValidForDocument'] = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForDocument'],
    async (_trace, _doc, _args) => makeSuccess(true)
  );

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

  public get attachmentInfos() {
    return this.generic.getArrayField('attachmentInfos', mailAttachmentInfoSchema);
  }
}
