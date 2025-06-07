import { proxy } from 'comlink';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { log, makeUuid } from 'freedom-contexts';
import { ArrayDataSource } from 'freedom-data-source';
import type { GetMailThreadInfosForMessageFolderPacket, MailThreadsDataSetId } from 'freedom-email-tasks-web-worker';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';
import type { Binding } from 'react-bindings';
import { useBindingEffect } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type {
  MailThreadsListDataSourceItem,
  MailThreadsListThreadDataSourceItem,
  MailThreadsListThreadPlaceholderDataSourceItem
} from './MailThreadsListDataSourceItem.ts';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';

export interface MailThreadsListDataSource extends ArrayDataSource<MailThreadsListDataSourceItem, MailThreadsListKey> {
  loadMore: (upToAtLeast: number) => void;
}

export const useMailThreadsListDataSource = ({ estThreadCount }: { estThreadCount: Binding<number> }): MailThreadsListDataSource => {
  const selectedMessageFolder = useSelectedMessageFolder();
  const tasks = useTasks();

  const items = useMemo(() => new SortedArray<MailThreadsListDataSourceItem>(compareMailThreadsListDataSourceItemsDescendingTimeOrder), []);

  const dataSetId = useRef<MailThreadsDataSetId>(undefined);

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items, {
      getKeyForItemAtIndex: (index) => {
        const item = items[index];
        switch (item.type) {
          case 'mail-thread':
            return item.id;
          case 'mail-thread-placeholder':
            return item.uid;
        }
      }
    }) as MailThreadsListDataSource;
    out.setIsLoading('end');

    out.loadMore = async (upToAtLeast: number) => {
      if (tasks === undefined) {
        return; // Not ready
      }

      await tasks.loadMoreMailThreadIds(dataSetId.current!, upToAtLeast);
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
    selectedMessageFolder,
    (selectedMessageFolder) => {
      if (tasks === undefined) {
        return;
      }

      connectionId.current = makeUuid();

      const myMountId = mountId.current;
      const myConnectionId = connectionId.current;
      const isConnected = proxy(() => mountId.current === myMountId && connectionId.current === myConnectionId);
      const onData = proxy((packet: GetMailThreadInfosForMessageFolderPacket) => {
        if (!isConnected()) {
          return;
        }

        estThreadCount.set(packet.estCount);

        switch (packet.type) {
          case 'threads-added': {
            const indices = items.addMultiple(
              ...packet.addedThreadInfos.map(
                (threadInfo): MailThreadsListThreadDataSourceItem => ({
                  type: 'mail-thread',
                  id: threadInfo.id,
                  timeMSec: threadInfo.timeMSec,
                  dataSetId: dataSetId.current!
                })
              )
            );
            dataSource.itemsAdded({ indices });

            break;
          }
          case 'threads-removed':
            break; // TODO: handle
        }

        const numMissingPlaceholders = estThreadCount.get() - items.length;
        if (numMissingPlaceholders > 0) {
          // Adding placeholders

          const indices = items.addMultiple(
            ...Array(numMissingPlaceholders)
              .fill(0)
              .map((): MailThreadsListThreadPlaceholderDataSourceItem => ({ type: 'mail-thread-placeholder', uid: makeUuid() }))
          );
          dataSource.itemsAdded({ indices });
        } else if (numMissingPlaceholders < 0) {
          // Removing placeholders

          const indices: number[] = [];
          loop: for (let index = items.length - 1; index >= 0; index -= 1) {
            if (indices.length >= -numMissingPlaceholders) {
              break;
            }

            const item = items[index];

            switch (item.type) {
              case 'mail-thread':
                break loop; // No more placeholders to remove
              case 'mail-thread-placeholder':
                indices.push(index);
            }
          }

          if (indices.length > 0) {
            items.removeAtIndices(...indices);
            dataSource.itemsRemoved({ indices });
          }
        }
      });
      inline(async () => {
        if (!isConnected()) {
          return;
        }

        if (selectedMessageFolder !== undefined) {
          let didClearOldData = false;
          const clearOldData = () => {
            if (didClearOldData || !isConnected()) {
              return;
            }
            didClearOldData = true;

            items.clear();
            dataSource.itemsCleared();
            dataSource.setIsLoading('end');
          };

          setTimeout(clearOldData, ANIMATION_DURATION_MSEC);
          try {
            const data = await tasks.getMailThreadInfosForMessageFolder(selectedMessageFolder, isConnected, onData);
            if (isConnected()) {
              clearOldData();

              if (!data.ok) {
                // TODO: DataSource should probably handle errors
                log().error?.(`Failed to load mail thread infos for folder: ${selectedMessageFolder}`, data.value);
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

const relativeOrderByType: Record<MailThreadsListDataSourceItem['type'], number> = {
  'mail-thread': 0,
  'mail-thread-placeholder': 1
};

const compareMailThreadsListDataSourceItemsDescendingTimeOrder = (a: MailThreadsListDataSourceItem, b: MailThreadsListDataSourceItem) => {
  const relativeTypeComparison = relativeOrderByType[a.type] - relativeOrderByType[b.type];
  if (relativeTypeComparison !== 0) {
    return relativeTypeComparison;
  }

  if (a.type === 'mail-thread' && b.type === 'mail-thread') {
    const comparedTimeMSecs = b.timeMSec - a.timeMSec;
    if (comparedTimeMSecs !== 0) {
      return comparedTimeMSecs;
    }

    return b.id.localeCompare(a.id);
  } else if (a.type === 'mail-thread-placeholder' && b.type === 'mail-thread-placeholder') {
    // We just want a consistent order
    return a.uid.localeCompare(b.uid);
  } else {
    // This is impossible, but we need to return something
    return 0;
  }
};
