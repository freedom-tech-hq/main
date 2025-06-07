import type { MessageFolderInfo } from 'freedom-email-tasks-web-worker';

export type MessageFoldersListDataSourceItem = MessageFoldersListFolderDataSourceItem;

export interface MessageFoldersListFolderDataSourceItem extends MessageFolderInfo {
  type: 'folder';
}
