import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import type { ThreadLikeId } from 'freedom-email-user';
import { mailThreadIdInfo } from 'freedom-email-user';
import { noop } from 'lodash-es';
import { useMemo } from 'react';

import type { DataSource } from '../../../types/DataSource.ts';
import type { VirtualListDelegate } from '../../virtual-list/types/VirtualListDelegate.ts';
import { MailThreadListItem } from '../components/MailThreadListItem.tsx';
import type { MailCollectionDataSourceItem } from '../types/MailCollectionDataSourceItem.ts';
import { useMailCollectionSelectionDelegate } from './useMailCollectionSelectionDelegate.ts';

export const useMailCollectionDelegate = (
  dataSource: DataSource<MailCollectionDataSourceItem, ThreadLikeId>,
  {
    onThreadClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onThreadClicked: (threadLikeId: ThreadLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailCollectionDataSourceItem, ThreadLikeId, 'mail-thread'> => {
  const selectionDelegate = useMailCollectionSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MailCollectionDataSourceItem, ThreadLikeId, 'mail-thread'> => ({
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
