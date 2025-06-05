import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { DataSource } from 'freedom-data-source';
import { ArrayDataSource } from 'freedom-data-source';
import { mailIdInfo } from 'freedom-email-api';
import type { GetMailThreadIdsForMessageFolderPacket } from 'freedom-email-tasks-web-worker/lib/tasks/mail/getMailThreadIdsForMessageFolder';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';

export const useMailCollectionDataSource = (): DataSource<MailThreadsListThreadDataSourceItem, MailThreadsListKey> => {
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
      const onData = proxy((packet: Result<GetMailThreadIdsForMessageFolderPacket>) => {
        if (!isConnected()) {
          return;
        }

        if (!packet.ok) {
          console.error('Something went wrong', packet.value);
          return;
        }

        switch (packet.value.type) {
          case 'threads-added': {
            const indices = items.addMultiple(
              ...packet.value.addedThreadIds.map(
                (threadId): MailThreadsListThreadDataSourceItem => ({
                  type: 'mail-thread',
                  id: threadId,
                  timeMSec: mailIdInfo.is(threadId) ? mailIdInfo.extractTimeMSec(threadId) : 0
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
            onData(data);
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
