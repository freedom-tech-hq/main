import type { CollectionLikeId, ThreadLikeId } from 'freedom-email-user';
import type { VirtualListControls } from 'freedom-web-virtual-list';
import { VirtualList } from 'freedom-web-virtual-list';
import React, { useEffect, useMemo, useRef } from 'react';
import { ifBinding, resolveTypeOrBindingType, type TypeOrBindingType, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { SelectedMailCollectionIdProvider } from '../../../../contexts/selected-mail-collection-id.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import { useMailCollectionDataSource } from './useMailThreadsListDataSource.ts';
import { useMailCollectionDelegate } from './useMailThreadsListDelegate.tsx';

export interface MailThreadsListProps {
  collectionId: TypeOrBindingType<CollectionLikeId | 'initial' | undefined>;
  scrollParent: HTMLElement | string | Window;
  controls?: VirtualListControls<CollectionLikeId>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailThreadsList = ({ collectionId, ...fwd }: MailThreadsListProps) => {
  const lastDefinedCollectionId = useBinding(() => resolveTypeOrBindingType(collectionId), {
    id: 'lastDefinedCollectionId',
    detectChanges: true
  });

  useBindingEffect(
    ifBinding(collectionId),
    () => {
      const resolvedCollectionId = resolveTypeOrBindingType(collectionId);
      if (resolvedCollectionId !== undefined) {
        lastDefinedCollectionId.set(resolvedCollectionId);
      }
    },
    { triggerOnMount: true, limitType: 'none' }
  );

  return (
    <SelectedMailCollectionIdProvider selectedMailCollectionId={lastDefinedCollectionId}>
      <InternalMailThreadsList {...fwd} />
    </SelectedMailCollectionIdProvider>
  );
};

// Helpers

const InternalMailThreadsList = ({ scrollParent, controls, onArrowLeft, onArrowRight }: Omit<MailThreadsListProps, 'collectionId'>) => {
  const dataSource = useMailCollectionDataSource();
  const selectedThreadId = useSelectedMailThreadId();

  const listControls = useRef<VirtualListControls<ThreadLikeId>>({});

  const selectFirstMailIfNothingIsSelected = useCallbackRef(() => {
    const theSelectedThreadId = selectedThreadId.get();
    if (theSelectedThreadId !== undefined && theSelectedThreadId !== 'initial') {
      return;
    }

    const numItems = dataSource.getNumItems();
    for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
      const item = dataSource.getItemAtIndex(itemIndex);
      if (item.type === 'mail-thread') {
        return selectedThreadId.set(item.id);
      }
    }
  });

  useMemo(selectFirstMailIfNothingIsSelected, [selectFirstMailIfNothingIsSelected]);

  useEffect(() =>
    dataSource.addListener('loadingStateChanged', () => {
      selectFirstMailIfNothingIsSelected();
    })
  );

  const onThreadClicked = useCallbackRef((threadLikeId: ThreadLikeId) => {
    if (selectedThreadId.get() === threadLikeId) {
      // If this item was already selected and the thread list had focus, deselect the item
      if (listControls.current.hasFocus?.() ?? false) {
        selectedThreadId.set(undefined);
      }
    } else {
      selectedThreadId.set(threadLikeId);
    }
  });

  useBindingEffect(selectedThreadId, (selectedThreadId) => {
    if (selectedThreadId === undefined || selectedThreadId === 'initial') {
      return;
    }

    listControls.current.scrollToItemWithKey?.(selectedThreadId);
  });

  const delegate = useMailCollectionDelegate(dataSource, { onThreadClicked, onArrowLeft, onArrowRight });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} controls={listControls.current} />;
};
