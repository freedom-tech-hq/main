import { useEffect, useMemo, useRef } from 'react';
import { useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { SelectedMailCollectionProvider, useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import type { MailThreadId } from '../../mail-types/MailThreadId.ts';
import { VirtualList } from '../../virtual-list/components/VirtualList.tsx';
import type { VirtualListControls } from '../../virtual-list/types/VirtualListControls.ts';
import { useMailCollectionDataSource } from '../hooks/useMailCollectionDataSource.ts';
import { useMailCollectionDelegate } from '../hooks/useMailCollectionDelegate.tsx';

export interface MailCollectionProps {
  scrollParent: HTMLElement | string;
  controls?: VirtualListControls<MailThreadId>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailCollection = (fwd: MailCollectionProps) => {
  const selectedCollectionId = useSelectedMailCollectionId();
  const lastSelectedCollectionId = useBinding(() => selectedCollectionId.get(), { id: 'lastSelectedCollectionId', detectChanges: true });

  useBindingEffect(
    selectedCollectionId,
    (selectedCollectionId) => {
      if (selectedCollectionId !== undefined) {
        lastSelectedCollectionId.set(selectedCollectionId);
      }
    },
    { triggerOnMount: true, limitType: 'none' }
  );

  return (
    <SelectedMailCollectionProvider selectedMailCollectionId={lastSelectedCollectionId}>
      <InternalMailList {...fwd} />
    </SelectedMailCollectionProvider>
  );
};

// Helpers

const InternalMailList = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MailCollectionProps) => {
  const mailDataSource = useMailCollectionDataSource();
  const selectedThreadId = useSelectedMailThreadId();

  const listControls = useRef<VirtualListControls<MailThreadId>>({});

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

  const onThreadClicked = useCallbackRef((threadId: MailThreadId) => {
    if (selectedThreadId.get() === threadId) {
      // If this item was already selected and the thread list had focus, deselect the item
      if (listControls.current.hasFocus?.() ?? false) {
        selectedThreadId.set(undefined);
      }
    } else {
      selectedThreadId.set(threadId);
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
