import { useMemo } from 'react';
import { useLimiter } from 'react-bindings';

import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import type { DataSource } from '../../../types/DataSource.ts';
import type { VirtualListKeyboardDelegate } from '../../virtual-list/types/VirtualListKeyboardDelegate.ts';
import type { MailCollectionsListDataSourceItem } from '../types/MailCollectionsListDataSourceItem.ts';
import type { MailCollectionsListDataSourceKey } from '../types/MailCollectionsListDataSourceKey.ts';

const REPEAT_KEY_DELAY_MSEC = 75;

export const useMailCollectionsListSelectionDelegate = (
  dataSource: DataSource<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey>,
  {
    onArrowLeft,
    onArrowRight
  }: {
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  } = {}
) => {
  const selectedCollectionId = useSelectedMailCollectionId();

  const keyRepeatLimiter = useLimiter({ id: 'key-repeat-throttle', limitType: 'throttle', limitMSec: REPEAT_KEY_DELAY_MSEC });

  return useMemo(
    (): VirtualListKeyboardDelegate => ({
      onKeyDown(event) {
        switch (event.code) {
          case 'ArrowLeft':
            return onArrowLeft?.(event);
          case 'ArrowRight':
            return onArrowRight?.(event);
          case 'ArrowUp':
          case 'ArrowDown':
            event.preventDefault();
            event.stopPropagation();

            keyRepeatLimiter.limit(() => {
              const numItems = dataSource.getNumItems();
              if (numItems === 0) {
                return;
              }

              const theSelectedCollectionId = selectedCollectionId.get();
              let index = theSelectedCollectionId !== undefined ? dataSource.getIndexOfItemWithKey(theSelectedCollectionId) : 0;
              if (index < 0) {
                // Select the first collection
                for (index = 0; index < numItems; index += 1) {
                  const cursor = dataSource.getItemAtIndex(index);
                  switch (cursor.type) {
                    case 'group-title':
                    case 'separator':
                      break;
                    case 'collection':
                      selectedCollectionId.set(cursor.id);
                      return;
                  }
                }
                return;
              }

              switch (event.code) {
                case 'ArrowUp': {
                  while (index - 1 >= 0) {
                    const cursor = dataSource.getItemAtIndex(index - 1);
                    switch (cursor.type) {
                      case 'group-title':
                      case 'separator':
                        break;
                      case 'collection':
                        selectedCollectionId.set(cursor.id);
                        return;
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
                      case 'group-title':
                      case 'separator':
                        break;
                      case 'collection':
                        selectedCollectionId.set(cursor.id);
                        return;
                    }

                    index += 1;
                  }
                  break;
                }
              }
            });
        }
      }
    }),
    [dataSource, keyRepeatLimiter, onArrowLeft, onArrowRight, selectedCollectionId]
  );
};
