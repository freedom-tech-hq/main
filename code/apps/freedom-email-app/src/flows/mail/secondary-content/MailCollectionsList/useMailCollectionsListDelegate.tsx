import { ListItem, ListItemText } from '@mui/material';
import type { DataSource } from 'freedom-data-source';
import type { CollectionLikeId, MailCollection } from 'freedom-email-user';
import { makeCollectionLikeIdForCollection } from 'freedom-email-user';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { VirtualListDelegate } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import React, { useMemo } from 'react';

import { MailCollectionListItem, MailCollectionListItemPlaceholder } from './MailCollectionListItem.tsx';
import type { MailCollectionsListCollectionDataSourceItem } from './MailCollectionsListCollectionDataSourceItem.ts';
import { useMailCollectionsListSelectionDelegate } from './useMailCollectionsListSelectionDelegate.ts';

const ns = 'ui';
const $noCollectionsFound = LOCALIZE('No Collections Found')({ ns });

export const useMailCollectionsListDelegate = (
  dataSource: DataSource<MailCollectionsListCollectionDataSourceItem, CollectionLikeId>,
  {
    onCollectionClicked,
    onArrowLeft,
    onArrowRight
  }: {
    onCollectionClicked: (collectionId: CollectionLikeId) => void;
    onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  }
): VirtualListDelegate<MailCollectionsListCollectionDataSourceItem, CollectionLikeId, 'collection'> => {
  const t = useT();

  const selectionDelegate = useMailCollectionsListSelectionDelegate(dataSource, { onArrowLeft, onArrowRight });

  return useMemo(
    (): VirtualListDelegate<MailCollectionsListCollectionDataSourceItem, CollectionLikeId, 'collection'> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, _index) => {
        switch (item.type) {
          case 'collection':
            return <MailCollectionListItem {...item} tag={item.id} onClick={onCollectionClicked} />;
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
          <MailCollectionListItemPlaceholder />
          <MailCollectionListItemPlaceholder />
          <MailCollectionListItemPlaceholder />
          <MailCollectionListItemPlaceholder />
          <MailCollectionListItemPlaceholder />
        </>
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
  }
};
