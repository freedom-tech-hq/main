import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline, log } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import { mailIdInfo } from 'freedom-email-sync';
import type { GetMailForThreadPacket } from 'freedom-email-tasks-web-worker';
import type { MailLikeId } from 'freedom-email-user';
import { mailDraftIdInfo } from 'freedom-email-user';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { useTasks } from '../../../contexts/tasks.tsx';
import { ArrayDataSource } from '../../../types/ArrayDataSource.ts';
import type { DataSource } from '../../../types/DataSource.ts';
import { ANIMATION_DURATION_MSEC } from '../../virtual-list/consts/animation.ts';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export const useMailThreadDataSource = (): DataSource<MailThreadDataSourceItem, MailLikeId> => {
  const selectedThreadId = useSelectedMailThreadId();
  const tasks = useTasks();

  const items = useRef<MailThreadDataSourceItem[]>([]);

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

  useBindingEffect(
    selectedThreadId,
    (selectedThreadId, selectedThreadIdBinding) => {
      if (!tasks) {
        return;
      }

      const myMountId = mountId.current;
      const isConnected = proxy(() => mountId.current === myMountId && selectedThreadIdBinding.get() === selectedThreadId);
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

            dataSource.itemsAdded({ indices: addedIndices });

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

        if (selectedThreadId !== undefined) {
          dataSource.setIsLoading('end');

          let didClearOldData = false;
          const clearOldData = () => {
            if (didClearOldData || !isConnected()) {
              return;
            }
            didClearOldData = true;

            items.current.length = 0;
            dataSource.itemsCleared();
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
