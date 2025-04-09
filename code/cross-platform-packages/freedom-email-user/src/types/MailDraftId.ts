import { makePrefixedUuidInfo } from 'freedom-basic-data';

export const mailDraftIdInfo = makePrefixedUuidInfo('MAILDRAFT_');
export type MailDraftId = typeof mailDraftIdInfo.schema.valueType;
