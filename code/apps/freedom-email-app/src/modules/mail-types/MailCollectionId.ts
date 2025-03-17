import { makeIdInfo } from 'freedom-basic-data';

export const mailCollectionIdInfo = makeIdInfo('MAILCOLLECTION_');
export type MailCollectionId = typeof mailCollectionIdInfo.schema.valueType;
