import { makeIdInfo } from 'freedom-basic-data';

export const remoteIdInfo = makeIdInfo('REMOTE_');
export type RemoteId = typeof remoteIdInfo.schema.valueType;
