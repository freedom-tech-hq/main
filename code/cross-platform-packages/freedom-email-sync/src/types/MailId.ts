import { makePrefixedTimeIdInfo } from 'freedom-basic-data';

export const mailIdInfo = makePrefixedTimeIdInfo('MAIL_');
export type MailId = typeof mailIdInfo.schema.valueType;
