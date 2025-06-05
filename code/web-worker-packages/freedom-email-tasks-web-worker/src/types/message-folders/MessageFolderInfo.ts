import type { MessageFolder } from 'freedom-email-api';

export interface MessageFolderInfo {
  folder: MessageFolder;
  unreadCount: number;
}
