import { makeIdInfo } from 'freedom-basic-data';

export const pageTokenInfo = makeIdInfo('PAGETOKEN_');
export type PageToken = typeof pageTokenInfo.schema.valueType;
