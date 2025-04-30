import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import { mailIdInfo } from 'freedom-email-sync';
import type { GetMailThreadsForCollectionPacket } from 'freedom-email-tasks-web-worker';
import type { ThreadLikeId } from 'freedom-email-user';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { useTasks } from '../../../contexts/tasks.tsx';
import { ArrayDataSource } from '../../../types/ArrayDataSource.ts';
import type { DataSource } from '../../../types/DataSource.ts';
import { ANIMATION_DURATION_MSEC } from '../../virtual-list/consts/animation.ts';
import type { MailCollectionDataSourceItem } from '../types/MailCollectionDataSourceItem.ts';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export const useMailCollectionDataSource = (): DataSource<MailCollectionDataSourceItem, ThreadLikeId> => {
  const selectedCollectionId = useSelectedMailCollectionId();
  const tasks = useTasks();

  const items = useMemo(
    () => new SortedArray<MailCollectionDataSourceItem>((a, b) => compareMailCollectionDataSourceItemDescendingTimeOrder(a, b)),
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
    selectedCollectionId,
    (selectedCollectionId, selectedCollectionBinding) => {
      if (!tasks) {
        return;
      }

      const myMountId = mountId.current;
      const isConnected = proxy(() => mountId.current === myMountId && selectedCollectionBinding.get() === selectedCollectionId);
      const onData = proxy((packet: Result<GetMailThreadsForCollectionPacket>) => {
        if (!isConnected()) {
          return;
        }

        if (!packet.ok) {
          console.error('Something went wrong', packet.value);
          return;
        }

        switch (packet.value.type) {
          case 'mail-added': {
            dataSource.itemsAdded({
              indices: items.addMultiple(
                ...packet.value.threadIds.map(
                  (threadId): MailThreadDataSourceItem => ({
                    type: 'mail-thread',
                    id: threadId,
                    timeMSec: mailIdInfo.is(threadId) ? mailIdInfo.extractTimeMSec(threadId) : 0
                  })
                )
              )
            });

            break;
          }
          case 'mail-removed':
            break; // TODO: handle
        }
      });
      inline(async () => {
        if (!isConnected()) {
          return;
        }

        if (selectedCollectionId !== undefined) {
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
            const data = await tasks.getMailThreadsForCollection(selectedCollectionId, isConnected, onData);
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
    { triggerOnMount: true, deps: [dataSource, tasks] }
  );

  return dataSource;
};

// Helpers

const compareMailCollectionDataSourceItemDescendingTimeOrder = (a: MailCollectionDataSourceItem, b: MailCollectionDataSourceItem) => {
  const comparedTimeMSecs = b.timeMSec - a.timeMSec;
  if (comparedTimeMSecs !== 0) {
    return comparedTimeMSecs;
  }

  return b.id.localeCompare(a.id);
};
