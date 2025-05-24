import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import type { Uuid } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { DataSource } from 'freedom-data-source';
import { ArrayDataSource } from 'freedom-data-source';
import type { GetMailCollectionPacket } from 'freedom-email-tasks-web-worker';
import type { MailCollectionGroup } from 'freedom-email-user';
import { makeCollectionLikeIdForCollection } from 'freedom-email-user';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';

import { useTasks } from '../../../contexts/tasks.tsx';
import type { MailCollectionsListDataSourceItem } from '../types/MailCollectionsListDataSourceItem.ts';
import type { MailCollectionsListDataSourceKey } from '../types/MailCollectionsListDataSourceKey.ts';

export const useMailCollectionsListDataSource = (): DataSource<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey> => {
  const tasks = useTasks();

  const groups = useRef<MailCollectionGroup[]>([]);
  const items = useRef<MailCollectionsListDataSourceItem[]>([]);

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items.current, {
      getKeyForItemAtIndex: (index) => items.current[index].id
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
    const onData = proxy((packet: Result<GetMailCollectionPacket>) => {
      if (!isConnected()) {
        return;
      }

      if (!packet.ok) {
        console.error('Something went wrong', packet.value);
        return;
      }

      switch (packet.value.type) {
        case 'groups-added': {
          groups.current.push(...packet.value.groups);

          const addedIndices: number[] = [];
          for (const newGroup of packet.value.groups) {
            if (groups.current.indexOf(newGroup) !== 0) {
              addedIndices.push(items.current.length);
              items.current.push({ type: 'separator', id: `${newGroup.id}-separator` });
            }

            if (newGroup.title !== undefined) {
              addedIndices.push(items.current.length);
              items.current.push({ type: 'group-title', id: newGroup.id, title: newGroup.title });
            }

            for (const newCollection of newGroup.collections) {
              addedIndices.push(items.current.length);
              items.current.push({ type: 'collection', id: makeCollectionLikeIdForCollection(newCollection), collection: newCollection });
            }
          }

          dataSource.itemsAdded({ indices: addedIndices });

          break;
        }
        case 'groups-removed':
          break; // TODO: handle
        case 'collections-added': {
          for (const [groupId, collections] of objectEntries(packet.value.byGroupId)) {
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

              if (group.title !== undefined) {
                out += 1;
              }

              out += group.collections.length;

              return out;
            }, 0);

            const addedIndices: number[] = [];
            let newCollectionIndex = 0;
            for (const newCollection of collections) {
              group.collections.push(newCollection);

              addedIndices.push(groupEndItemIndex + newCollectionIndex);
              items.current.splice(groupEndItemIndex + newCollectionIndex, 0, {
                type: 'collection',
                id: makeCollectionLikeIdForCollection(newCollection),
                collection: newCollection
              });
              newCollectionIndex += 1;
            }

            dataSource.itemsAdded({ indices: addedIndices });
          }
          break;
        }
        case 'collections-removed':
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
        const data = await tasks.getMailCollections(isConnected, onData);
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
