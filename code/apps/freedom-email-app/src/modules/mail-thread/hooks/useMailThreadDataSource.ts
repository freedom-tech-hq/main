import { proxy } from 'comlink';
import type { Result } from 'freedom-async';
import { inline } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { useTasks } from '../../../contexts/tasks.tsx';
import type { GetMailForThreadPacket } from '../../../tasks/mail/getMailForThreadTask.ts';
import { ArrayDataSource } from '../../../types/ArrayDataSource.ts';
import type { DataSource } from '../../../types/DataSource.ts';
import type { MailId } from '../../mail-types/MailId.ts';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export const useMailThreadDataSource = (): DataSource<MailThreadDataSourceItem, MailId> => {
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
              addedIndices.push(items.current.length);
              items.current.push({ type: 'mail', id: newMail.id, mail: newMail });
            }

            dataSource.itemsAdded({ indices: addedIndices });

            break;
          }
          case 'mail-removed':
            break; // TODO: handle
        }
      });
      inline(async () => {
        items.current.length = 0;
        dataSource.itemsCleared();
        if (selectedThreadId !== undefined) {
          dataSource.setIsLoading('end');
          if (!isConnected()) {
            return;
          }

          try {
            onData(await tasks.getMailForThreadTask(makeTrace(import.meta.filename), selectedThreadId, isConnected, onData));
          } finally {
            if (isConnected()) {
              dataSource.setIsLoading(false);
            }
          }
        }
      });
    },
    { triggerOnMount: true, deps: [dataSource, tasks] }
  );

  return dataSource;
};
