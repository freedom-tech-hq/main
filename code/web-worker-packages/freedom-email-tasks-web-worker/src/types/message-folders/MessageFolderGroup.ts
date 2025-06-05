import type { MessageFolderGroupId } from './MessageFolderGroupId.ts';
import type { MessageFolderInfo } from './MessageFolderInfo.ts';

export interface MessageFolderGroup {
  id: MessageFolderGroupId;
  folderInfos: MessageFolderInfo[];
}
