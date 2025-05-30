import type { CollectionLikeId } from 'freedom-email-user';
import type { VirtualListControls } from 'freedom-web-virtual-list';
import { VirtualList } from 'freedom-web-virtual-list';
import React, { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect, useCallbackRef } from 'react-bindings';

import { useSelectedMailCollectionId } from '../../../../contexts/selected-mail-collection.tsx';
import { useMailCollectionsListDataSource } from './useMailCollectionsListDataSource.ts';
import { useMailCollectionsListDelegate } from './useMailCollectionsListDelegate.tsx';

export interface MailCollectionsListProps {
  scrollParent: HTMLElement | string | Window;
  controls?: VirtualListControls<CollectionLikeId>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailCollectionsList = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MailCollectionsListProps) => {
  const dataSource = useMailCollectionsListDataSource();
  const selectedCollectionId = useSelectedMailCollectionId();

  const listControls = useRef<VirtualListControls<CollectionLikeId>>({});

  const selectFirstCollectionIfNothingIsSelected = useCallbackRef(() => {
    if (selectedCollectionId.get() !== undefined) {
      return;
    }

    const numItems = dataSource.getNumItems();
    for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
      const item = dataSource.getItemAtIndex(itemIndex);
      if (item.type === 'collection') {
        return selectedCollectionId.set(item.id);
      }
    }
  });

  useMemo(selectFirstCollectionIfNothingIsSelected, [selectFirstCollectionIfNothingIsSelected]);

  useEffect(() =>
    dataSource.addListener('loadingStateChanged', () => {
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

  const delegate = useMailCollectionsListDelegate(dataSource, {
    onCollectionClicked,
    onArrowLeft,
    onArrowRight
  });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} controls={listControls.current} />;
};
