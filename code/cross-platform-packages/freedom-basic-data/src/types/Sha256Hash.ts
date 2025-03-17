import { makeIdInfo } from '../utils/id/makeIdInfo.ts';

export const sha256HashInfo = makeIdInfo('SHA256HASH_');
export type Sha256Hash = typeof sha256HashInfo.schema.valueType;
