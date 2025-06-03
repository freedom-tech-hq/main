import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { log, makeUuid } from 'freedom-contexts';
import { ArrayDataSource } from 'freedom-data-source';
import { mailIdInfo } from 'freedom-email-sync';
import type { GetMailForThreadPacket } from 'freedom-email-tasks-web-worker';
import type { Mail } from 'freedom-email-user';
import { mailDraftIdInfo } from 'freedom-email-user';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MailListDataSourceItem } from './MailListDataSourceItem.ts';
import type { MailListKey } from './MailListKey.ts';

export interface MailListDataSource extends ArrayDataSource<MailListDataSourceItem, MailListKey> {
  hasCollapsedItems: () => boolean;
  expandCollapsedItems: () => void;
  getMostRecentMail: () => Mail | undefined;
}

export const useMailListDataSource = (): MailListDataSource => {
  const selectedThreadId = useSelectedMailThreadId();
  const tasks = useTasks();

  const items = useRef<MailListDataSourceItem[]>([]);
  const collapsedItems = useRef<MailListDataSourceItem[]>([]);

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items.current, {
      getKeyForItemAtIndex: (index) => items.current[index].id
    }) as MailListDataSource;
    out.setIsLoading('end');

    out.hasCollapsedItems = () => collapsedItems.current.length > 0;

    out.expandCollapsedItems = () => {
      if (collapsedItems.current.length === 0) {
        return; // Nothing to do
      }

      const indexOfCollapsedItem = items.current.findIndex((item) => item.type === 'collapsed');
      if (indexOfCollapsedItem < 0) {
        return; // Not ready
      }

      const newIndices = collapsedItems.current.map((_item, index) => index + indexOfCollapsedItem);
      items.current.splice(indexOfCollapsedItem, 1, ...collapsedItems.current);
      collapsedItems.current.length = 0;
      dataSource.itemsRemoved({ indices: [indexOfCollapsedItem] });
      dataSource.itemsAdded({ indices: newIndices });
    };

    out.getMostRecentMail = () => items.current.findLast((item) => item.type === 'mail')?.mail;

    return out;
  }, []);

  const mountId = useRef<Uuid | undefined>(undefined);
  useEffect(() => {
    mountId.current = makeUuid();
    return () => {
      mountId.current = undefined;
    };
  }, [tasks]);

  useBindingEffect(
    selectedThreadId,
    (selectedThreadId, selectedThreadIdBinding) => {
      if (tasks === undefined) {
        return;
      }

      const myMountId = mountId.current;
      const isConnected = proxy(() => mountId.current === myMountId && selectedThreadIdBinding.get() === selectedThreadId);
      let isFirstMailAddedAfterClear = true;
      const onData = proxy((packet: Result<GetMailForThreadPacket>) => {
        if (!isConnected()) {
          return;
        }

        if (!packet.ok) {
          console.error('Something went wrong', packet.value);
          return;
        }

        switch (packet.value.type) {
          case 'mail-added': {
            const addedIndices: number[] = [];
            for (const newMail of packet.value.mail) {
              if (mailIdInfo.is(newMail.id)) {
                addedIndices.push(items.current.length);
                items.current.push({ type: 'mail', id: newMail.id, mail: newMail });
              } else if (mailDraftIdInfo.is(newMail.id)) {
                addedIndices.push(items.current.length);
                items.current.push({ type: 'draft', id: newMail.id, mail: newMail });
              }
            }

            if (isFirstMailAddedAfterClear && addedIndices.length > 2) {
              collapsedItems.current = items.current.splice(1, items.current.length - 2, {
                type: 'collapsed',
                id: 'collapsed',
                count: items.current.length - 2
              });
              dataSource.itemsAdded({ indices: [0, 1, 2] });
            } else {
              dataSource.itemsAdded({ indices: addedIndices });
            }

            isFirstMailAddedAfterClear = false;

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

        if (selectedThreadId !== undefined && selectedThreadId !== 'initial' && selectedThreadId !== 'new-mail') {
          dataSource.setIsLoading('end');

          let didClearOldData = false;
          const clearOldData = () => {
            if (didClearOldData || !isConnected()) {
              return;
            }
            didClearOldData = true;

            items.current.length = 0;
            dataSource.itemsCleared();

            isFirstMailAddedAfterClear = true;
          };

          setTimeout(clearOldData, ANIMATION_DURATION_MSEC);
          try {
            const data = await tasks.getMailForThread(selectedThreadId, isConnected, onData);
            if (!data.ok) {
              log().error?.('Failed to load email', data);
            }
            clearOldData();
            onData(data);
          } finally {
            if (isConnected()) {
              dataSource.setIsLoading(false);
            }
          }
        } else {
          items.current.length = 0;
          dataSource.itemsCleared();
        }
      });
    },
    { triggerOnMount: true, deps: [dataSource, tasks] }
  );

  return dataSource;
};
