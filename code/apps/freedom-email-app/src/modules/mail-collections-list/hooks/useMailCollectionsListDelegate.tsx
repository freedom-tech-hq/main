import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import { noop } from 'lodash-es';
import { useMemo } from 'react';

import type { DataSource } from '../../../types/DataSource.ts';
import type { MailCollection } from '../../mail-types/MailCollection.ts';
import { mailCollectionGroupIdInfo } from '../../mail-types/MailCollectionGroupId.ts';
import { type MailCollectionId, mailCollectionIdInfo } from '../../mail-types/MailCollectionId.ts';
import type { VirtualListDelegate } from '../../virtual-list/types/VirtualListDelegate.ts';
import { MailCollectionGroupTitleListItem } from '../components/MailCollectionGroupTitleListItem.tsx';
import { MailCollectionListItem } from '../components/MailCollectionListItem.tsx';
import { MailCollectionSeparatorListItem } from '../components/MailCollectionSeparatorListItem.tsx';
import type { MailCollectionsListDataSourceItem } from '../types/MailCollectionsListDataSourceItem.ts';
import type { MailCollectionsListDataSourceKey } from '../types/MailCollectionsListDataSourceKey.ts';
import { useMailCollectionsListSelectionDelegate } from './useMailCollectionsListSelectionDelegate.ts';

export const useMailCollectionsListDelegate = (
  dataSource: DataSource<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey>,
  {
    onCollectionClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onCollectionClicked: (collectionId: MailCollectionId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey, 'collection' | 'separator' | 'group-title'> => {
  const selectionDelegate = useMailCollectionsListSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<
      MailCollectionsListDataSourceItem,
      MailCollectionsListDataSourceKey,
      'collection' | 'separator' | 'group-title'
    > => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, _index) => {
        switch (item.type) {
          case 'collection':
            return <MailCollectionListItem {...item} tag={item.id} onClick={onCollectionClicked} />;
          case 'separator':
            return <MailCollectionSeparatorListItem />;
          case 'group-title':
            return <MailCollectionGroupTitleListItem {...item} />;
        }
      },
      renderEmptyIndicator: () => (
        <ListItem>
          <ListItemText secondary="No Collections Found" />
        </ListItem>
      ),
      renderLoadingIndicator: () => (
        <ListItem sx={{ justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </ListItem>
      ),
      onKeyDown: selectionDelegate.onKeyDown
    }),
    [dataSource, onCollectionClicked, selectionDelegate.onKeyDown]
  );
};

const prototypeCollection: MailCollection = {
  id: mailCollectionIdInfo.make(),
  collectionType: 'inbox',
  title: 'Prototype',
  unreadCount: 0
};
const itemPrototypes = {
  collection: {
    defaultEstimatedSizePx: 48,
    isSizeDynamic: false,
    Component: () => <MailCollectionListItem id={prototypeCollection.id} collection={prototypeCollection} tag={undefined} onClick={noop} />
  },
  separator: {
    defaultEstimatedSizePx: 16,
    isSizeDynamic: false,
    Component: () => <MailCollectionSeparatorListItem />
  },
  'group-title': {
    defaultEstimatedSizePx: 20,
    isSizeDynamic: false,
    Component: () => <MailCollectionGroupTitleListItem id={mailCollectionGroupIdInfo.make()} title="Prototype" />
  }
};
