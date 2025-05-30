import { makePrefixedTimeIdInfo } from 'freedom-basic-data';

export const mailAttachmentIdInfo = makePrefixedTimeIdInfo('MAILATTACHMENT_');
export type MailAttachmentId = typeof mailAttachmentIdInfo.schema.valueType;
