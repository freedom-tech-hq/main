import type { CollectionLikeId } from 'freedom-email-user';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect, useCallbackRef } from 'react-bindings';

import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { VirtualList } from '../../virtual-list/components/VirtualList.tsx';
import type { VirtualListControls } from '../../virtual-list/types/VirtualListControls.ts';
import { useMailCollectionsListDataSource } from '../hooks/useMailCollectionsListDataSource.ts';
import { useMailCollectionsListDelegate } from '../hooks/useMailCollectionsListDelegate.tsx';
import type { MailCollectionsListDataSourceKey } from '../types/MailCollectionsListDataSourceKey.ts';

export interface MailCollectionsListProps {
  scrollParent: HTMLElement | string;
  controls?: VirtualListControls<MailCollectionsListDataSourceKey>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailCollectionsList = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MailCollectionsListProps) => {
  const mailCollectionsDataSource = useMailCollectionsListDataSource();
  const selectedCollectionId = useSelectedMailCollectionId();

  const listControls = useRef<VirtualListControls<MailCollectionsListDataSourceKey>>({});

  const selectFirstCollectionIfNothingIsSelected = useCallbackRef(() => {
    if (selectedCollectionId.get() !== undefined) {
      return;
    }

    const numItems = mailCollectionsDataSource.getNumItems();
    for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
      const item = mailCollectionsDataSource.getItemAtIndex(itemIndex);
      if (item.type === 'collection') {
        return selectedCollectionId.set(item.id);
      }
    }
  });

  useMemo(selectFirstCollectionIfNothingIsSelected, [selectFirstCollectionIfNothingIsSelected]);

  useEffect(() =>
    mailCollectionsDataSource.addListener('loadingStateChanged', () => {
      // TODO: TEMP
      selectFirstCollectionIfNothingIsSelected();
    })
  );

  const onCollectionClicked = useCallbackRef((collectionId: CollectionLikeId) => {
    if (selectedCollectionId.get() === collectionId) {
      // If this item was already selected and the collection list had focus, deselect the item
      if (listControls.current.hasFocus?.() ?? false) {
        selectedCollectionId.set(undefined);
      }
    } else {
      selectedCollectionId.set(collectionId);
    }
  });

  useBindingEffect(selectedCollectionId, (selectedCollectionId) => {
    if (selectedCollectionId === undefined) {
      return;
    }

    listControls.current.scrollToItemWithKey?.(selectedCollectionId);
  });

  const mailCollectionsDelegate = useMailCollectionsListDelegate(mailCollectionsDataSource, {
    onCollectionClicked,
    onArrowLeft,
    onArrowRight
  });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return (
    <VirtualList
      scrollParent={scrollParent}
      dataSource={mailCollectionsDataSource}
      delegate={mailCollectionsDelegate}
      controls={listControls.current}
    />
  );
};
