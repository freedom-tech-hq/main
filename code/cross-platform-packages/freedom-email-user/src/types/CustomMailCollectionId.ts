import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const customMailCollectionIdInfo = makePrefixedUuidInfo('MAILCOLLECTION_');
export type CustomMailCollectionId = typeof customMailCollectionIdInfo.schema.valueType;
