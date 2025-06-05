import { makeIdInfo } from 'freedom-basic-data';

export const messageFolderGroupIdInfo = makeIdInfo('MESSAGEFOLDERGROUP_');
export type MessageFolderGroupId = typeof messageFolderGroupIdInfo.schema.valueType;
