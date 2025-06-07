import type { VirtualListKeyboardDelegate } from 'freedom-web-virtual-list';
import { useMemo } from 'react';

import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import type { MessageFoldersListDataSource } from './useMessageFoldersListDataSource.ts';

export const useMessageFoldersListSelectionDelegate = (
  dataSource: MessageFoldersListDataSource,
  {
    onArrowLeft,
    onArrowRight
  }: {
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  } = {}
) => {
  const selectedMessageFolder = useSelectedMessageFolder();

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

            const theSelectedCollectionId = selectedMessageFolder.get();
            let index = theSelectedCollectionId !== undefined ? dataSource.getIndexOfItemWithKey(theSelectedCollectionId) : 0;
            if (index < 0) {
              // Select the first collection
              for (index = 0; index < numItems; index += 1) {
                const cursor = dataSource.getItemAtIndex(index);
                switch (cursor.type) {
                  case 'folder':
                    selectedMessageFolder.set(cursor.folder);
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
                    case 'folder':
                      selectedMessageFolder.set(cursor.folder);
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
                    case 'folder':
                      selectedMessageFolder.set(cursor.folder);
                      return;
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
    [dataSource, onArrowLeft, onArrowRight, selectedMessageFolder]
  );
};
