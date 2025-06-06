import { ListItem, ListItemText } from '@mui/material';
import type { DataSource } from 'freedom-data-source';
import type { MailThreadLikeId } from 'freedom-email-api';
import type { VirtualListDelegate, VirtualListItemPrototype } from 'freedom-web-virtual-list';
import React, { useMemo } from 'react';

import { MailThreadListItem, MailThreadListItemPlaceholder } from './MailThreadListItem.tsx';
import type { MailThreadsListKey } from './MailThreadsListKey.ts';
import type { MailThreadsListTemplateId } from './MailThreadsListTemplateId.ts';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';
import { useMailThreadsListSelectionDelegate } from './useMailThreadsListSelectionDelegate.ts';

export const useMailThreadsListDelegate = (
  dataSource: DataSource<MailThreadsListThreadDataSourceItem, MailThreadsListKey>,
  {
    onThreadClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onThreadClicked: (threadLikeId: MailThreadLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailThreadsListThreadDataSourceItem, MailThreadsListKey, MailThreadsListTemplateId> => {
  const selectionDelegate = useMailThreadsListSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MailThreadsListThreadDataSourceItem, MailThreadsListKey, MailThreadsListTemplateId> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, _index) => {
        switch (item.type) {
          case 'mail-thread':
            return <MailThreadListItem {...item} tag={item.id} onClick={onThreadClicked} />;
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
  }
};
