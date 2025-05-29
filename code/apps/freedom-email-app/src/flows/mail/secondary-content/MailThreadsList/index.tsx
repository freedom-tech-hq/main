import type { CollectionLikeId, ThreadLikeId } from 'freedom-email-user';
import type { VirtualListControls } from 'freedom-web-virtual-list';
import { VirtualList } from 'freedom-web-virtual-list';
import { useEffect, useMemo, useRef } from 'react';
import { ifBinding, resolveTypeOrBindingType, type TypeOrBindingType, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { SelectedMailCollectionIdProvider } from '../../../../contexts/selected-mail-collection.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread.tsx';
import { useMailCollectionDataSource } from './useMailThreadsListDataSource.ts';
import { useMailCollectionDelegate } from './useMailThreadsListDelegate.tsx';

export interface MailThreadsListProps {
  collectionId: TypeOrBindingType<CollectionLikeId | undefined>;
  scrollParent: HTMLElement | string | Window;
  controls?: VirtualListControls<CollectionLikeId>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailThreadsList = ({ collectionId, ...fwd }: MailThreadsListProps) => {
  const lastDefinedCollectionId = useBinding(() => resolveTypeOrBindingType(collectionId), {
    id: 'lastSelectedCollectionId',
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
  const mailDataSource = useMailCollectionDataSource();
  const selectedThreadId = useSelectedMailThreadId();

  const listControls = useRef<VirtualListControls<ThreadLikeId>>({});

  const selectFirstMailIfNothingIsSelected = useCallbackRef(() => {
    if (selectedThreadId.get() !== undefined) {
      return;
    }

    const numItems = mailDataSource.getNumItems();
    for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
      const item = mailDataSource.getItemAtIndex(itemIndex);
      if (item.type === 'mail-thread') {
        return selectedThreadId.set(item.id);
      }
    }
  });

  useMemo(selectFirstMailIfNothingIsSelected, [selectFirstMailIfNothingIsSelected]);

  useEffect(() =>
    mailDataSource.addListener('loadingStateChanged', () => {
      // TODO: TEMP
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
    if (selectedThreadId === undefined) {
      return;
    }

    listControls.current.scrollToItemWithKey?.(selectedThreadId);
  });

  const mailDelegate = useMailCollectionDelegate(mailDataSource, { onThreadClicked, onArrowLeft, onArrowRight });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={mailDataSource} delegate={mailDelegate} controls={listControls.current} />;
};
