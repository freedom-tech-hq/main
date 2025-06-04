import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import type { DataSource } from 'freedom-data-source';
import type { ThreadLikeId } from 'freedom-email-user';
import { mailThreadIdInfo } from 'freedom-email-user';
import type { VirtualListDelegate } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import { useMemo } from 'react';

import { MailThreadListItem } from './MailThreadListItem.tsx';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';
import { useMailCollectionSelectionDelegate } from './useMailThreadsListSelectionDelegate.ts';

export const useMailCollectionDelegate = (
  dataSource: DataSource<MailThreadsListThreadDataSourceItem, ThreadLikeId>,
  {
    onThreadClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onThreadClicked: (threadLikeId: ThreadLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailThreadsListThreadDataSourceItem, ThreadLikeId, 'mail-thread'> => {
  const selectionDelegate = useMailCollectionSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MailThreadsListThreadDataSourceItem, ThreadLikeId, 'mail-thread'> => ({
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
      renderLoadingIndicator: () => (
        <ListItem sx={{ justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </ListItem>
      ),
      onKeyDown: selectionDelegate.onKeyDown
    }),
    [dataSource, onThreadClicked, selectionDelegate]
  );
};

const itemPrototypes = {
  'mail-thread': {
    defaultEstimatedSizePx: 113,
    isSizeDynamic: false,
    Component: () => <MailThreadListItem id={mailThreadIdInfo.make()} timeMSec={Date.now()} tag={undefined} onClick={noop} />
  }
};
