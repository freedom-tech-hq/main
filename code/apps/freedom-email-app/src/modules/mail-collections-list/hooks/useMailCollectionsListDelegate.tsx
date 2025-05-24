import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import type { DataSource } from 'freedom-data-source';
import type { CollectionLikeId, MailCollection } from 'freedom-email-user';
import { mailCollectionGroupIdInfo, makeCollectionLikeIdForCollection } from 'freedom-email-user';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { VirtualListDelegate } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import { useMemo } from 'react';

import { MailCollectionGroupTitleListItem } from '../components/MailCollectionGroupTitleListItem.tsx';
import { MailCollectionListItem } from '../components/MailCollectionListItem.tsx';
import { MailCollectionSeparatorListItem } from '../components/MailCollectionSeparatorListItem.tsx';
import type { MailCollectionsListDataSourceItem } from '../types/MailCollectionsListDataSourceItem.ts';
import type { MailCollectionsListDataSourceKey } from '../types/MailCollectionsListDataSourceKey.ts';
import { useMailCollectionsListSelectionDelegate } from './useMailCollectionsListSelectionDelegate.ts';

const ns = 'ui';
const $noCollectionsFound = LOCALIZE('No Collections Found')({ ns });

export const useMailCollectionsListDelegate = (
  dataSource: DataSource<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey>,
  {
    onCollectionClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onCollectionClicked: (collectionId: CollectionLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailCollectionsListDataSourceItem, MailCollectionsListDataSourceKey, 'collection' | 'separator' | 'group-title'> => {
  const t = useT();

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
          <ListItemText secondary={$noCollectionsFound(t)} />
        </ListItem>
      ),
      renderLoadingIndicator: () => (
        <ListItem sx={{ justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </ListItem>
      ),
      onKeyDown: selectionDelegate.onKeyDown
    }),
    [dataSource, onCollectionClicked, selectionDelegate.onKeyDown, t]
  );
};

const prototypeCollection: MailCollection = {
  collectionType: 'inbox',
  title: 'Prototype',
  unreadCount: 0
};
const itemPrototypes = {
  collection: {
    defaultEstimatedSizePx: 48,
    isSizeDynamic: false,
    Component: () => (
      <MailCollectionListItem
        id={makeCollectionLikeIdForCollection(prototypeCollection)}
        collection={prototypeCollection}
        tag={undefined}
        onClick={noop}
      />
    )
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
