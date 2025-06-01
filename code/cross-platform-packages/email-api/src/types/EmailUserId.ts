import { makeIdInfo } from 'freedom-basic-data';

export const emailUserIdInfo = makeIdInfo('EMAILUSER_');
export type EmailUserId = typeof emailUserIdInfo.schema.valueType;
