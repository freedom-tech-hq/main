import { proxy } from 'comlink';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { log, makeUuid } from 'freedom-contexts';
import { ArrayDataSource } from 'freedom-data-source';
import { type MailId } from 'freedom-email-api';
import type { GetMailInfosForThreadPacket } from 'freedom-email-tasks-web-worker';
import type { MailMessagesDataSetId } from 'freedom-email-tasks-web-worker/lib/types/mail/MailMessagesDataSetId';
import { DEFAULT_PAGE_SIZE } from 'freedom-paginated-data';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MailListDataSourceItem, MailListDataSourceMailItem } from './MailListDataSourceItem.ts';
import type { MailListKey } from './MailListKey.ts';

export interface MailListDataSource extends ArrayDataSource<MailListDataSourceItem, MailListKey> {
  hasCollapsedItems: () => boolean;
  expandCollapsedItems: () => void;
  getMostRecentMailId: () => MailId | undefined;
  loadMore: () => void;
}

export const useMailListDataSource = (): MailListDataSource => {
  const selectedThreadId = useSelectedMailThreadId();
  const tasks = useTasks();

  const items = useMemo(() => new SortedArray<MailListDataSourceItem>(compareMailListDataSourceItemsAscendingTimeOrder), []);
  const collapsedItems = useRef<MailListDataSourceItem[]>([]);

  const dataSetId = useRef<MailMessagesDataSetId>(undefined);
  const numLoaded = useRef(0);

  const dataSource = useMemo(() => {
    // TODO: make a SortedArrayDataSource
    const out = new ArrayDataSource(items, {
      getKeyForItemAtIndex: (index) => items[index].id
    }) as MailListDataSource;
    out.setIsLoading('end');

    out.hasCollapsedItems = () => collapsedItems.current.length > 0;

    out.expandCollapsedItems = () => {
      if (collapsedItems.current.length === 0) {
        return; // Nothing to do
      }

      const indexOfCollapsedItem = items.findIndex((item) => item.type === 'collapsed');
      if (indexOfCollapsedItem < 0) {
        return; // Not ready
      }

      items.removeAtIndex(indexOfCollapsedItem);
      dataSource.itemsRemoved({ indices: [indexOfCollapsedItem] });

      const newIndices = items.addMultiple(...collapsedItems.current);
      collapsedItems.current.length = 0;
      dataSource.itemsAdded({ indices: newIndices });
    };

    out.getMostRecentMailId = () => {
      const lastMailItemIndex = items.findLastIndex((item) => item.type === 'mail');
      if (lastMailItemIndex < 0) {
        return undefined;
      }

      return (items.get(lastMailItemIndex) as MailListDataSourceMailItem).id;
    };

    out.loadMore = async () => {
      if (tasks === undefined) {
        return; // Not ready
      }

      await tasks.loadMoreMailIds(dataSetId.current!, numLoaded.current + DEFAULT_PAGE_SIZE);
    };

    return out;
  }, [items, tasks]);

  const mountId = useRef<Uuid | undefined>(undefined);
  useEffect(() => {
    mountId.current = makeUuid();
    return () => {
      mountId.current = undefined;
    };
  }, [tasks]);

  const connectionId = useRef(makeUuid());

  useBindingEffect(
    selectedThreadId,
    (selectedThreadId) => {
      if (tasks === undefined) {
        return;
      }

      connectionId.current = makeUuid();

      const myMountId = mountId.current;
      const myConnectionId = connectionId.current;
      const isConnected = proxy(() => mountId.current === myMountId && connectionId.current === myConnectionId);
      let isFirstMailAddedAfterClear = true;
      const onData = proxy((packet: GetMailInfosForThreadPacket) => {
        if (!isConnected()) {
          return;
        }

        switch (packet.type) {
          case 'mail-added': {
            numLoaded.current += packet.addedMailInfos.length;

            // TODO: support load more items

            const addedIndices: number[] = items.addMultiple(
              ...packet.addedMailInfos.map(
                (newMailInfo): MailListDataSourceMailItem => ({
                  type: 'mail',
                  id: newMailInfo.id,
                  timeMSec: newMailInfo.timeMSec,
                  dataSetId: dataSetId.current!
                })
              )
            );
            dataSource.itemsAdded({ indices: addedIndices });

            if (isFirstMailAddedAfterClear && addedIndices.length > 2) {
              const timeMSecOfFirstItemToRemove = (items.get(addedIndices[1]) as MailListDataSourceMailItem).timeMSec;
              const removeIndices = addedIndices.slice(1, addedIndices.length - 1);
              collapsedItems.current = removeIndices.map((index) => items.get(index));
              const removedIndices = items.removeAtIndices(...removeIndices);
              dataSource.itemsRemoved({ indices: removedIndices });

              const addedIndex = items.add({
                type: 'collapsed',
                id: 'collapsed',
                timeMSec: timeMSecOfFirstItemToRemove,
                count: addedIndices.length - 2
              });
              dataSource.itemsAdded({ indices: [addedIndex] });
            }

            isFirstMailAddedAfterClear = false;

            break;
          }
          case 'mail-removed':
            break; // TODO: handle
        }

        if (packet.estRemainingCount > 0) {
          const firstItem = items.get(0);
          if (firstItem.type !== 'load-more') {
            // Adding load more item if not present
            const addedIndex = items.add({
              type: 'load-more',
              id: 'load-more',
              count: packet.estRemainingCount
            });
            dataSource.itemsAdded({ indices: [addedIndex] });
          } else {
            // Updating load more if needed
            if (firstItem.count !== packet.estRemainingCount) {
              firstItem.count = packet.estRemainingCount;
              dataSource.itemsUpdated({ indices: [0] });
            }
          }
        } else {
          // Removing load more item if present since it's no longer needed
          if (items.get(0).type === 'load-more') {
            const removedIndex = items.removeAtIndex(0);
            dataSource.itemsRemoved({ indices: [removedIndex] });
          }
        }
      });
      inline(async () => {
        if (!isConnected()) {
          return;
        }

        if (selectedThreadId !== undefined && selectedThreadId !== 'initial') {
          let didClearOldData = false;
          const clearOldData = () => {
            if (didClearOldData || !isConnected()) {
              return;
            }
            didClearOldData = true;

            items.clear();
            dataSource.itemsCleared();
            dataSource.setIsLoading('end');

            isFirstMailAddedAfterClear = true;
          };

          setTimeout(clearOldData, ANIMATION_DURATION_MSEC);
          try {
            const data = await tasks.getMailInfosForThread(selectedThreadId, isConnected, onData);
            if (isConnected()) {
              clearOldData();

              if (!data.ok) {
                log().error?.(`Failed to load mail infos for thread with ID: ${selectedThreadId}`, data);
                return;
              }

              dataSetId.current = data.value.dataSetId;
              onData(data.value);
            }
          } finally {
            if (isConnected()) {
              dataSource.setIsLoading(false);
            }
          }
        } else {
          items.clear();
          dataSource.itemsCleared();
        }
      });
    },
    { triggerOnMount: 'first', deps: [dataSource, tasks] }
  );

  return dataSource;
};

// Helpers

const relativeOrderByType: Record<MailListDataSourceItem['type'], number> = {
  'load-more': 0,
  // mail and collapsed are intermixed
  mail: 1,
  collapsed: 1
};

const compareMailListDataSourceItemsAscendingTimeOrder = (a: MailListDataSourceItem, b: MailListDataSourceItem) => {
  const relativeTypeComparison = relativeOrderByType[a.type] - relativeOrderByType[b.type];
  if (relativeTypeComparison !== 0) {
    return relativeTypeComparison;
  }

  if (a.type === 'load-more' || b.type === 'load-more') {
    return 0; // There should only ever be at most one load-more at a time
  }

  return a.timeMSec - b.timeMSec;
};
