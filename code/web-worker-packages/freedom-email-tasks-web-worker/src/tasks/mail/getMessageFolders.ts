import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, sleep } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import type { TypeOrPromisedType } from 'yaschema';

import type { GetMessageFolderGroupsAddedPacket, GetMessageFoldersPacket } from '../../types/mail/GetMessageFoldersPacket.ts';
import type { MessageFolderGroup } from '../../types/message-folders/MessageFolderGroup.ts';
import { messageFolderGroupIdInfo } from '../../types/message-folders/MessageFolderGroupId.ts';
import type { MessageFolderInfo } from '../../types/message-folders/MessageFolderInfo.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMessageFolders = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: GetMessageFoldersPacket) => TypeOrPromisedType<void>
  ): PR<GetMessageFolderGroupsAddedPacket> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    // const credential = useActiveCredential(trace).credential;

    const folderInfos: MessageFolderInfo[] = [
      { folder: 'inbox', unreadCount: 0 },
      { folder: 'sent', unreadCount: 0 },
      { folder: 'drafts', unreadCount: 0 },
      { folder: 'outbox', unreadCount: 0 }
    ];

    const groups: MessageFolderGroup[] = [];
    groups.push({ id: messageFolderGroupIdInfo.make('default'), folderInfos });

    // if (credential !== undefined) {
    // TODO: get real unread counts
    // TODO: handle custom collections (labels)
    // TODO: put custom collections into a separate group
    // }

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
