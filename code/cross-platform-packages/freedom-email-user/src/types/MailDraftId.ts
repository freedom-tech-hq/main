import { makePrefixedTimeIdInfo } from 'freedom-basic-data';

export const mailDraftIdInfo = makePrefixedTimeIdInfo('MAILDRAFT_');
export type MailDraftId = typeof mailDraftIdInfo.schema.valueType;
