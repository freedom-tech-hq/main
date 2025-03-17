import { makeIdInfo } from 'freedom-basic-data';

export const mailThreadIdInfo = makeIdInfo('MAILTHREAD_');
export type MailThreadId = typeof mailThreadIdInfo.schema.valueType;
