import type { MailThreadLikeId, MessageFolder } from 'freedom-email-api';
import type { VirtualListControls } from 'freedom-web-virtual-list';
import { VirtualList } from 'freedom-web-virtual-list';
import React, { useEffect, useMemo, useRef } from 'react';
import type { Binding, TypeOrBindingType } from 'react-bindings';
import { ifBinding, resolveTypeOrBindingType, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { useScrollParentInsetBottomPx, useScrollParentInsetTopPx } from '../../../../contexts/scroll-parent-info.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import { SelectedMessageFolderProvider } from '../../../../contexts/selected-message-folder.tsx';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';
import { useMailThreadsListDataSource } from './useMailThreadsListDataSource.ts';
import { useMailThreadsListDelegate } from './useMailThreadsListDelegate.tsx';

export interface MailThreadsListProps {
  folder: TypeOrBindingType<MessageFolder | undefined>;
  estThreadCount: Binding<number>;
  scrollParent: HTMLElement | string | Window;
  controls?: VirtualListControls<MessageFolder>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailThreadsList = ({ folder, ...fwd }: MailThreadsListProps) => {
  const lastDefinedSelectedMessageFolder = useBinding(() => resolveTypeOrBindingType(folder), {
    id: 'lastDefinedSelectedMessageFolder',
    detectChanges: true
  });

  useBindingEffect(
    ifBinding(folder),
    () => {
      const resolvedFolder = resolveTypeOrBindingType(folder);
      if (resolvedFolder !== undefined) {
        lastDefinedSelectedMessageFolder.set(resolvedFolder);
      }
    },
    { triggerOnMount: true, limitType: 'none' }
  );

  return (
    <SelectedMessageFolderProvider selectedMessageFolder={lastDefinedSelectedMessageFolder}>
      <InternalMailThreadsList {...fwd} />
    </SelectedMessageFolderProvider>
  );
};

// Helpers

const InternalMailThreadsList = ({
  estThreadCount,
  scrollParent,
  controls,
  onArrowLeft,
  onArrowRight
}: Omit<MailThreadsListProps, 'folder'>) => {
  const dataSource = useMailThreadsListDataSource({ estThreadCount });
  const selectedThreadId = useSelectedMailThreadId();
  const scrollAreaInsetBottomPx = useScrollParentInsetBottomPx();
  const scrollAreaInsetTopPx = useScrollParentInsetTopPx();

  const listControls = useRef<VirtualListControls<MailThreadsListKey>>({});

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

    if (!dataSource.isLoading()[0] && theSelectedThreadId === 'initial') {
      selectedThreadId.set(undefined);
    }
  });

  useMemo(selectFirstMailIfNothingIsSelected, [selectFirstMailIfNothingIsSelected]);

  useEffect(() =>
    dataSource.addListener('loadingStateChanged', () => {
      selectFirstMailIfNothingIsSelected();
    })
  );

  const onThreadClicked = useCallbackRef((threadLikeId: MailThreadLikeId) => {
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

    listControls.current.scrollToItemWithKey?.(selectedThreadId, {
      scrollAreaInsets: { top: scrollAreaInsetTopPx.get(), bottom: scrollAreaInsetBottomPx.get() }
    });
  });

  const delegate = useMailThreadsListDelegate(dataSource, { onThreadClicked, onArrowLeft, onArrowRight });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} controls={listControls.current} />;
};
