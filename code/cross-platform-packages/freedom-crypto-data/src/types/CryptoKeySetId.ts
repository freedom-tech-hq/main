import { makeIdInfo } from 'freedom-basic-data';

export const cryptoKeySetIdInfo = makeIdInfo('CRYPTOKEYSET_');
export type CryptoKeySetId = typeof cryptoKeySetIdInfo.schema.valueType;
