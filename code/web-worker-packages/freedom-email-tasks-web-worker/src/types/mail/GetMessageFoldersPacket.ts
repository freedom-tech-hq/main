import type { MessageFolder } from 'freedom-email-api';

import type { MessageFolderGroup } from '../message-folders/MessageFolderGroup.ts';
import type { MessageFolderGroupId } from '../message-folders/MessageFolderGroupId.ts';
import type { MessageFolderInfo } from '../message-folders/MessageFolderInfo.ts';

export interface GetMessageFolderGroupsAddedPacket {
  readonly type: 'groups-added';
  readonly addedGroups: MessageFolderGroup[];
}

export interface GetMessageFoldersAddedPacket {
  readonly type: 'folders-added';
  readonly addedFoldersByGroupId: Record<MessageFolderGroupId, MessageFolderInfo[]>;
}

export interface GetMessageFoldersRemovedPacket {
  readonly type: 'folders-removed';
  readonly removedFoldersByGroupId: Record<MessageFolderGroupId, MessageFolder[]>;
}

export interface GetMessageFolderGroupsRemovedPacket {
  readonly type: 'groups-removed';
  readonly removedGroupIds: MessageFolderGroupId[];
}

export type GetMessageFoldersPacket =
  | GetMessageFolderGroupsAddedPacket
  | GetMessageFolderGroupsRemovedPacket
  | GetMessageFoldersAddedPacket
  | GetMessageFoldersRemovedPacket;
