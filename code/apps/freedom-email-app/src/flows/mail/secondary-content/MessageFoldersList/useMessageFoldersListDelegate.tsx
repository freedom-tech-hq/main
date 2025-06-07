import { ListItem, ListItemText } from '@mui/material';
import type { MessageFolder } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { VirtualListDelegate, VirtualListItemPrototype } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import React, { useMemo } from 'react';

import type { MessageFoldersListDataSourceItem } from './MessageFoldersListDataSourceItem.ts';
import type { MessageFoldersListKey } from './MessageFoldersListKey.ts';
import type { MessageFoldersListTemplateId } from './MessageFoldersListTemplateId.ts';
import { MessageFoldersListItem, MessageFoldersListItemPlaceholder } from './primary-components/MessageFoldersListItem.tsx';
import type { MessageFoldersListDataSource } from './useMessageFoldersListDataSource.ts';
import { useMessageFoldersListSelectionDelegate } from './useMessageFoldersListSelectionDelegate.ts';

const ns = 'ui';
const $noCollectionsFound = LOCALIZE('No Collections Found')({ ns });

export const useMessageFoldersListDelegate = (
  dataSource: MessageFoldersListDataSource,
  {
    onFolderClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onFolderClicked: (folder: MessageFolder) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MessageFoldersListDataSourceItem, MessageFoldersListKey, MessageFoldersListTemplateId> => {
  const t = useT();

  const selectionDelegate = useMessageFoldersListSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MessageFoldersListDataSourceItem, MessageFoldersListKey, MessageFoldersListTemplateId> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, _index) => {
        switch (item.type) {
          case 'folder':
            return <MessageFoldersListItem {...item} tag={item.folder} onClick={onFolderClicked} />;
        }
      },
      renderEmptyIndicator: () => (
        <ListItem>
          <ListItemText secondary={$noCollectionsFound(t)} />
        </ListItem>
      ),
      loadingIndicatorTransitionDurationMSec: 0,
      renderLoadingIndicator: () => (
        <>
          <MessageFoldersListItemPlaceholder />
          <MessageFoldersListItemPlaceholder />
          <MessageFoldersListItemPlaceholder />
          <MessageFoldersListItemPlaceholder />
          <MessageFoldersListItemPlaceholder />
        </>
      ),
      onKeyDown: selectionDelegate.onKeyDown
    }),
    [dataSource, onFolderClicked, selectionDelegate.onKeyDown, t]
  );
};

const itemPrototypes: Record<MessageFoldersListTemplateId, VirtualListItemPrototype> = {
  folder: {
    defaultEstimatedSizePx: 48,
    isSizeDynamic: false,
    Component: () => <MessageFoldersListItem folder="inbox" unreadCount={0} tag={undefined} onClick={noop} />
  }
};
