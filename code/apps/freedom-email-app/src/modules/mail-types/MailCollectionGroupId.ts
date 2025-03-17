import { makeIdInfo } from 'freedom-basic-data';

export const mailCollectionGroupIdInfo = makeIdInfo('MAILCOLLECTIONGROUP_');
export type MailCollectionGroupId = typeof mailCollectionGroupIdInfo.schema.valueType;
