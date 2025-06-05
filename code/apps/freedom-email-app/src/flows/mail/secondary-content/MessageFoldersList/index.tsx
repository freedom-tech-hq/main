import type { MessageFolder } from 'freedom-email-api';
import type { VirtualListControls } from 'freedom-web-virtual-list';
import { VirtualList } from 'freedom-web-virtual-list';
import React, { useRef } from 'react';
import { useBindingEffect, useCallbackRef } from 'react-bindings';

import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import type { MessageFoldersListKey } from './MessageFoldersListKey.ts';
import { useMessageFoldersListDataSource } from './useMessageFoldersListDataSource.ts';
import { useMessageFoldersListDelegate } from './useMessageFoldersListDelegate.tsx';

export interface MessageFoldersListProps {
  scrollParent: HTMLElement | string | Window;
  controls?: VirtualListControls<MessageFoldersListKey>;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MessageFoldersList = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MessageFoldersListProps) => {
  const dataSource = useMessageFoldersListDataSource();
  const selectedMessageFolder = useSelectedMessageFolder();

  const listControls = useRef<VirtualListControls<MessageFoldersListKey>>({});

  const onFolderClicked = useCallbackRef((folder: MessageFolder) => {
    if (selectedMessageFolder.get() === folder) {
      // If this item was already selected and the folder list had focus, deselect the item
      if (listControls.current.hasFocus?.() ?? false) {
        selectedMessageFolder.set(undefined);
      }
    } else {
      selectedMessageFolder.set(folder);
    }
  });

  useBindingEffect(selectedMessageFolder, (selectedMessageFolder) => {
    if (selectedMessageFolder === undefined) {
      return;
    }

    listControls.current.scrollToItemWithKey?.(selectedMessageFolder);
  });

  const delegate = useMessageFoldersListDelegate(dataSource, { onFolderClicked, onArrowLeft, onArrowRight });

  if (controls !== undefined) {
    controls.focus = () => listControls.current.focus?.();
    controls.hasFocus = () => listControls.current.hasFocus?.() ?? false;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} controls={listControls.current} />;
};
