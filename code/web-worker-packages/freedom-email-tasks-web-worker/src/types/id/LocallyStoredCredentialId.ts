import { makeIdInfo } from 'freedom-basic-data';

export const locallyStoredCredentialIdInfo = makeIdInfo('LOCALCRED_');
export type LocallyStoredCredentialId = typeof locallyStoredCredentialIdInfo.schema.valueType;
