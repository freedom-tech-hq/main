import { proxy } from 'comlink';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { log, makeUuid } from 'freedom-contexts';
import type { DataSource } from 'freedom-data-source';
import { ArrayDataSource } from 'freedom-data-source';
import { mailIdInfo } from 'freedom-email-api';
import type { GetMailThreadIdsForMessageFolderPacket, MailThreadsDataSetId } from 'freedom-email-tasks-web-worker';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';
import type { Binding } from 'react-bindings';
import { useBindingEffect } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';

export const useMailThreadsListDataSource = ({
  estThreadCount
}: {
  estThreadCount: Binding<number>;
}): DataSource<MailThreadsListThreadDataSourceItem, MailThreadsListKey> => {
  const selectedMessageFolder = useSelectedMessageFolder();
  const tasks = useTasks();

  const items = useMemo(
    () => new SortedArray<MailThreadsListThreadDataSourceItem>((a, b) => compareMailCollectionDataSourceItemDescendingTimeOrder(a, b)),
    []
  );

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items, {
      getKeyForItemAtIndex: (index) => items[index].id
    });
    out.setIsLoading('end');
    return out;
  }, [items]);

  const mountId = useRef<Uuid | undefined>(undefined);
  useEffect(() => {
    mountId.current = makeUuid();
    return () => {
      mountId.current = undefined;
    };
  }, [tasks]);

  useBindingEffect(
    selectedMessageFolder,
    (selectedMessageFolder, selectedCollectionBinding) => {
      if (tasks === undefined) {
        return;
      }

      const myMountId = mountId.current;
      const isConnected = proxy(() => mountId.current === myMountId && selectedCollectionBinding.get() === selectedMessageFolder);
      let dataSetId: MailThreadsDataSetId;
      const onData = proxy((packet: GetMailThreadIdsForMessageFolderPacket) => {
        if (!isConnected()) {
          return;
        }

        estThreadCount.set(packet.estCount);

        switch (packet.type) {
          case 'threads-added': {
            const indices = items.addMultiple(
              ...packet.addedThreadIds.map(
                (threadId): MailThreadsListThreadDataSourceItem => ({
                  type: 'mail-thread',
                  id: threadId,
                  timeMSec: mailIdInfo.is(threadId) ? mailIdInfo.extractTimeMSec(threadId) : 0,
                  dataSetId
                })
              )
            );
            dataSource.itemsAdded({ indices });

            break;
          }
          case 'threads-removed':
            break; // TODO: handle
        }
      });
      inline(async () => {
        if (!isConnected()) {
          return;
        }

        if (selectedMessageFolder !== undefined) {
          dataSource.setIsLoading('end');

          let didClearOldData = false;
          const clearOldData = () => {
            if (didClearOldData || !isConnected()) {
              return;
            }
            didClearOldData = true;

            items.clear();
            dataSource.itemsCleared();
          };

          setTimeout(clearOldData, ANIMATION_DURATION_MSEC);
          try {
            const data = await tasks.getMailThreadIdsForMessageFolder(selectedMessageFolder, isConnected, onData);
            clearOldData();

            if (!data.ok) {
              // TODO: DataSource should probably handle errors
              log().error?.(`Failed to load mail thread IDs for folder: ${selectedMessageFolder}`, data.value);
              return;
            }

            dataSetId = data.value.dataSetId;
            onData(data.value);
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

const compareMailCollectionDataSourceItemDescendingTimeOrder = (
  a: MailThreadsListThreadDataSourceItem,
  b: MailThreadsListThreadDataSourceItem
) => {
  const comparedTimeMSecs = b.timeMSec - a.timeMSec;
  if (comparedTimeMSecs !== 0) {
    return comparedTimeMSecs;
  }

  return b.id.localeCompare(a.id);
};
