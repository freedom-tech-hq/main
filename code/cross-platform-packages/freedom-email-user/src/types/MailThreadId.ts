import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const mailThreadIdInfo = makePrefixedUuidInfo('MAILTHREAD_');
export type MailThreadId = typeof mailThreadIdInfo.schema.valueType;
