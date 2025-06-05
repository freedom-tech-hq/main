import type { MessageFolderInfo } from 'freedom-email-tasks-web-worker';

export interface MessageFoldersListFolderDataSourceItem extends MessageFolderInfo {
  type: 'folder';
}
