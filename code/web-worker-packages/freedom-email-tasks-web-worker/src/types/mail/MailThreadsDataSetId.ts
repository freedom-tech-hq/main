import { makeIdInfo } from 'freedom-basic-data';

export const mailThreadsDataSetIdInfo = makeIdInfo('MAILTHREADSDS_');
export type MailThreadsDataSetId = typeof mailThreadsDataSetIdInfo.schema.valueType;
