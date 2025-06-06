import { makeIdInfo } from 'freedom-basic-data';

export const mailMessagesDataSetIdInfo = makeIdInfo('MAILMESSAGESDS_');
export type MailMessagesDataSetId = typeof mailMessagesDataSetIdInfo.schema.valueType;
