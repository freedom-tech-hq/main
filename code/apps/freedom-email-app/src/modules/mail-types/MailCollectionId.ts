import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const mailCollectionIdInfo = makePrefixedUuidInfo('MAILCOLLECTION_');
export type MailCollectionId = typeof mailCollectionIdInfo.schema.valueType;
