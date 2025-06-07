import type { VirtualListKeyboardDelegate } from 'freedom-web-virtual-list';
import { useMemo } from 'react';

import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import type { MailThreadsListDataSource } from './useMailThreadsListDataSource.ts';

export const useMailThreadsListSelectionDelegate = (
  dataSource: MailThreadsListDataSource,
  {
    onArrowLeft,
    onArrowRight
  }: {
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  } = {}
) => {
  const selectedThreadId = useSelectedMailThreadId();

  return useMemo(
    (): VirtualListKeyboardDelegate => ({
      onKeyDown(event) {
        switch (event.code) {
          case 'ArrowLeft':
            return onArrowLeft?.(event);
          case 'ArrowRight':
            return onArrowRight?.(event);
          case 'ArrowUp':
          case 'ArrowDown': {
            event.preventDefault();
            event.stopPropagation();

            const numItems = dataSource.getNumItems();
            if (numItems === 0) {
              return;
            }

            const theSelectedThreadId = selectedThreadId.get();
            let index =
              theSelectedThreadId !== undefined && theSelectedThreadId !== 'initial'
                ? dataSource.getIndexOfItemWithKey(theSelectedThreadId)
                : 0;
            if (index < 0) {
              // Select the first thread
              for (index = 0; index < numItems; index += 1) {
                const cursor = dataSource.getItemAtIndex(index);
                switch (cursor.type) {
                  case 'mail-thread':
                    selectedThreadId.set(cursor.id);
                    return;
                  case 'mail-thread-placeholder':
                    return; // Nothing to do
                }
              }
              return;
            }

            switch (event.code) {
              case 'ArrowUp': {
                while (index - 1 >= 0) {
                  const cursor = dataSource.getItemAtIndex(index - 1);
                  switch (cursor.type) {
                    case 'mail-thread':
                      selectedThreadId.set(cursor.id);
                      return;
                    case 'mail-thread-placeholder':
                      return; // Nothing to do
                  }

                  index -= 1;
                }
                break;
              }

              case 'ArrowDown': {
                const numItems = dataSource.getNumItems();
                while (index + 1 < numItems) {
                  const cursor = dataSource.getItemAtIndex(index + 1);
                  switch (cursor.type) {
                    case 'mail-thread':
                      selectedThreadId.set(cursor.id);
                      return;
                    case 'mail-thread-placeholder':
                      return; // Nothing to do
                  }

                  index += 1;
                }
                break;
              }
            }

            break;
          }
        }
      }
    }),
    [dataSource, onArrowLeft, onArrowRight, selectedThreadId]
  );
};
