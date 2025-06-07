import { ListItem, ListItemText } from '@mui/material';
import type { MailThreadLikeId } from 'freedom-email-api';
import type { VirtualListDelegate, VirtualListItemPrototype } from 'freedom-web-virtual-list';
import React, { useMemo } from 'react';

import type { MailThreadsListDataSourceItem } from './MailThreadsListDataSourceItem.ts';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';
import type { MailThreadsListTemplateId } from './MailThreadsListTemplateId.ts';
import { MailThreadListItem, MailThreadListItemPlaceholder } from './primary-components/MailThreadListItem.tsx';
import type { MailThreadsListDataSource } from './useMailThreadsListDataSource.ts';
import { useMailThreadsListSelectionDelegate } from './useMailThreadsListSelectionDelegate.ts';

export const useMailThreadsListDelegate = (
  dataSource: MailThreadsListDataSource,
  {
    onThreadClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onThreadClicked: (threadLikeId: MailThreadLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailThreadsListDataSourceItem, MailThreadsListKey, MailThreadsListTemplateId> => {
  const selectionDelegate = useMailThreadsListSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MailThreadsListDataSourceItem, MailThreadsListKey, MailThreadsListTemplateId> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, index) => {
        switch (item.type) {
          case 'mail-thread':
            return <MailThreadListItem {...item} tag={item.id} onClick={onThreadClicked} />;
          case 'mail-thread-placeholder':
            dataSource.loadMore(index);
            return <MailThreadListItemPlaceholder />;
        }
      },
      renderEmptyIndicator: () => (
        <ListItem>
          <ListItemText secondary="No Mail Found" />
        </ListItem>
      ),
      loadingIndicatorTransitionDurationMSec: 0,
      renderLoadingIndicator: () => (
        <>
          <MailThreadListItemPlaceholder />
          <MailThreadListItemPlaceholder />
          <MailThreadListItemPlaceholder />
          <MailThreadListItemPlaceholder />
          <MailThreadListItemPlaceholder />
        </>
      ),
      onKeyDown: selectionDelegate.onKeyDown
    }),
    [dataSource, onThreadClicked, selectionDelegate]
  );
};

const itemPrototypes: Record<MailThreadsListTemplateId, VirtualListItemPrototype> = {
  'mail-thread': {
    defaultEstimatedSizePx: 154,
    isSizeDynamic: false,
    Component: () => <MailThreadListItemPlaceholder />
  },
  'mail-thread-placeholder': {
    defaultEstimatedSizePx: 154,
    isSizeDynamic: false,
    Component: () => <MailThreadListItemPlaceholder />
  }
};
