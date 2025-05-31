import type { DataSource } from 'freedom-data-source';
import type { CollectionLikeId } from 'freedom-email-user';
import type { VirtualListKeyboardDelegate } from 'freedom-web-virtual-list';
import { useMemo } from 'react';

import { useSelectedMailCollectionId } from '../../../../contexts/selected-mail-collection.tsx';
import type { MailCollectionsListCollectionDataSourceItem } from './MailCollectionsListCollectionDataSourceItem.ts';

export const useMailCollectionsListSelectionDelegate = (
  dataSource: DataSource<MailCollectionsListCollectionDataSourceItem, CollectionLikeId>,
  {
    onArrowLeft,
    onArrowRight
  }: {
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  } = {}
) => {
  const selectedCollectionId = useSelectedMailCollectionId();

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

            const theSelectedCollectionId = selectedCollectionId.get();
            let index =
              theSelectedCollectionId !== undefined && theSelectedCollectionId !== 'initial'
                ? dataSource.getIndexOfItemWithKey(theSelectedCollectionId)
                : 0;
            if (index < 0) {
              // Select the first collection
              for (index = 0; index < numItems; index += 1) {
                const cursor = dataSource.getItemAtIndex(index);
                switch (cursor.type) {
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
                    case 'collection':
                      selectedCollectionId.set(cursor.id);
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
    [dataSource, onArrowLeft, onArrowRight, selectedCollectionId]
  );
};
