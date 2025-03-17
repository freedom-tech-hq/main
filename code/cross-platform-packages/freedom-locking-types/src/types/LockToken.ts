import { makeIdInfo } from 'freedom-basic-data';

export const lockTokenInfo = makeIdInfo('LOCKTOKEN_');
export type LockToken = typeof lockTokenInfo.schema.valueType;
