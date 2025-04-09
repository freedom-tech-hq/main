import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const mailCollectionGroupIdInfo = makePrefixedUuidInfo('MAILCOLLECTIONGROUP_');
export type MailCollectionGroupId = typeof mailCollectionGroupIdInfo.schema.valueType;
