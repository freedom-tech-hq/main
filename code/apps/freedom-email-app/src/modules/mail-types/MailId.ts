import { makeIdInfo } from 'freedom-basic-data';

export const mailIdInfo = makeIdInfo('MAIL_');
export type MailId = typeof mailIdInfo.schema.valueType;
