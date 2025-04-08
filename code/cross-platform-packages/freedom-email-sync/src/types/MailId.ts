import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const mailIdInfo = makePrefixedUuidInfo('MAIL_');
export type MailId = typeof mailIdInfo.schema.valueType;
