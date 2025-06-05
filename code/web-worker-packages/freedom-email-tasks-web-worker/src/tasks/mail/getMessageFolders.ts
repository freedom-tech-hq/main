import type { PR, Result, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, sleep } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import type { MessageFolder } from 'freedom-email-api';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import type { MessageFolderGroup } from '../../types/message-folders/MessageFolderGroup.ts';
import { type MessageFolderGroupId, messageFolderGroupIdInfo } from '../../types/message-folders/MessageFolderGroupId.ts';
import type { MessageFolderInfo } from '../../types/message-folders/MessageFolderInfo.ts';
import { isDemoMode } from '../config/demo-mode.ts';

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

export const getMessageFolders = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMessageFoldersPacket>) => TypeOrPromisedType<void>
  ): PR<GetMessageFolderGroupsAddedPacket> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'groups-added' as const, addedGroups: [] });
    }

    // TODO: get real unread counts
    // TODO: handle custom collections (labels)
    const folderInfos: MessageFolderInfo[] = [
      { folder: 'inbox', unreadCount: 0 },
      { folder: 'sent', unreadCount: 0 },
      { folder: 'drafts', unreadCount: 0 },
      { folder: 'outbox', unreadCount: 0 }
    ];

    // TODO: put custom collections into a separate group
    const groups: MessageFolderGroup[] = [];
    groups.push({ id: messageFolderGroupIdInfo.make('default'), folderInfos });

    return makeSuccess({ type: 'groups-added' as const, addedGroups: groups });
  }
);

// Helpers

let makeDemoModeResult: () => Promise<SuccessResult<GetMessageFolderGroupsAddedPacket>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  const folderInfos: MessageFolderInfo[] = [
    { folder: 'inbox', unreadCount: Math.floor(Math.random() * 10) },
    { folder: 'sent', unreadCount: 0 },
    { folder: 'drafts', unreadCount: 0 },
    { folder: 'outbox', unreadCount: 0 }
  ];

  const groups: MessageFolderGroup[] = [];
  groups.push({ id: messageFolderGroupIdInfo.make('default'), folderInfos });

  return makeSuccess({ type: 'groups-added', addedGroups: groups });
};
