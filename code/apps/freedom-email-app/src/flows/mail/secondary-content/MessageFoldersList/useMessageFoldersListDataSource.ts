import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import type { Uuid } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { DataSource } from 'freedom-data-source';
import { ArrayDataSource } from 'freedom-data-source';
import type { MessageFolderGroup } from 'freedom-email-tasks-web-worker';
import type { GetMessageFoldersPacket } from 'freedom-email-tasks-web-worker/lib/tasks/mail/getMessageFolders';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';

import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MessageFoldersListFolderDataSourceItem } from './MessageFoldersListFolderDataSourceItem.ts';
import type { MessageFoldersListKey } from './MessageFoldersListKey.ts';

export const useMessageFoldersListDataSource = (): DataSource<MessageFoldersListFolderDataSourceItem, MessageFoldersListKey> => {
  const tasks = useTasks();

  const groups = useRef<MessageFolderGroup[]>([]);
  const items = useRef<MessageFoldersListFolderDataSourceItem[]>([]);

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items.current, {
      getKeyForItemAtIndex: (index) => items.current[index].folder
    });
    out.setIsLoading('end');
    return out;
  }, []);

  const mountId = useRef<Uuid | undefined>(undefined);
  useEffect(() => {
    mountId.current = makeUuid();
    return () => {
      mountId.current = undefined;
    };
  }, [tasks]);

  useEffect(() => {
    if (tasks === undefined) {
      return;
    }

    const myMountId = mountId.current;
    const isConnected = proxy(() => mountId.current === myMountId);
    const onData = proxy((packet: Result<GetMessageFoldersPacket>) => {
      if (!isConnected()) {
        return;
      }

      if (!packet.ok) {
        console.error('Something went wrong', packet.value);
        return;
      }

      switch (packet.value.type) {
        case 'groups-added': {
          groups.current.push(...packet.value.addedGroups);

          const addedIndices: number[] = [];
          for (const newGroup of packet.value.addedGroups) {
            for (const newFolderInfo of newGroup.folderInfos) {
              addedIndices.push(items.current.length);
              items.current.push({ ...newFolderInfo, type: 'folder' });
            }
          }

          dataSource.itemsAdded({ indices: addedIndices });

          break;
        }
        case 'groups-removed':
          break; // TODO: handle
        case 'folders-added': {
          for (const [groupId, folderInfos] of objectEntries(packet.value.addedFoldersByGroupId)) {
            const groupIndex = groups.current.findIndex((group) => group.id === groupId);
            if (groupIndex === -1) {
              console.error('Group not found', groupId);
              continue;
            }

            const group = groups.current[groupIndex];
            const groupEndItemIndex = groups.current.slice(0, groupIndex + 1).reduce((out, group, index) => {
              if (index > 0) {
                out += 1; // Separator
              }

              out += group.folderInfos.length;

              return out;
            }, 0);

            const addedIndices: number[] = [];
            let newCollectionIndex = 0;
            for (const newFolderInfo of folderInfos) {
              group.folderInfos.push(newFolderInfo);

              addedIndices.push(groupEndItemIndex + newCollectionIndex);
              items.current.splice(groupEndItemIndex + newCollectionIndex, 0, { ...newFolderInfo, type: 'folder' });
              newCollectionIndex += 1;
            }

            dataSource.itemsAdded({ indices: addedIndices });
          }
          break;
        }
        case 'folders-removed':
          break; // TODO: handle
      }
    });
    inline(async () => {
      if (!isConnected()) {
        return;
      }

      dataSource.setIsLoading('end');

      let didClearOldData = false;
      const clearOldData = () => {
        if (didClearOldData || !isConnected()) {
          return;
        }
        didClearOldData = true;

        groups.current.length = 0;
        items.current.length = 0;
        dataSource.itemsCleared();
      };

      setTimeout(clearOldData, ANIMATION_DURATION_MSEC);
      try {
        const data = await tasks.getMessageFolders(isConnected, onData);
        clearOldData();
        onData(data);
      } finally {
        if (isConnected()) {
          dataSource.setIsLoading(false);
        }
      }
    });
  }, [dataSource, tasks]);

  return dataSource;
};
